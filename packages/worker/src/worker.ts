import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import os from "node:os";
import path from "node:path";
import fs from "node:fs/promises";
import { TRANSCODE_QUEUE, TranscodeJobPayload } from "./queue.js";
import { logger } from "./logger.js";
import { transcodeToHls, cleanupDir } from "./transcode.js";
import { downloadObjectToTempFile, uploadManyWithRetry } from "./oss.js";

const prisma = new PrismaClient();

const connection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : (() => {
      throw new Error("REDIS_URL is required for worker queue");
    })();

const processJob = async (job: Job<TranscodeJobPayload>) => {
  const { videoId, objectKey, originalUrl } = job.data;

  let transcodeDir: string | undefined;
  let sourceDir: string | undefined;
  try {
    const downloaded = await downloadObjectToTempFile(objectKey);
    sourceDir = downloaded.dir;
    logger.info("transcode.start", {
      videoId,
      jobId: job.id,
      attempt: job.attemptsMade + 1,
      objectKey,
      inputUrl: downloaded.url,
      originalUrl
    });
    const result = await transcodeToHls(downloaded.filePath);
    transcodeDir = result.baseDir;

    const hlsDir = path.dirname(result.hlsPath);
    const playlistName = path.basename(result.hlsPath);
    const baseKey = `videos/${videoId}/hls`;

    const entries = await fs.readdir(hlsDir);
    const uploadItems = entries.map((file) => {
      const ext = path.extname(file).toLowerCase();
      const mime = ext === ".m3u8" ? "application/vnd.apple.mpegurl" : ext === ".ts" ? "video/mp2t" : undefined;
      return { key: `${baseKey}/${file}`, filePath: path.join(hlsDir, file), mime };
    });

    const uploaded = await uploadManyWithRetry(uploadItems, 5, 3);
    const playlistUrl = uploaded[entries.findIndex((f) => f === playlistName)];

    const coverKey = `videos/${videoId}/cover.jpg`;
    const [coverUrl] = await uploadManyWithRetry([{ key: coverKey, filePath: result.coverPath, mime: "image/jpeg" }], 1, 3);

    await prisma.$transaction([
      prisma.videoAsset.updateMany({
        where: { videoId },
        data: {
          hlsUrl: playlistUrl,
          coverUrl,
          durationSec: result.durationSec,
          resolution: result.resolution
        }
      }),
      prisma.video.update({
        where: { id: videoId },
        data: {
          status: "review_pending",
          processingError: null,
          durationSec: result.durationSec
        }
      })
    ]);
    logger.info("transcode.completed", {
      videoId,
      jobId: job.id,
      playlistUrl,
      coverUrl,
      durationSec: result.durationSec,
      resolution: result.resolution
    });
  } finally {
    if (sourceDir) {
      const tmpPrefix = os.tmpdir();
      if (sourceDir.startsWith(tmpPrefix)) {
        await cleanupDir(sourceDir).catch(() => {});
      }
    }
    // best-effort cleanup of temp dir if within tmp path
    if (transcodeDir) {
      const tmpPrefix = os.tmpdir();
      if (transcodeDir.startsWith(tmpPrefix)) {
        await cleanupDir(transcodeDir).catch(() => {});
      }
    }
  }
};

const worker = new Worker<TranscodeJobPayload>(TRANSCODE_QUEUE, processJob, { connection });

worker.on("completed", (job) => {
  logger.info("transcode.job.completed", { jobId: job.id });
});

worker.on("failed", async (job, err) => {
  logger.error("transcode.job.failed", {
    jobId: job?.id,
    videoId: job?.data?.videoId,
    message: err.message,
    stack: err.stack
  });
  if (job?.data?.videoId) {
    await prisma.video.update({
      where: { id: job.data.videoId },
      data: { status: "uploaded", processingError: err.message }
    });
  }
});

logger.info("transcode.worker.started", { queue: TRANSCODE_QUEUE });

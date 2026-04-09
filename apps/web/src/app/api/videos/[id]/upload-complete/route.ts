import { NextRequest, NextResponse } from "next/server";
import { fail, logger, ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { validateUpload } from "@/lib/upload";
import { enqueueTranscodeJob } from "@/lib/queue";
import { publicUrl } from "@/lib/oss";

const schema = {
  parse: (input: any) => {
    const { key, sizeBytes, durationSec, mime } = input ?? {};
    if (!key || typeof sizeBytes !== "number" || !mime) {
      throw new Error("invalid parameters");
    }
    return { key, sizeBytes, durationSec, mime } as {
      key: string;
      sizeBytes: number;
      durationSec?: number;
      mime: string;
    };
  }
};

export const POST = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const videoId = params?.id;
  if (!videoId) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const auth = mustAuth(req);
  mustRole(auth, ["creator", "admin", "moderator"]);

  const body = schema.parse(await req.json());
  validateUpload({ mime: body.mime, sizeBytes: body.sizeBytes, durationSec: body.durationSec });

  const video = await prisma.video.findFirst({ where: { id: videoId, authorId: auth.userId } });
  if (!video) return NextResponse.json(fail(10004, "video not found"), { status: 404 });
  if (video.status !== "uploading") {
    return NextResponse.json(fail(10002, "invalid state"), { status: 409 });
  }

  const originalUrl = publicUrl(body.key);

  logger.info("upload.complete.received", {
    userId: auth.userId,
    videoId,
    objectKey: body.key,
    sizeBytes: body.sizeBytes,
    mime: body.mime
  });

  try {
    await prisma.$transaction([
      prisma.video.update({
        where: { id: videoId },
        data: {
          status: "uploaded",
          durationSec: body.durationSec,
          processingError: null
        }
      }),
      prisma.videoAsset.upsert({
        where: { videoId },
        update: {
          originalUrl,
          durationSec: body.durationSec,
          sizeBytes: body.sizeBytes,
          format: body.mime
        },
        create: {
          videoId,
          originalUrl,
          durationSec: body.durationSec,
          sizeBytes: body.sizeBytes,
          format: body.mime
        }
      })
    ]);

    await enqueueTranscodeJob({ videoId, originalUrl });

    logger.info("transcode.job.enqueued", {
      userId: auth.userId,
      videoId,
      originalUrl
    });

    await prisma.video.update({ where: { id: videoId }, data: { status: "transcoding" } });
  } catch (err) {
    logger.error("upload.complete.failed", {
      userId: auth.userId,
      videoId,
      message: (err as Error).message,
      stack: (err as Error).stack
    });
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "uploaded", processingError: (err as Error).message }
    });
    throw err;
  }

  return NextResponse.json(ok({ success: true }));
});

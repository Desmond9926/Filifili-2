import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const ffmpegBin = process.env.FFMPEG_PATH || "ffmpeg";
const ffprobeBin = process.env.FFPROBE_PATH || "ffprobe";

const run = (cmd: string, args: string[]) =>
  new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(cmd, args, (err, stdout, stderr) => {
      if (err) {
        const error = new Error(`${cmd} failed: ${stderr || err.message}`);
        return reject(error);
      }
      resolve({ stdout: stdout.toString(), stderr: stderr.toString() });
    });
  });

export interface MetadataResult {
  durationSec?: number;
  width?: number;
  height?: number;
}

export const probeMetadata = async (input: string): Promise<MetadataResult> => {
  const { stdout } = await run(ffprobeBin, [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    input
  ]);

  const json = JSON.parse(stdout) as {
    format?: { duration?: string };
    streams?: Array<{ width?: number; height?: number; codec_type?: string }>;
  };

  const videoStream = json.streams?.find((s) => s.codec_type === "video");
  const durationSec = json.format?.duration ? Math.floor(Number(json.format.duration)) : undefined;
  return {
    durationSec,
    width: videoStream?.width,
    height: videoStream?.height
  };
};

export interface TranscodeResult {
  hlsPath: string;
  coverPath: string;
  durationSec?: number;
  resolution?: string;
  baseDir: string;
}

export const transcodeToHls = async (input: string): Promise<TranscodeResult> => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "filifili-transcode-"));
  const hlsDir = path.join(tempDir, "hls");
  const playlist = path.join(hlsDir, "playlist.m3u8");
  const coverPath = path.join(tempDir, "cover.jpg");

  await mkdir(hlsDir, { recursive: true });

  // create HLS
  await run(ffmpegBin, [
    "-i",
    input,
    "-codec:v",
    "libx264",
    "-codec:a",
    "aac",
    "-start_number",
    "0",
    "-hls_time",
    "6",
    "-hls_list_size",
    "0",
    "-f",
    "hls",
    playlist
  ]);

  // capture cover at 1s
  await run(ffmpegBin, ["-y", "-i", input, "-ss", "00:00:01", "-vframes", "1", coverPath]);

  const meta = await probeMetadata(input);
  const resolution = meta.width && meta.height ? `${meta.width}x${meta.height}` : undefined;

  return { hlsPath: playlist, coverPath, durationSec: meta.durationSec, resolution, baseDir: tempDir };
};

export const cleanupDir = async (dir: string) => {
  await rm(dir, { recursive: true, force: true });
};

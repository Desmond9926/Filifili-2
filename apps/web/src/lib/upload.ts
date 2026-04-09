import crypto from "crypto";
import { AppError, ErrorCode } from "@filifili/api-kit";

const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
const MAX_DURATION_SEC = 30 * 60; // 30min
const ALLOWED_MIME = ["video/mp4", "video/quicktime"];

export const validateUpload = (input: {
  mime: string;
  sizeBytes: number;
  durationSec?: number;
}) => {
  if (!ALLOWED_MIME.includes(input.mime)) {
    throw new AppError(ErrorCode.INVALID_PARAMS, "unsupported file type", { status: 400 });
  }
  if (input.sizeBytes > MAX_SIZE) {
    throw new AppError(ErrorCode.INVALID_PARAMS, "file too large", { status: 400 });
  }
  if (input.durationSec && input.durationSec > MAX_DURATION_SEC) {
    throw new AppError(ErrorCode.INVALID_PARAMS, "video too long", { status: 400 });
  }
};

export const buildObjectKey = (videoId: string, filename: string) => {
  const ext = filename.split(".").pop() ?? "mp4";
  const uid = crypto.randomBytes(6).toString("hex");
  return `videos/${videoId}/${Date.now()}-${uid}.${ext}`;
};

export const buildPublicUrl = (key: string) => {
  const useCdn = process.env.QINIU_USE_CDN === "true";
  const cdn = process.env.CDN_BASE_URL;
  const endpoint = process.env.QINIU_PUBLIC_BASE_URL;
  if (useCdn && cdn) return `${cdn}/${key}`;
  if (endpoint) return `${endpoint}/${key}`;
  return key;
};

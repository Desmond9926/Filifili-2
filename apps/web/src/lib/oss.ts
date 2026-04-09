import qiniu from "qiniu";
import { AppError, ErrorCode } from "@filifili/api-kit";

const required = (name: string, value: string | undefined) => {
  if (!value) throw new AppError(ErrorCode.UNKNOWN, `${name} is not configured`, { status: 500 });
  return value;
};

const getMac = () => {
  const accessKey = required("QINIU_ACCESS_KEY", process.env.QINIU_ACCESS_KEY);
  const secretKey = required("QINIU_SECRET_KEY", process.env.QINIU_SECRET_KEY);
  return new qiniu.auth.digest.Mac(accessKey, secretKey);
};

export const getUploadUrl = () => required("QINIU_UPLOAD_URL", process.env.QINIU_UPLOAD_URL);

export const createUploadToken = (key: string) => {
  const bucket = required("QINIU_BUCKET", process.env.QINIU_BUCKET);
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: `${bucket}:${key}`,
    expires: 900
  });
  return putPolicy.uploadToken(getMac());
};

export const publicUrl = (key: string) => {
  const useCdn = process.env.QINIU_USE_CDN === "true";
  const cdn = process.env.CDN_BASE_URL?.replace(/\/$/, "");
  if (useCdn && cdn) return `${cdn}/${key}`;
  const base = required("QINIU_PUBLIC_BASE_URL", process.env.QINIU_PUBLIC_BASE_URL).replace(/\/$/, "");
  return `${base}/${key}`;
};

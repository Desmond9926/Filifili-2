import qiniu from "qiniu";
import pLimit from "p-limit";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const required = (name: string, value: string | undefined) => {
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const getMac = () => {
  const accessKey = required("QINIU_ACCESS_KEY", process.env.QINIU_ACCESS_KEY);
  const secretKey = required("QINIU_SECRET_KEY", process.env.QINIU_SECRET_KEY);
  return new qiniu.auth.digest.Mac(accessKey, secretKey);
};

const getConfig = () => {
  const config = new qiniu.conf.Config();
  const region = process.env.QINIU_REGION;
  if (region === "as0") {
    config.zone = qiniu.zone.Zone_as0;
  }
  return config;
};

const createUploadToken = (key: string) => {
  const bucket = required("QINIU_BUCKET", process.env.QINIU_BUCKET);
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: `${bucket}:${key}`,
    expires: 900
  });
  return putPolicy.uploadToken(getMac());
};

const getServerUploadUrl = () => required("QINIU_SERVER_UPLOAD_URL", process.env.QINIU_SERVER_UPLOAD_URL);

export const publicUrl = (key: string) => {
  const useCdn = process.env.QINIU_USE_CDN === "true";
  const cdn = process.env.CDN_BASE_URL?.replace(/\/$/, "");
  if (useCdn && cdn) return `${cdn}/${key}`;
  const base = required("QINIU_PUBLIC_BASE_URL", process.env.QINIU_PUBLIC_BASE_URL).replace(/\/$/, "");
  return `${base}/${key}`;
};

export const getSignedDownloadUrl = (key: string) => {
  const base = required("QINIU_PUBLIC_BASE_URL", process.env.QINIU_PUBLIC_BASE_URL).replace(/\/$/, "");
  const bucketManager = new qiniu.rs.BucketManager(getMac(), getConfig());
  const deadline = Math.floor(Date.now() / 1000) + 3600;
  return bucketManager.privateDownloadUrl(base, key, deadline);
};

export const downloadObjectToTempFile = async (key: string) => {
  const url = getSignedDownloadUrl(key);
  const dir = await mkdtemp(path.join(os.tmpdir(), "filifili-source-"));
  const ext = path.extname(key) || ".mp4";
  const filePath = path.join(dir, `input${ext}`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Qiniu download failed: ${res.status} ${await res.text()}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  await writeFile(filePath, Buffer.from(arrayBuffer));
  return { filePath, dir, url };
};

export const putObject = async (key: string, filePath: string, mime?: string) => {
  const uploadUrl = getServerUploadUrl();
  const token = createUploadToken(key);
  const form = new FormData();
  form.set("token", token);
  form.set("key", key);
  const buffer = await readFile(filePath);
  form.set("file", new Blob([buffer], { type: mime ?? "application/octet-stream" }), key.split("/").pop() ?? "file");

  const res = await fetch(uploadUrl, { method: "POST", body: form });
  if (!res.ok) {
    throw new Error(`Qiniu upload failed: ${res.status} ${await res.text()}`);
  }
  return publicUrl(key);
};

export const uploadManyWithRetry = async (
  items: Array<{ key: string; filePath: string; mime?: string }>,
  concurrency = 5,
  retries = 3
) => {
  const limit = pLimit(concurrency);

  const attempt = async (item: { key: string; filePath: string; mime?: string }, left: number): Promise<string> => {
    try {
      return await putObject(item.key, item.filePath, item.mime);
    } catch (err) {
      if (left <= 0) throw err;
      console.error("upload retry", { key: item.key, left, err });
      return attempt(item, left - 1);
    }
  };

  return Promise.all(items.map((item) => limit(() => attempt(item, retries))));
};

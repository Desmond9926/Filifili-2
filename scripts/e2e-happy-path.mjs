import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../.env") });
config({ path: path.resolve(__dirname, "../apps/web/.env.local") });

const prisma = new PrismaClient();
const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
const ffmpegBin = process.env.FFMPEG_PATH || "ffmpeg";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const jsonRequest = async (url, options = {}) => {
  const res = await fetch(`${baseUrl}${url}`, options);
  const data = await res.json().catch(() => ({}));
  return { res, data };
};

const authHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json"
});

const waitForStatus = async (videoId, token, expected, timeoutMs = 180000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { res, data } = await jsonRequest(`/api/videos/${videoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok && data?.data?.video?.status === expected) return data.data.video;
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Timed out waiting for video ${videoId} to reach status ${expected}`);
};

const createSampleVideo = async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), "filifili-e2e-"));
  const filePath = path.join(dir, "sample.mp4");
  await execFileAsync(ffmpegBin, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    "color=c=black:s=640x360:d=1",
    "-f",
    "lavfi",
    "-i",
    "anullsrc=r=44100:cl=stereo",
    "-shortest",
    "-c:v",
    "libx264",
    "-c:a",
    "aac",
    filePath
  ]);
  assert(existsSync(filePath), "Sample video was not generated");
  return { dir, filePath };
};

const main = async () => {
  const suffix = Date.now();
  const email = `e2e_creator_${suffix}@test.com`;
  const username = `e2e_creator_${suffix}`;
  const password = "Creator@123";
  const adminEmail = "admin@test.com";
  const adminPassword = "Admin@123";

  console.info("[e2e] register user");
  const registerResult = await jsonRequest("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  assert(registerResult.res.ok, `Register failed: ${JSON.stringify(registerResult.data)}`);
  const userId = registerResult.data?.data?.user?.id;
  assert(userId, "Register response missing user id");

  console.info("[e2e] promote creator");
  await prisma.user.update({ where: { id: userId }, data: { role: "creator" } });

  console.info("[e2e] login creator");
  const creatorLogin = await jsonRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usernameOrEmail: email, password })
  });
  assert(creatorLogin.res.ok, `Creator login failed: ${JSON.stringify(creatorLogin.data)}`);
  const creatorToken = creatorLogin.data?.data?.token;
  assert(creatorToken, "Creator token missing");

  console.info("[e2e] create draft");
  const category = await prisma.category.findFirst({ orderBy: { createdAt: "asc" } });
  assert(category, "No category found for upload test");
  const draftResult = await jsonRequest("/api/videos/drafts", {
    method: "POST",
    headers: authHeaders(creatorToken),
    body: JSON.stringify({
      title: `E2E Video ${suffix}`,
      description: "Happy path test video",
      categoryId: category.id,
      tags: ["e2e", "test"]
    })
  });
  assert(draftResult.res.ok, `Draft creation failed: ${JSON.stringify(draftResult.data)}`);
  const videoId = draftResult.data?.data?.video?.id;
  assert(videoId, "Draft response missing video id");

  const { dir, filePath } = await createSampleVideo();
  try {
    const fileBuffer = await import("node:fs/promises").then((m) => m.readFile(filePath));

    console.info("[e2e] request upload credential");
    const credential = await jsonRequest("/api/videos/upload-credential", {
      method: "POST",
      headers: authHeaders(creatorToken),
      body: JSON.stringify({
        videoId,
        filename: "sample.mp4",
        mime: "video/mp4",
        sizeBytes: fileBuffer.byteLength,
        durationSec: 1
      })
    });
    assert(credential.res.ok, `Upload credential failed: ${JSON.stringify(credential.data)}`);

    const uploadUrl = credential.data?.data?.uploadUrl;
    const objectKey = credential.data?.data?.key;
    const uploadToken = credential.data?.data?.uploadToken;
    assert(uploadUrl && objectKey && uploadToken, "Upload credential missing uploadUrl/key/uploadToken");

    console.info("[e2e] upload sample video to Qiniu");
    const form = new FormData();
    form.set("token", uploadToken);
    form.set("key", objectKey);
    form.set("file", new Blob([fileBuffer], { type: "video/mp4" }), "sample.mp4");
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      body: form
    });
    assert(uploadRes.ok, `Qiniu upload failed with ${uploadRes.status}`);

    console.info("[e2e] notify upload complete");
    const completeResult = await jsonRequest(`/api/videos/${videoId}/upload-complete`, {
      method: "POST",
      headers: authHeaders(creatorToken),
      body: JSON.stringify({
        key: objectKey,
        sizeBytes: fileBuffer.byteLength,
        durationSec: 1,
        mime: "video/mp4"
      })
    });
    assert(completeResult.res.ok, `Upload complete failed: ${JSON.stringify(completeResult.data)}`);

    console.info("[e2e] wait for review_pending");
    await waitForStatus(videoId, creatorToken, "review_pending");

    console.info("[e2e] login admin");
    const adminLogin = await jsonRequest("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail: adminEmail, password: adminPassword })
    });
    assert(adminLogin.res.ok, `Admin login failed: ${JSON.stringify(adminLogin.data)}`);
    const adminToken = adminLogin.data?.data?.token;
    assert(adminToken, "Admin token missing");

    console.info("[e2e] approve video");
    const reviewResult = await jsonRequest(`/api/admin/videos/${videoId}/review`, {
      method: "POST",
      headers: authHeaders(adminToken),
      body: JSON.stringify({ action: "approve" })
    });
    assert(reviewResult.res.ok, `Review failed: ${JSON.stringify(reviewResult.data)}`);

    console.info("[e2e] fetch public detail");
    const detail = await jsonRequest(`/api/videos/${videoId}`);
    assert(detail.res.ok, `Public video detail failed: ${JSON.stringify(detail.data)}`);
    assert(detail.data?.data?.video?.status === "published", "Video is not published after approval");

    console.info("[e2e] open playback page html");
    const pageRes = await fetch(`${baseUrl}/videos/${videoId}`);
    assert(pageRes.ok, `Playback page failed with ${pageRes.status}`);

    console.info("[e2e] create comment");
    const commentResult = await jsonRequest(`/api/videos/${videoId}/comments`, {
      method: "POST",
      headers: authHeaders(creatorToken),
      body: JSON.stringify({ content: "E2E happy path comment" })
    });
    assert(commentResult.res.ok, `Comment failed: ${JSON.stringify(commentResult.data)}`);

    console.info("[e2e] happy path passed", { videoId, userId });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
};

main()
  .catch((error) => {
    console.error("[e2e] failed", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

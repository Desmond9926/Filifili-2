import prismaPkg from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { PrismaClient } = prismaPkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();
const hash = (pwd: string) => bcrypt.hash(pwd, 10);

async function main() {
  // users
  const [adminPwd, modPwd, creatorPwd, userPwd] = await Promise.all([
    hash("Admin@123"),
    hash("Mod@1234"),
    hash("Creator@123"),
    hash("User@123")
  ]);

  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: { username: "admin", email: "admin@test.com", passwordHash: adminPwd, role: "admin" }
  });

  const moderator = await prisma.user.upsert({
    where: { email: "moderator@test.com" },
    update: {},
    create: { username: "moderator", email: "moderator@test.com", passwordHash: modPwd, role: "moderator" }
  });

  const creator = await prisma.user.upsert({
    where: { email: "creator@test.com" },
    update: {},
    create: { username: "creator", email: "creator@test.com", passwordHash: creatorPwd, role: "creator" }
  });

  const user = await prisma.user.upsert({
    where: { email: "user@test.com" },
    update: {},
    create: { username: "user", email: "user@test.com", passwordHash: userPwd, role: "user" }
  });

  // categories
  const catNames: Array<[string, string]> = [
    ["音乐", "music"],
    ["科技", "tech"],
    ["生活", "life"]
  ];

  const categories = await Promise.all(
    catNames.map(([name, slug]) =>
      prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } })
    )
  );
  const categoryId = categories[0].id;

  // sample URLs (replace with real OSS/CDN URLs if available)
  const base = process.env.CDN_BASE_URL ?? process.env.QINIU_PUBLIC_BASE_URL ?? "https://example.com";
  const sampleHls = `${base.replace(/\/$/, "")}/sample/playlist.m3u8`;
  const sampleCover = `${base.replace(/\/$/, "")}/sample/cover.jpg`;
  const sampleOriginal = `${base.replace(/\/$/, "")}/sample/original.mp4`;

  // published video
  const video1 = await prisma.video.create({
    data: {
      title: "示例已发布视频",
      description: "这是一段示例视频，用于测试播放与互动。",
      authorId: creator.id,
      categoryId,
      status: "published",
      publishedAt: new Date(),
      durationSec: 120,
      assets: {
        create: {
          originalUrl: sampleOriginal,
          hlsUrl: sampleHls,
          coverUrl: sampleCover,
          durationSec: 120,
          format: "video/mp4",
          resolution: "1920x1080",
          sizeBytes: 5_000_000
        }
      }
    }
  });

  // review pending
  await prisma.video.create({
    data: {
      title: "待审核视频",
      description: "测试审核流程。",
      authorId: creator.id,
      categoryId,
      status: "review_pending"
    }
  });

  // transcoding
  await prisma.video.create({
    data: {
      title: "转码中的视频",
      description: "测试转码状态。",
      authorId: creator.id,
      categoryId,
      status: "transcoding"
    }
  });

  // comments / replies / like / favorite
  const comment = await prisma.comment.create({
    data: {
      videoId: video1.id,
      userId: user.id,
      content: "第一条评论，测试！",
      status: "visible"
    }
  });

  await prisma.comment.create({
    data: {
      videoId: video1.id,
      userId: admin.id,
      parentId: comment.id,
      content: "管理员回复：收到。",
      status: "visible"
    }
  });

  await prisma.like.upsert({
    where: { userId_videoId: { userId: user.id, videoId: video1.id } },
    update: {},
    create: { userId: user.id, videoId: video1.id }
  });

  await prisma.favorite.upsert({
    where: { userId_videoId: { userId: user.id, videoId: video1.id } },
    update: {},
    create: { userId: user.id, videoId: video1.id }
  });

  await prisma.video.update({
    where: { id: video1.id },
    data: {
      commentCount: 2,
      likeCount: 1,
      favoriteCount: 1
    }
  });

  console.log("Seed finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

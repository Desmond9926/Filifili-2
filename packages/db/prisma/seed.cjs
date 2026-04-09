const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { config } = require("dotenv");
const path = require("node:path");

config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();
const hash = (pwd) => bcrypt.hash(pwd, 10);

async function main() {
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

  await prisma.user.upsert({
    where: { email: "moderator@test.com" },
    update: { passwordHash: modPwd },
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

  const catNames = [
    ["音乐", "music"],
    ["科技", "tech"],
    ["生活", "life"],
    ["游戏", "game"],
    ["影视", "movie"]
  ];

  const categories = await Promise.all(
    catNames.map(([name, slug]) =>
      prisma.category.upsert({ where: { slug }, update: {}, create: { name, slug } })
    )
  );
  const categoryId = categories[0].id;

  const base = process.env.CDN_BASE_URL ?? process.env.QINIU_PUBLIC_BASE_URL ?? "https://example.com";
  const normalizedBase = base.replace(/\/$/, "");
  const sampleHls = `${normalizedBase}/sample/playlist.m3u8`;
  const sampleCover = `${normalizedBase}/sample/cover.jpg`;
  const sampleOriginal = `${normalizedBase}/sample/original.mp4`;

  const existingVideo = await prisma.video.findFirst({ where: { title: "示例已发布视频", authorId: creator.id } });
  const video1 = existingVideo
    ? await prisma.video.update({
        where: { id: existingVideo.id },
        data: {
          description: "这是一段示例视频，用于测试播放与互动。",
          categoryId,
          status: "published",
          publishedAt: new Date(),
          durationSec: 120,
          likeCount: 1,
          favoriteCount: 1,
          commentCount: 2
        }
      })
    : await prisma.video.create({
        data: {
          title: "示例已发布视频",
          description: "这是一段示例视频，用于测试播放与互动。",
          authorId: creator.id,
          categoryId,
          status: "published",
          publishedAt: new Date(),
          durationSec: 120,
          likeCount: 1,
          favoriteCount: 1,
          commentCount: 2,
          assets: {
            create: {
              originalUrl: sampleOriginal,
              hlsUrl: sampleHls,
              coverUrl: sampleCover,
              durationSec: 120,
              format: "video/mp4",
              resolution: "1920x1080",
              sizeBytes: 5000000
            }
          }
        }
      });

  await prisma.videoAsset.upsert({
    where: { videoId: video1.id },
    update: {
      originalUrl: sampleOriginal,
      hlsUrl: sampleHls,
      coverUrl: sampleCover,
      durationSec: 120,
      format: "video/mp4",
      resolution: "1920x1080",
      sizeBytes: 5000000
    },
    create: {
      videoId: video1.id,
      originalUrl: sampleOriginal,
      hlsUrl: sampleHls,
      coverUrl: sampleCover,
      durationSec: 120,
      format: "video/mp4",
      resolution: "1920x1080",
      sizeBytes: 5000000
    }
  });

  const reviewPendingExisting = await prisma.video.findFirst({ where: { title: "待审核视频", authorId: creator.id } });
  if (!reviewPendingExisting) {
    await prisma.video.create({
      data: {
        title: "待审核视频",
        description: "测试审核流程。",
        authorId: creator.id,
        categoryId,
        status: "review_pending"
      }
    });
  }

  const transcodingExisting = await prisma.video.findFirst({ where: { title: "转码中的视频", authorId: creator.id } });
  if (!transcodingExisting) {
    await prisma.video.create({
      data: {
        title: "转码中的视频",
        description: "测试转码状态。",
        authorId: creator.id,
        categoryId,
        status: "transcoding"
      }
    });
  }

  let comment = await prisma.comment.findFirst({ where: { videoId: video1.id, userId: user.id, parentId: null } });
  if (!comment) {
    comment = await prisma.comment.create({
      data: {
        videoId: video1.id,
        userId: user.id,
        content: "第一条评论，测试！",
        status: "visible"
      }
    });
  } else {
    comment = await prisma.comment.update({
      where: { id: comment.id },
      data: { content: "第一条评论，测试！", status: "visible" }
    });
  }

  const parentId = comment.id;

  const existingReply = await prisma.comment.findFirst({ where: { videoId: video1.id, parentId, userId: admin.id } });
  if (!existingReply) {
    await prisma.comment.create({
      data: {
        videoId: video1.id,
        userId: admin.id,
        parentId,
        content: "管理员回复：收到。",
        status: "visible"
      }
    });
  }

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

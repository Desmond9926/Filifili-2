import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

try {
  const videos = await prisma.video.findMany({ select: { id: true } });

  for (const video of videos) {
    const [likeCount, favoriteCount, commentCount] = await Promise.all([
      prisma.like.count({ where: { videoId: video.id } }),
      prisma.favorite.count({ where: { videoId: video.id } }),
      prisma.comment.count({ where: { videoId: video.id, status: 'visible' } })
    ]);

    await prisma.video.update({
      where: { id: video.id },
      data: { likeCount, favoriteCount, commentCount }
    });
  }

  console.log(`Backfilled stats for ${videos.length} videos.`);
} finally {
  await prisma.$disconnect();
}

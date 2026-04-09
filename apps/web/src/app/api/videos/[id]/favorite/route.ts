import { NextRequest, NextResponse } from "next/server";
import { fail, ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";

export const POST = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const videoId = params?.id;
  if (!videoId) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const auth = mustAuth(req);
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video || video.status !== "published") {
    return NextResponse.json(fail(10004, "video not available"), { status: 404 });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_videoId: { userId: auth.userId, videoId } }
  });

  if (!existing) {
    await prisma.$transaction([
      prisma.favorite.create({ data: { userId: auth.userId, videoId } }),
      prisma.video.update({ where: { id: videoId }, data: { favoriteCount: { increment: 1 } } })
    ]);
  }

  return NextResponse.json(ok({ success: true }));
});

export const DELETE = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const videoId = params?.id;
  if (!videoId) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const auth = mustAuth(req);
  const existing = await prisma.favorite.findUnique({
    where: { userId_videoId: { userId: auth.userId, videoId } }
  });
  if (existing) {
    await prisma.$transaction([
      prisma.favorite.delete({ where: { userId_videoId: { userId: auth.userId, videoId } } }),
      prisma.video.update({ where: { id: videoId }, data: { favoriteCount: { decrement: 1 } } })
    ]);
  }
  return NextResponse.json(ok({ success: true }));
});

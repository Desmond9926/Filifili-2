import { NextRequest, NextResponse } from "next/server";
import { ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";

export const GET = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const auth = (() => {
    try {
      return mustAuth(req);
    } catch {
      return null;
    }
  })();

  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ code: 10003, message: "missing id", data: {} }, { status: 400 });
  }

  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      category: { select: { id: true, name: true, slug: true } },
      assets: true
    }
  });

  if (!video) {
    return NextResponse.json({ code: 10004, message: "not found", data: {} }, { status: 404 });
  }

  const isOwner = auth?.userId === video.authorId;
  const isAdmin = auth?.role === "admin" || auth?.role === "moderator";
  const isPublished = video.status === "published";

  if (!isPublished && !isOwner && !isAdmin) {
    return NextResponse.json({ code: 10002, message: "forbidden", data: {} }, { status: 403 });
  }

  const [liked, favored] = await Promise.all([
    auth
      ? prisma.like.findUnique({ where: { userId_videoId: { userId: auth.userId, videoId: id } } })
      : null,
    auth
      ? prisma.favorite.findUnique({
          where: { userId_videoId: { userId: auth.userId, videoId: id } }
        })
      : null
  ]);

  return NextResponse.json(
    ok({
      video,
      stats: {
        likes: video.likeCount,
        favorites: video.favoriteCount,
        comments: video.commentCount
      },
      userState: {
        liked: Boolean(liked),
        favored: Boolean(favored)
      }
    })
  );
});

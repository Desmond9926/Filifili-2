import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseBody, parseQuery } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { commentCreateSchema, commentListQuerySchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const videoId = params?.id;
  if (!videoId) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const query = parseQuery(
    commentListQuerySchema,
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  const where = { videoId, status: "visible" as const };
  const [total, items] = await Promise.all([
    prisma.comment.count({ where }),
    prisma.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        replies: {
          where: { status: "visible" },
          orderBy: { createdAt: "asc" },
          include: { user: { select: { id: true, username: true, avatarUrl: true } } }
        }
      }
    })
  ]);

  return NextResponse.json(ok({ items, page, pageSize, total }));
});

export const POST = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const videoId = params?.id;
  if (!videoId) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const auth = mustAuth(req);
  const body = parseBody(commentCreateSchema, await req.json());

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return NextResponse.json(fail(10004, "video not found"), { status: 404 });
  if (video.status !== "published") {
    return NextResponse.json(fail(10002, "forbidden"), { status: 403 });
  }

  const [comment] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        videoId,
        userId: auth.userId,
        content: body.content
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    }),
    prisma.video.update({ where: { id: videoId }, data: { commentCount: { increment: 1 } } })
  ]);

  return NextResponse.json(ok({ comment }));
});

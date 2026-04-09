import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseBody } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { commentCreateSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const commentId = params?.id;
  if (!commentId) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const auth = mustAuth(req);
  const body = parseBody(commentCreateSchema, await req.json());

  const parent = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { video: true }
  });
  if (!parent) return NextResponse.json(fail(10004, "not found"), { status: 404 });
  if (parent.status !== "visible") return NextResponse.json(fail(10002, "forbidden"), { status: 403 });
  if (parent.video.status !== "published") return NextResponse.json(fail(10002, "forbidden"), { status: 403 });

  const [reply] = await prisma.$transaction([
    prisma.comment.create({
      data: {
        videoId: parent.videoId,
        userId: auth.userId,
        parentId: parent.id,
        content: body.content
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } }
      }
    }),
    prisma.video.update({ where: { id: parent.videoId }, data: { commentCount: { increment: 1 } } })
  ]);

  return NextResponse.json(ok({ comment: reply }));
});

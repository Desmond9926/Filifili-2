import { NextRequest, NextResponse } from "next/server";
import { fail, ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";

export const DELETE = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const id = params?.id;
  if (!id) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const auth = mustAuth(req);
  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json(fail(10004, "not found"), { status: 404 });
  const isOwner = comment.userId === auth.userId;
  if (!isOwner && auth.role !== "admin" && auth.role !== "moderator") {
    return NextResponse.json(fail(10002, "forbidden"), { status: 403 });
  }

  if (comment.status === "visible") {
    await prisma.$transaction([
      prisma.comment.update({ where: { id }, data: { status: "deleted" } }),
      prisma.video.update({ where: { id: comment.videoId }, data: { commentCount: { decrement: 1 } } })
    ]);
  } else {
    await prisma.comment.update({ where: { id }, data: { status: "deleted" } });
  }
  return NextResponse.json(ok({ success: true }));
});

// admin/mod hide
export const POST = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const id = params?.id;
  if (!id) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const auth = mustAuth(req);
  mustRole(auth, ["admin", "moderator"]);

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json(fail(10004, "not found"), { status: 404 });

  if (comment.status === "visible") {
    await prisma.$transaction([
      prisma.comment.update({ where: { id }, data: { status: "hidden" } }),
      prisma.video.update({ where: { id: comment.videoId }, data: { commentCount: { decrement: 1 } } })
    ]);
  } else {
    await prisma.comment.update({ where: { id }, data: { status: "hidden" } });
  }
  return NextResponse.json(ok({ success: true }));
});

import { NextRequest, NextResponse } from "next/server";
import { fail, logger, ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";

const schema = {
  parse: (body: any) => {
    const { action, reason } = body ?? {};
    if (!action || !["approve", "reject", "hide"].includes(action)) {
      throw new Error("invalid action");
    }
    return { action, reason: reason as string | undefined };
  }
};

export const POST = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const id = params?.id;
  if (!id) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const auth = mustAuth(req);
  mustRole(auth, ["admin", "moderator"]);

  const body = schema.parse(await req.json());

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video) return NextResponse.json(fail(10004, "not found"), { status: 404 });

  let nextStatus: string = video.status;
  if (body.action === "approve") nextStatus = "published";
  if (body.action === "reject") nextStatus = "rejected";
  if (body.action === "hide") nextStatus = "hidden";

  const updated = await prisma.video.update({
    where: { id },
    data: {
      status: nextStatus as any,
      reviewNote: body.reason ?? null,
      publishedAt: body.action === "approve" ? new Date() : video.publishedAt
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: `video_review_${body.action}`,
      targetType: "video",
      targetId: id,
      meta: { reason: body.reason }
    }
  });

  logger.info("admin.video.reviewed", {
    actorId: auth.userId,
    videoId: id,
    action: body.action,
    previousStatus: video.status,
    nextStatus,
    reason: body.reason ?? null
  });

  return NextResponse.json(ok({ video: updated }));
});

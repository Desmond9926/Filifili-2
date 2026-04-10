import { NextRequest, NextResponse } from "next/server";
import { fail, logger, ok, parseBody } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { creatorApplicationReviewSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const POST = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const id = params?.id;
  if (!id) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const auth = mustAuth(req);
  mustRole(auth, ["admin"]);
  const body = parseBody(creatorApplicationReviewSchema, await req.json());

  const application = await prisma.creatorApplication.findUnique({ where: { id } });
  if (!application) return NextResponse.json(fail(10004, "application not found"), { status: 404 });

  const nextStatus = body.action === "approve" ? "approved" : "rejected";

  const [updated] = await prisma.$transaction([
    prisma.creatorApplication.update({
      where: { id },
      data: {
        status: nextStatus,
        reviewNote: body.reviewNote ?? null,
        reviewedBy: auth.userId,
        reviewedAt: new Date()
      },
      include: {
        user: { select: { id: true, username: true, email: true, role: true } }
      }
    }),
    ...(body.action === "approve"
      ? [prisma.user.update({ where: { id: application.userId }, data: { role: "creator" } })]
      : [])
  ]);

  logger.info("admin.creator_application.reviewed", {
    actorId: auth.userId,
    applicationId: id,
    targetUserId: application.userId,
    action: body.action,
    nextStatus
  });

  return NextResponse.json(ok({ application: updated }));
});

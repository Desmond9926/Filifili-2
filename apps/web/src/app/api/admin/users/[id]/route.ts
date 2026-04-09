import { NextRequest, NextResponse } from "next/server";
import { fail, logger, ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";

export const POST = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const id = params?.id;
  if (!id) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const auth = mustAuth(req);
  mustRole(auth, ["admin"]);

  const body = (await req.json()) as { action?: "disable" | "enable" };
  if (!body.action) return NextResponse.json(fail(10003, "missing action"), { status: 400 });

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json(fail(10004, "not found"), { status: 404 });
  if (user.role === "admin" && body.action === "disable") {
    return NextResponse.json(fail(10002, "cannot disable admin"), { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { disabledAt: body.action === "disable" ? new Date() : null },
    select: { id: true, username: true, email: true, role: true, disabledAt: true, createdAt: true }
  });

  logger.info("admin.user.status_updated", {
    actorId: auth.userId,
    targetUserId: id,
    action: body.action,
    disabledAt: updated.disabledAt
  });

  return NextResponse.json(ok({ user: updated }));
});

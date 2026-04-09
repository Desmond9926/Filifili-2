import { NextRequest, NextResponse } from "next/server";
import { fail, ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";

export const dynamic = "force-dynamic";

export const DELETE = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const id = params?.id;
  if (!id) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const auth = mustAuth(req);
  mustRole(auth, ["admin", "moderator"]);

  await prisma.video.update({ where: { id }, data: { status: "deleted" } });

  await prisma.auditLog.create({
    data: {
      actorId: auth.userId,
      action: "video_delete",
      targetType: "video",
      targetId: id
    }
  });

  return NextResponse.json(ok({ success: true }));
});

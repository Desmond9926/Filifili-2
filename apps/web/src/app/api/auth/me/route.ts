import { NextRequest, NextResponse } from "next/server";
import { ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const payload = mustAuth(req);
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      disabledAt: true,
      avatarUrl: true,
      bio: true,
      createdAt: true
    }
  });

  if (user?.disabledAt) {
    return NextResponse.json({ code: 10002, message: "account disabled", data: {} }, { status: 403 });
  }

  return NextResponse.json(ok({ user }));
});

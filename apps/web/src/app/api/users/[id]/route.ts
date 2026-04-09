import { NextRequest, NextResponse } from "next/server";
import { ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { withErrorHandling } from "@/lib/response";

export const GET = withErrorHandling(async (_req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const id = params?.id;
  if (!id) {
    return NextResponse.json({ code: 10003, message: "missing id", data: {} }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      bio: true,
      role: true,
      createdAt: true
    }
  });

  if (!user) {
    return NextResponse.json({ code: 10004, message: "not found", data: {} }, { status: 404 });
  }

  return NextResponse.json(ok({ user }));
});

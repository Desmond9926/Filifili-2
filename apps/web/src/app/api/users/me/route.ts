import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseBody } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { userUpdateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const auth = mustAuth(req);
  const body = parseBody(userUpdateSchema, await req.json());

  if (body.username) {
    const exists = await prisma.user.findFirst({
      where: { username: body.username, NOT: { id: auth.userId } }
    });
    if (exists) {
      return NextResponse.json(fail(10005, "username taken"), { status: 409 });
    }
  }

  const updated = await prisma.user.update({
    where: { id: auth.userId },
    data: {
      username: body.username,
      avatarUrl: body.avatarUrl,
      bio: body.bio
    },
    select: {
      id: true,
      username: true,
      email: true,
      avatarUrl: true,
      bio: true,
      role: true,
      createdAt: true
    }
  });

  return NextResponse.json(ok({ user: updated }));
});

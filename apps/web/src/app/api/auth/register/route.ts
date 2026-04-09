import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseBody, signToken } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { hashPassword } from "@/lib/password";
import { withErrorHandling } from "@/lib/response";
import { registerSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = parseBody(registerSchema, await req.json());
  const username = body.username.trim();
  const email = body.email.trim().toLowerCase();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: { equals: email, mode: "insensitive" } }]
    }
  });

  if (existing) {
    return NextResponse.json(fail(10005, "user already exists"), { status: 409 });
  }

  const passwordHash = await hashPassword(body.password);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      role: "user"
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  const token = signToken({ userId: user.id, role: user.role });

  const res = NextResponse.json(ok({ user, token }));
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  return res;
});

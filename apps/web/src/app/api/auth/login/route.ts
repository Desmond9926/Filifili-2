import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseBody, signToken } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { verifyPassword } from "@/lib/password";
import { withErrorHandling } from "@/lib/response";
import { loginSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = parseBody(loginSchema, await req.json());
  const identifier = body.usernameOrEmail.trim();
  const normalizedEmail = identifier.toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: identifier },
        { email: { equals: normalizedEmail, mode: "insensitive" } }
      ]
    }
  });

  if (!user) {
    return NextResponse.json(fail(10001, "invalid credentials"), { status: 401 });
  }

  if (user.disabledAt) {
    return NextResponse.json(fail(10002, "account disabled"), { status: 403 });
  }

  const okPassword = await verifyPassword(body.password, user.passwordHash);
  if (!okPassword) {
    return NextResponse.json(fail(10001, "invalid credentials"), { status: 401 });
  }

  const token = signToken({ userId: user.id, role: user.role });
  const res = NextResponse.json(
    ok({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    })
  );
  res.cookies.set("token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  return res;
});

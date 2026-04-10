import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseBody } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { creatorApplicationSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const auth = mustAuth(req);
  const application = await prisma.creatorApplication.findUnique({
    where: { userId: auth.userId },
    select: {
      id: true,
      gender: true,
      nationality: true,
      phone: true,
      bio: true,
      status: true,
      reviewNote: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });
  return NextResponse.json(ok({ application }));
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const auth = mustAuth(req);

  const user = await prisma.user.findUnique({ where: { id: auth.userId }, select: { role: true, disabledAt: true } });
  if (!user || user.disabledAt) {
    return NextResponse.json(fail(10002, "account disabled"), { status: 403 });
  }
  if (user.role !== "user") {
    return NextResponse.json(fail(10002, "only normal users can apply"), { status: 403 });
  }

  const body = parseBody(creatorApplicationSchema, await req.json());

  const existing = await prisma.creatorApplication.findUnique({ where: { userId: auth.userId } });
  if (existing?.status === "approved") {
    return NextResponse.json(fail(10005, "application already approved"), { status: 409 });
  }

  const application = await prisma.creatorApplication.upsert({
    where: { userId: auth.userId },
    update: {
      gender: body.gender,
      nationality: body.nationality,
      phone: body.phone,
      bio: body.bio,
      status: "pending",
      reviewNote: null,
      reviewedAt: null,
      reviewedBy: null
    },
    create: {
      userId: auth.userId,
      gender: body.gender,
      nationality: body.nationality,
      phone: body.phone,
      bio: body.bio,
      status: "pending"
    },
    select: {
      id: true,
      status: true,
      gender: true,
      nationality: true,
      phone: true,
      bio: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return NextResponse.json(ok({ application }));
});

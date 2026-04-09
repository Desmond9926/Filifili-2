import { NextRequest, NextResponse } from "next/server";
import { ok, parseBody } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { draftCreateSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (req: NextRequest) => {
  const payload = mustAuth(req);
  mustRole(payload, ["creator", "admin", "moderator"]);

  const body = parseBody(draftCreateSchema, await req.json());

  const video = await prisma.video.create({
    data: {
      title: body.title,
      description: body.description,
      categoryId: body.categoryId,
      authorId: payload.userId,
      status: "draft",
      tags: body.tags ?? []
    },
    select: {
      id: true,
      title: true,
      status: true,
      categoryId: true,
      authorId: true,
      createdAt: true
    }
  });

  return NextResponse.json(ok({ video }));
});

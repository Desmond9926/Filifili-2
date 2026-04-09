import { NextRequest, NextResponse } from "next/server";
import { ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { withErrorHandling } from "@/lib/response";

export const GET = withErrorHandling(async (_req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const id = params?.id;
  if (!id) return NextResponse.json({ code: 10003, message: "missing id", data: {} }, { status: 400 });

  const current = await prisma.video.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ code: 10004, message: "not found", data: {} }, { status: 404 });

  const where = {
    status: "published" as const,
    id: { not: id },
    ...(current.categoryId ? { categoryId: current.categoryId } : {})
  };

  const items = await prisma.video.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: 6,
    include: {
      author: { select: { id: true, username: true } },
      category: { select: { id: true, name: true } },
      assets: true
    }
  });

  return NextResponse.json(ok({ items }));
});

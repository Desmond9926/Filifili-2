import { NextRequest, NextResponse } from "next/server";
import { ok, parseQuery } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { withErrorHandling } from "@/lib/response";
import { userVideoListQuerySchema } from "@/lib/schemas";
import { z } from "zod";

export const GET = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const userId = params?.id;
  if (!userId) {
    return NextResponse.json({ code: 10003, message: "missing id", data: {} }, { status: 400 });
  }

  const query = parseQuery(
    userVideoListQuerySchema,
    Object.fromEntries(req.nextUrl.searchParams.entries())
  ) as z.infer<typeof userVideoListQuerySchema>;

  const { page, pageSize } = query;

  const where = { authorId: userId, status: "published" as const };

  const [total, items] = await Promise.all([
    prisma.video.count({ where }),
    prisma.video.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        assets: true,
        category: { select: { id: true, name: true, slug: true } }
      }
    })
  ]);

  return NextResponse.json(ok({ items, page, pageSize, total }));
});

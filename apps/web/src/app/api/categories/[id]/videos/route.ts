import { NextRequest, NextResponse } from "next/server";
import { ok, parseQuery } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { withErrorHandling } from "@/lib/response";
import { videoListQuerySchema } from "@/lib/schemas";
import { z } from "zod";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const categoryId = params?.id;
  if (!categoryId) {
    return NextResponse.json({ code: 10003, message: "missing id", data: {} }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ code: 10004, message: "category not found", data: {} }, { status: 404 });
  }

  const query = parseQuery(
    videoListQuerySchema.omit({ categoryId: true }),
    Object.fromEntries(req.nextUrl.searchParams.entries())
  ) as z.infer<typeof videoListQuerySchema>;

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const sort = query.sort ?? "latest";

  const where = {
    status: "published" as const,
    categoryId
  };

  const [total, items] = await Promise.all([
    prisma.video.count({ where }),
    prisma.video.findMany({
      where,
      orderBy:
        sort === "hot"
          ? [
              { likeCount: "desc" },
              { favoriteCount: "desc" },
              { commentCount: "desc" },
              { publishedAt: "desc" }
            ]
          : { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } },
        category: { select: { id: true, name: true, slug: true } },
        assets: true
      }
    })
  ]);

  return NextResponse.json(
    ok({
      items,
      page,
      pageSize,
      total,
      category
    })
  );
});

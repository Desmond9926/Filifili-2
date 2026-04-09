import { NextRequest, NextResponse } from "next/server";
import { ok, parseQuery } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { withErrorHandling } from "@/lib/response";
import { videoListQuerySchema } from "@/lib/schemas";
import { z } from "zod";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const query = parseQuery(
    videoListQuerySchema,
    Object.fromEntries(req.nextUrl.searchParams.entries())
  ) as z.infer<typeof videoListQuerySchema>;
  const { page, pageSize, categoryId, sort } = query;

  const where = {
    status: "published" as const,
    ...(categoryId ? { categoryId } : {})
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
      total
    })
  );
});

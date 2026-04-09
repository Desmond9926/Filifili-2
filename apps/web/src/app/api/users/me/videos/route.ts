import { NextRequest, NextResponse } from "next/server";
import { ok, parseQuery } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { userVideoListQuerySchema } from "@/lib/schemas";
import { z } from "zod";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const auth = mustAuth(req);
  mustRole(auth, ["creator", "admin", "moderator"]);

  const query = parseQuery(
    userVideoListQuerySchema,
    Object.fromEntries(req.nextUrl.searchParams.entries())
  ) as z.infer<typeof userVideoListQuerySchema>;

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const where = {
    authorId: auth.userId,
    ...(query.status ? { status: query.status } : {})
  };

  const [total, items] = await Promise.all([
    prisma.video.count({ where }),
    prisma.video.findMany({
      where,
      orderBy: { createdAt: "desc" },
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

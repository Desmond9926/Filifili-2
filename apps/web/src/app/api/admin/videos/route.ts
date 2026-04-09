import { NextRequest, NextResponse } from "next/server";
import { ok, parseQuery } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { adminVideoListQuerySchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const auth = mustAuth(req);
  mustRole(auth, ["admin", "moderator"]);

  const query = parseQuery(adminVideoListQuerySchema, Object.fromEntries(req.nextUrl.searchParams.entries()));

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const status = query.status;
  const q = query.q?.trim();
  const where = {
    status,
    ...(q
      ? {
          title: {
            contains: q,
            mode: "insensitive" as const
          }
        }
      : {})
  };

  const [total, items] = await Promise.all([
    prisma.video.count({ where }),
    prisma.video.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: { id: true, username: true } },
        category: { select: { id: true, name: true } },
        assets: true
      }
    })
  ]);

  return NextResponse.json(ok({ items, page, pageSize, total }));
});

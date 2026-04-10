import { NextRequest, NextResponse } from "next/server";
import { ok, parseQuery } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { creatorApplicationListQuerySchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const auth = mustAuth(req);
  mustRole(auth, ["admin"]);

  const query = parseQuery(
    creatorApplicationListQuerySchema,
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const where = { status: query.status };

  const [total, items] = await Promise.all([
    prisma.creatorApplication.count({ where }),
    prisma.creatorApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            createdAt: true
          }
        }
      }
    })
  ]);

  return NextResponse.json(ok({ items, page, pageSize, total }));
});

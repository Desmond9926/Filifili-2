import { NextRequest, NextResponse } from "next/server";
import { ok, parseQuery } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { adminUserListQuerySchema } from "@/lib/schemas";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const auth = mustAuth(req);
  mustRole(auth, ["admin"]);

  const query = parseQuery(
    adminUserListQuerySchema,
    Object.fromEntries(req.nextUrl.searchParams.entries())
  );

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.disabled === "true"
      ? { disabledAt: { not: null } }
      : query.disabled === "false"
        ? { disabledAt: null }
        : {})
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        disabledAt: true,
        createdAt: true
      }
    })
  ]);

  return NextResponse.json(ok({ items, page, pageSize, total }));
});

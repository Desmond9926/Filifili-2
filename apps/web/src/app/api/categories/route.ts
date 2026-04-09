import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseBody } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { categoryCreateSchema } from "@/lib/schemas";

export const GET = withErrorHandling(async () => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });
  return NextResponse.json(ok({ categories }));
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const payload = mustAuth(req);
  mustRole(payload, ["admin"]);

  const body = parseBody(categoryCreateSchema, await req.json());

  const existing = await prisma.category.findFirst({
    where: {
      OR: [{ name: body.name }, { slug: body.slug }]
    }
  });
  if (existing) {
    return NextResponse.json(fail(10005, "category exists"), { status: 409 });
  }

  const category = await prisma.category.create({ data: body });
  return NextResponse.json(ok({ category }));
});

import { NextRequest, NextResponse } from "next/server";
import { fail, ok, parseBody } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { categoryUpdateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export const PATCH = withErrorHandling(async (req: NextRequest, ctx?: unknown) => {
  const payload = mustAuth(req);
  mustRole(payload, ["admin"]);
  const body = parseBody(categoryUpdateSchema, await req.json());

  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const id = params?.id;
  if (!id) {
    return NextResponse.json(fail(10003, "missing id"), { status: 400 });
  }

  const updated = await prisma.category.update({
    where: { id },
    data: body
  });
  return NextResponse.json(ok({ category: updated }));
});

export const DELETE = withErrorHandling(async (_req: NextRequest, ctx?: unknown) => {
  const params = (ctx as { params?: { id: string } } | undefined)?.params;
  const id = params?.id;
  if (!id) return NextResponse.json(fail(10003, "missing id"), { status: 400 });

  const payload = mustAuth(_req as NextRequest);
  mustRole(payload, ["admin"]);

  await prisma.category.delete({ where: { id } });
  return NextResponse.json(ok({ success: true }));
});

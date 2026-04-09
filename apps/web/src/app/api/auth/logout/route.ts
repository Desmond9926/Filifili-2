import { NextResponse } from "next/server";
import { ok } from "@filifili/api-kit";
import { withErrorHandling } from "@/lib/response";

export const POST = withErrorHandling(async () => {
  const res = NextResponse.json(ok({ success: true }));
  res.cookies.delete("token");
  return res;
});

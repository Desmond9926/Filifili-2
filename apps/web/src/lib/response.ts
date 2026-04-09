import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, errorResponse, isAppError, logger } from "@filifili/api-kit";

export const json = <T>(body: ApiResponse<T>, init?: ResponseInit) =>
  NextResponse.json(body, init);

type Handler = (req: NextRequest, ctx?: unknown) => Promise<NextResponse>;

export const withErrorHandling = (handler: Handler): Handler => {
  return async (req: NextRequest, ctx?: unknown) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (isAppError(err)) {
        logger.warn("api.app_error", {
          path: req.nextUrl.pathname,
          method: req.method,
          code: err.code,
          status: err.status,
          message: err.message
        });
        return json(errorResponse(err), { status: err.status });
      }
      const unknownErr = err as Error;
      logger.error("api.unhandled_error", {
        path: req.nextUrl.pathname,
        method: req.method,
        message: unknownErr.message,
        stack: unknownErr.stack
      });
      return json(errorResponse(unknownErr), { status: 500 });
    }
  };
};

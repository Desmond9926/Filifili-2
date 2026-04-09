import { NextRequest } from "next/server";
import {
  AuthContext,
  JwtPayload,
  requireAuth,
  requireRole,
  Role
} from "@filifili/api-kit";

const getCookieValue = (cookieHeader: string | null, name: string): string | undefined => {
  if (!cookieHeader) return undefined;

  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (rawKey !== name) continue;
    return decodeURIComponent(rawValue.join("="));
  }

  return undefined;
};

export const getAuthContext = (req: NextRequest): AuthContext => {
  const tokenCookie = getCookieValue(req.headers.get("cookie"), "token");
  return {
    authorization: req.headers.get("authorization") ?? undefined,
    cookies: { token: tokenCookie }
  };
};

export const mustAuth = (req: NextRequest): JwtPayload => requireAuth(getAuthContext(req));

export const mustRole = (payload: JwtPayload, roles: Role[]): void => requireRole(payload, roles);

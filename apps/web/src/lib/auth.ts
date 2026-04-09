import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import {
  AuthContext,
  JwtPayload,
  requireAuth,
  requireRole,
  Role
} from "@filifili/api-kit";

export const getAuthContext = (req: NextRequest): AuthContext => {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("token")?.value;
  return {
    authorization: req.headers.get("authorization") ?? undefined,
    cookies: { token: tokenCookie }
  };
};

export const mustAuth = (req: NextRequest): JwtPayload => requireAuth(getAuthContext(req));

export const mustRole = (payload: JwtPayload, roles: Role[]): void => requireRole(payload, roles);

import { config } from "dotenv";
import path from "node:path";
import jwt, { JwtPayload as JwtBasePayload } from "jsonwebtoken";
import { fileURLToPath } from "node:url";
import { AppError, ErrorCode } from "./errors";
import { JwtPayload, Role } from "./types";

if (!process.env.JWT_SECRET) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../../apps/web/.env.local"),
    path.resolve(__dirname, "../../../.env")
  ];

  for (const envPath of candidates) {
    config({ path: envPath });
    if (process.env.JWT_SECRET) break;
  }
}

const getSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError(ErrorCode.UNKNOWN, "JWT_SECRET is not configured", { status: 500 });
  }
  return secret;
};

export const signToken = (
  payload: Omit<JwtPayload, "iat" | "exp">,
  options?: jwt.SignOptions
): string => {
  return jwt.sign(payload, getSecret(), {
    expiresIn: options?.expiresIn ?? "7d",
    ...options
  });
};

const asJwtPayload = (decoded: string | JwtBasePayload | null): JwtPayload => {
  if (!decoded || typeof decoded === "string") {
    throw new AppError(ErrorCode.UNAUTHORIZED, "invalid token", { status: 401 });
  }
  if (!decoded.sub && !decoded.userId) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "token missing subject", { status: 401 });
  }
  const userId = decoded.sub ?? decoded.userId;
  const role = decoded.role as Role | undefined;
  if (!role) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "token missing role", { status: 401 });
  }
  return { userId, role, iat: decoded.iat, exp: decoded.exp };
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, getSecret());
    return asJwtPayload(decoded as JwtBasePayload);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "token expired", { status: 401 });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(ErrorCode.UNAUTHORIZED, "invalid token", { status: 401 });
    }
    throw error;
  }
};

export interface AuthContext {
  authorization?: string;
  cookies?: Record<string, string | undefined>;
}

export const extractToken = (ctx: AuthContext): string | null => {
  const bearer = ctx.authorization ?? ctx.cookies?.["token"];
  if (!bearer) return null;
  if (bearer.startsWith("Bearer ")) return bearer.slice(7);
  return bearer;
};

export const requireAuth = (ctx: AuthContext): JwtPayload => {
  const token = extractToken(ctx);
  if (!token) {
    throw new AppError(ErrorCode.UNAUTHORIZED, "unauthorized", { status: 401 });
  }
  return verifyToken(token);
};

export const requireRole = (payload: JwtPayload, allowed: Role[]): void => {
  if (!allowed.includes(payload.role)) {
    throw new AppError(ErrorCode.FORBIDDEN, "forbidden", { status: 403 });
  }
};

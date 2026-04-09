import net from "node:net";
import { NextResponse } from "next/server";
import { ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { withErrorHandling } from "@/lib/response";

const checkRedis = async () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return { ok: false, message: "REDIS_URL is not configured" };
  }

  const url = new URL(redisUrl);
  const port = Number(url.port || 6379);

  return new Promise<{ ok: boolean; message: string }>((resolve) => {
    const socket = new net.Socket();
    const done = (result: { ok: boolean; message: string }) => {
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(3000);
    socket.once("connect", () => done({ ok: true, message: "connected" }));
    socket.once("timeout", () => done({ ok: false, message: "connection timeout" }));
    socket.once("error", (error) => done({ ok: false, message: error.message }));
    socket.connect(port, url.hostname);
  });
};

export const GET = withErrorHandling(async () => {
  const db = await prisma.$queryRawUnsafe("SELECT 1")
    .then(() => ({ ok: true, message: "connected" }))
    .catch((error: Error) => ({ ok: false, message: error.message }));

  const redis = await checkRedis();

  const status = db.ok && redis.ok ? 200 : 503;

  return NextResponse.json(
    ok({
      status: status === 200 ? "ok" : "degraded",
      checks: {
        db,
        redis
      },
      timestamp: new Date().toISOString()
    }),
    { status }
  );
});

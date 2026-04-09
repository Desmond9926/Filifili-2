import { NextRequest, NextResponse } from "next/server";
import { fail, logger, ok } from "@filifili/api-kit";
import { prisma } from "@filifili/db/src/client";
import { mustAuth, mustRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/response";
import { buildObjectKey, validateUpload } from "@/lib/upload";
import { createUploadToken, getUploadUrl } from "@/lib/oss";

export const dynamic = "force-dynamic";

const credentialSchema = {
  parse: (input: any) => {
    const { videoId, filename, mime, sizeBytes, durationSec } = input ?? {};
    if (!videoId || !filename || !mime || typeof sizeBytes !== "number") {
      throw new Error("invalid parameters");
    }
    return { videoId, filename, mime, sizeBytes, durationSec } as {
      videoId: string;
      filename: string;
      mime: string;
      sizeBytes: number;
      durationSec?: number;
    };
  }
};

export const POST = withErrorHandling(async (req: NextRequest) => {
  const auth = mustAuth(req);
  mustRole(auth, ["creator", "admin", "moderator"]);
  const body = credentialSchema.parse(await req.json());

  logger.info("upload.credential.requested", {
    userId: auth.userId,
    videoId: body.videoId,
    filename: body.filename,
    mime: body.mime,
    sizeBytes: body.sizeBytes
  });

  validateUpload({ mime: body.mime, sizeBytes: body.sizeBytes, durationSec: body.durationSec });

  const video = await prisma.video.findFirst({
    where: { id: body.videoId, authorId: auth.userId }
  });
  if (!video) return NextResponse.json(fail(10004, "video not found"), { status: 404 });

  const key = buildObjectKey(body.videoId, body.filename);

  await prisma.video.update({
    where: { id: body.videoId },
    data: { status: "uploading" }
  });

  const uploadUrl = getUploadUrl();
  const uploadToken = createUploadToken(key);

  logger.info("upload.credential.issued", {
    userId: auth.userId,
    videoId: body.videoId,
    objectKey: key
  });

  return NextResponse.json(
    ok({
      uploadUrl,
      uploadToken,
      key,
      mime: body.mime
    })
  );
});

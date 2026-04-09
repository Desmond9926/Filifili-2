import { Queue } from "bullmq";

export const TRANSCODE_QUEUE = "transcode";

const redisUrl = process.env.REDIS_URL;

const connection = redisUrl
  ? { url: redisUrl }
  : (() => {
      throw new Error("REDIS_URL is required for worker queue");
    })();

export const transcodeQueue = new Queue(TRANSCODE_QUEUE, { connection });

export interface TranscodeJobPayload {
  videoId: string;
  originalUrl: string;
}

export const enqueueTranscodeJob = async (payload: TranscodeJobPayload) => {
  await transcodeQueue.add("transcode", payload, { attempts: 3, backoff: 5000 });
};

import { Queue } from "bullmq";

export interface TranscodeJobPayload {
  videoId: string;
  objectKey: string;
  originalUrl?: string;
}

const redisUrl = process.env.REDIS_URL;

const connection = redisUrl
  ? { url: redisUrl }
  : (() => {
      throw new Error("REDIS_URL is required for worker queue");
    })();

const transcodeQueue = new Queue<TranscodeJobPayload>("transcode", { connection });

export const enqueueTranscodeJob = async (payload: TranscodeJobPayload) => {
  await transcodeQueue.add("transcode", payload, { attempts: 3, backoff: 5000 });
};

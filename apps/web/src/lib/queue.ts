export interface TranscodeJobPayload {
  videoId: string;
  originalUrl: string;
}

// Placeholder enqueue; integration with BullMQ/worker can be added later.
export const enqueueTranscodeJob = async (_payload: TranscodeJobPayload) => {
  // In real implementation, push to queue.
  return true;
};

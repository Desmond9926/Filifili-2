"use client";

export interface UploadOptions {
  file: File;
  uploadUrl: string;
  uploadToken: string;
  key: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
  retries?: number;
}

// Qiniu form upload with progress and retry using XMLHttpRequest (browser only)
export const uploadWithProgress = async (options: UploadOptions): Promise<void> => {
  const { file, uploadUrl, uploadToken, key, onProgress, signal, retries = 2 } = options;
  const retryCount = Math.max(1, retries);

  const attempt = (left: number): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl, true);
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && onProgress) {
          const percent = Math.round((evt.loaded / evt.total) * 100);
          onProgress(percent);
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve();
        } else {
          reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText || ""}`.trim()));
        }
      };
      xhr.onerror = () => reject(new Error("Network error: upload connection failed"));
      if (signal) {
        signal.addEventListener("abort", () => {
          xhr.abort();
          reject(new DOMException("Aborted", "AbortError"));
        });
      }
      const form = new FormData();
      form.set("token", uploadToken);
      form.set("key", key);
      form.set("file", file);
      xhr.send(form);
    }).catch((err) => {
      if (left <= 0) throw err;
      return attempt(left - 1);
    });

  await attempt(retryCount);
};

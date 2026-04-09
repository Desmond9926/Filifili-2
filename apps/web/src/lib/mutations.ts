import { api } from "@/lib/api-client";

export const likeVideo = (videoId: string) =>
  api.post(`/api/videos/${videoId}/like`).catch((err) => {
    throw err;
  });

export const unlikeVideo = (videoId: string) =>
  fetch(`/api/videos/${videoId}/like`, { method: "DELETE" }).then(async (res) => {
    const json = await res.json();
    if (!res.ok || json.code !== 0) {
      const err = new Error(json.message || res.statusText);
      (err as any).status = res.status;
      throw err;
    }
    return json.data;
  });

export const favoriteVideo = (videoId: string) =>
  api.post(`/api/videos/${videoId}/favorite`).catch((err) => {
    throw err;
  });

export const unfavoriteVideo = (videoId: string) =>
  fetch(`/api/videos/${videoId}/favorite`, { method: "DELETE" }).then(async (res) => {
    const json = await res.json();
    if (!res.ok || json.code !== 0) {
      const err = new Error(json.message || res.statusText);
      (err as any).status = res.status;
      throw err;
    }
    return json.data;
  });

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { likeVideo, unlikeVideo, favoriteVideo, unfavoriteVideo } from "@/lib/mutations";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";

export function VideoActions({
  videoId,
  initialLiked,
  initialFavored
}: {
  videoId: string;
  initialLiked?: boolean;
  initialFavored?: boolean;
}) {
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const [liked, setLiked] = useState(initialLiked ?? false);
  const [favored, setFavored] = useState(initialFavored ?? false);

  const likeMut = useMutation({
    mutationFn: async () => {
      if (liked) {
        await unlikeVideo(videoId);
        setLiked(false);
      } else {
        await likeVideo(videoId);
        setLiked(true);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", videoId] });
    }
  });

  const favMut = useMutation({
    mutationFn: async () => {
      if (favored) {
        await unfavoriteVideo(videoId);
        setFavored(false);
      } else {
        await favoriteVideo(videoId);
        setFavored(true);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video", videoId] });
    }
  });

  if (!user) return <div className="hint">登录后可点赞/收藏</div>;

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button className="ghost" onClick={() => likeMut.mutate()} disabled={likeMut.isPending}>
        {liked ? "已赞" : "点赞"}
      </button>
      <button className="ghost" onClick={() => favMut.mutate()} disabled={favMut.isPending}>
        {favored ? "已收藏" : "收藏"}
      </button>
    </div>
  );
}

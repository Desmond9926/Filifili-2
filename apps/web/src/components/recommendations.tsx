"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api-client";

export function Recommendations({ videoId }: { videoId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["recommendations", videoId],
    queryFn: () => api.get<{ items: any[] }>(`/api/videos/${videoId}/recommendations`)
  });

  if (isLoading) return <div className="hint">加载推荐...</div>;
  if (error) return <div className="error">推荐加载失败</div>;
  if (!data || data.items.length === 0) return <div className="hint">暂无推荐</div>;

  return (
    <div className="grid">
      {data.items.map((v) => (
        <div key={v.id} className="card" style={{ padding: 12 }}>
          {v.assets?.coverUrl || v.coverUrl ? (
            <div className="video-cover media-cover" style={{ marginBottom: 10 }}>
              <Image
                src={v.assets?.coverUrl || v.coverUrl}
                alt={v.title}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="video-cover-image"
                unoptimized
              />
            </div>
          ) : null}
          <div className="video-title">{v.title}</div>
          <div className="hint">作者：{v.author?.username ?? ""}</div>
          <div className="hint">分类：{v.category?.name ?? "未分类"}</div>
          <div className="video-stats" style={{ marginTop: 6 }}>
            <span>赞 {v.likeCount ?? 0}</span>
            <span>藏 {v.favoriteCount ?? 0}</span>
            <span>评 {v.commentCount ?? 0}</span>
          </div>
          <Link href={`/videos/${v.id}`} className="link">前往播放</Link>
        </div>
      ))}
    </div>
  );
}

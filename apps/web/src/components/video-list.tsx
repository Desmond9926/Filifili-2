"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api-client";

export function VideoList({ categoryId, sort = "latest" }: { categoryId?: string; sort?: "latest" | "hot" }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["videos", categoryId, sort],
    queryFn: () => api.get<{ items: any[]; page: number; pageSize: number; total: number }>(
      categoryId ? `/api/videos?categoryId=${categoryId}&sort=${sort}` : `/api/videos?sort=${sort}`
    )
  });

  if (isLoading) return <div className="hint">加载中...</div>;
  if (error) return <div className="error">加载失败</div>;
  if (!data || data.items.length === 0) return <div className="hint">暂无视频</div>;

  return (
    <div className="grid">
      {data.items.map((v) => (
        <div key={v.id} className="card video-card">
          {v.assets?.coverUrl || v.coverUrl ? (
            <div className="video-cover media-cover">
              <Image
                src={v.assets?.coverUrl || v.coverUrl}
                alt={v.title}
                fill
                sizes="(max-width: 768px) 100vw, 320px"
                className="video-cover-image"
                unoptimized
              />
            </div>
          ) : (
            <div className="video-cover" />
          )}
          <div className="video-meta">
            <div className="video-title">{v.title}</div>
            <div className="hint">作者：{v.author?.username ?? "未知"}</div>
            <div className="hint">分类：{v.category?.name ?? "未分类"}</div>
            <div className="video-stats">
              <span>赞 {v.likeCount ?? 0}</span>
              <span>藏 {v.favoriteCount ?? 0}</span>
              <span>评 {v.commentCount ?? 0}</span>
            </div>
            <Link href={`/videos/${v.id}`} className="link">
              前往播放
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

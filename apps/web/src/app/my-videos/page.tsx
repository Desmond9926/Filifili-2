"use client";

import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "@/lib/api-client";
import { useState } from "react";
import Link from "next/link";

const statuses = [
  { value: "", label: "全部" },
  { value: "draft", label: "草稿" },
  { value: "uploading", label: "上传中" },
  { value: "uploaded", label: "已上传" },
  { value: "transcoding", label: "转码中" },
  { value: "review_pending", label: "待审核" },
  { value: "published", label: "已发布" },
  { value: "rejected", label: "已拒绝" },
  { value: "hidden", label: "已隐藏" }
];

export default function MyVideosPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [status, setStatus] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["my-videos", status],
    enabled: !!user,
    queryFn: () =>
      api.get<{ items: any[]; total: number }>(
        status ? `/api/users/me/videos?status=${status}` : "/api/users/me/videos"
      )
  });

  if (userLoading) {
    return (
      <main>
        <div className="card">加载中...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main>
        <div className="card">
          请先登录。<Link href="/login">前往登录</Link>
        </div>
      </main>
    );
  }

  if (!["creator", "admin", "moderator"].includes(user.role)) {
    return (
      <main>
        <div className="card">当前账号不是创作者，无法查看投稿管理。</div>
      </main>
    );
  }

  return (
    <main>
      <div className="content" style={{ maxWidth: 1100 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0 }}>我的投稿</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {statuses.map((item) => (
                <button
                  key={item.label}
                  className={status === item.value ? "btn" : "ghost"}
                  onClick={() => setStatus(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          {isLoading && <div className="hint">加载中...</div>}
          {error && <div className="error">加载失败</div>}
          {!isLoading && data && data.items.length === 0 && <div className="hint">暂无稿件</div>}
          <div className="grid">
            {data?.items.map((v) => (
              <div key={v.id} className="card video-card">
                <div className="video-cover" />
                <div className="video-meta">
                  <div className="video-title">{v.title}</div>
                  <div className="hint">分类：{v.category?.name ?? "未分类"}</div>
                  <div className="hint">状态：{v.status}</div>
                  <div className="hint">创建：{new Date(v.createdAt).toLocaleString()}</div>
                  <div className="video-stats">
                    <span>赞 {v.likeCount ?? 0}</span>
                    <span>藏 {v.favoriteCount ?? 0}</span>
                    <span>评 {v.commentCount ?? 0}</span>
                  </div>
                  <Link href={`/videos/${v.id}`}>查看详情</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState } from "react";

const statuses = [
  { value: "visible", label: "可见" },
  { value: "hidden", label: "已隐藏" },
  { value: "deleted", label: "已删除" }
] as const;

export default function AdminCommentsPage() {
  const { data: user } = useCurrentUser();
  const [status, setStatus] = useState<(typeof statuses)[number]["value"]>("visible");
  const [videoId, setVideoId] = useState("");
  const queryClient = useQueryClient();

  const isAdmin = user && (user.role === "admin" || user.role === "moderator");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-comments", status, videoId],
    enabled: !!isAdmin,
    queryFn: () => {
      const qs = new URLSearchParams({ status });
      if (videoId.trim()) qs.set("videoId", videoId.trim());
      return api.get<{ items: any[]; total: number }>(`/api/admin/comments?${qs.toString()}`);
    }
  });

  const hideMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/comments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-comments"] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/comments/${id}`, undefined, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-comments"] })
  });

  if (!isAdmin) {
    return (
      <main>
        <div className="card">无权限，请使用管理员或版主账号登录。</div>
      </main>
    );
  }

  return (
    <main>
      <div className="content" style={{ maxWidth: 1100 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0 }}>评论管理</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {statuses.map((item) => (
                <button
                  key={item.value}
                  className={status === item.value ? "btn" : "ghost"}
                  onClick={() => setStatus(item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            <label htmlFor="video-filter">按视频 ID 筛选（可选）</label>
            <input
              id="video-filter"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="输入视频 ID"
            />
          </div>
        </div>

        <div className="card">
          {isLoading && <div className="hint">加载中...</div>}
          {error && <div className="error">加载失败</div>}
          {!isLoading && data && data.items.length === 0 && <div className="hint">暂无评论</div>}

          <div className="grid">
            {data?.items.map((comment) => (
              <div key={comment.id} className="card" style={{ padding: 16 }}>
                <div className="video-title">{comment.user?.username ?? "用户"}</div>
                <div className="hint">视频：{comment.video?.title ?? "未知视频"}</div>
                <div className="hint">视频状态：{comment.video?.status ?? "-"}</div>
                <div className="hint">评论状态：{comment.status}</div>
                {comment.parent && <div className="hint">回复于：{comment.parent.content}</div>}
                <div style={{ marginTop: 8 }}>{comment.content}</div>
                <div className="hint" style={{ marginTop: 8 }}>
                  创建：{new Date(comment.createdAt).toLocaleString()}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  {comment.status === "visible" && (
                    <button
                      className="ghost"
                      onClick={() => hideMutation.mutate(comment.id)}
                      disabled={hideMutation.isPending}
                    >
                      隐藏
                    </button>
                  )}
                  {comment.status !== "deleted" && (
                    <button
                      className="ghost"
                      onClick={() => deleteMutation.mutate(comment.id)}
                      disabled={deleteMutation.isPending}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

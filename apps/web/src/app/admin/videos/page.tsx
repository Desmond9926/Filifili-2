"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const statuses = [
  "review_pending",
  "transcoding",
  "uploaded",
  "published",
  "rejected",
  "hidden",
  "draft",
  "uploading"
];

export default function AdminVideosPage() {
  const { data: user } = useCurrentUser();
  const [status, setStatus] = useState("review_pending");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-videos", status, page, q],
    queryFn: () => {
      const params = new URLSearchParams({ status, page: String(page), pageSize: "12" });
      if (q.trim()) params.set("q", q.trim());
      return api.get<{ items: any[]; total: number; page: number; pageSize: number }>(
        `/api/admin/videos?${params.toString()}`
      );
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/admin/videos/${id}`, undefined, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-videos"] })
  });

  const isAdmin = user && (user.role === "admin" || user.role === "moderator");
  if (!isAdmin) return <main><div className="card">无权限，请使用管理员账号登录。</div></main>;

  return (
    <main>
      <div className="content" style={{ maxWidth: 1080 }}>
        <div className="card">
          <h1>视频管理</h1>
          <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            <label htmlFor="video-search">按标题搜索</label>
            <input
              id="video-search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="输入视频标题关键词"
            />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {statuses.map((s) => (
              <button
                key={s}
                className="ghost"
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                disabled={status === s}
              >
                {s}
              </button>
            ))}
          </div>
          {isLoading && <div className="hint">加载中...</div>}
          {error && <div className="error">加载失败</div>}
          <div className="grid">
            {data?.items.map((v) => (
              <div key={v.id} className="card" style={{ padding: 16 }}>
                <div className="video-title">{v.title}</div>
                <div className="hint">作者：{v.author?.username ?? ""}</div>
                <div className="hint">分类：{v.category?.name ?? "未分类"}</div>
                <div className="hint">状态：{v.status}</div>
                <div className="hint">创建：{new Date(v.createdAt).toLocaleString()}</div>
                <div className="video-stats" style={{ marginTop: 8 }}>
                  <span>赞 {v.likeCount ?? 0}</span>
                  <span>藏 {v.favoriteCount ?? 0}</span>
                  <span>评 {v.commentCount ?? 0}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {status !== "hidden" && status !== "deleted" && (
                    <button
                      className="ghost"
                      onClick={() =>
                        api
                          .post(`/api/admin/videos/${v.id}/review`, { action: "hide" })
                          .then(() => qc.invalidateQueries({ queryKey: ["admin-videos"] }))
                      }
                    >
                      隐藏
                    </button>
                  )}
                  {status !== "rejected" && (
                    <button
                      className="ghost"
                      onClick={() =>
                        api
                          .post(`/api/admin/videos/${v.id}/review`, { action: "reject" })
                          .then(() => qc.invalidateQueries({ queryKey: ["admin-videos"] }))
                      }
                    >
                      拒绝
                    </button>
                  )}
                  <button
                    className="ghost"
                    onClick={() => deleteMutation.mutate(v.id)}
                    disabled={deleteMutation.isPending}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
          {data && data.total > data.pageSize && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
              <div className="hint">
                第 {data.page} 页，共 {Math.max(1, Math.ceil(data.total / data.pageSize))} 页，合计 {data.total} 条
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                  上一页
                </button>
                <button
                  className="ghost"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(data.total / data.pageSize)}
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

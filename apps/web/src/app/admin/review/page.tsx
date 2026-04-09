"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";

const reviewVideo = (id: string, action: "approve" | "reject" | "hide") =>
  api.post(`/api/admin/videos/${id}/review`, { action });

export default function ReviewPage() {
  const { data: user } = useCurrentUser();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-videos", "review_pending"],
    queryFn: () => api.get<{ items: any[]; total: number }>("/api/admin/videos?status=review_pending")
  });

  const mutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" | "hide" }) =>
      reviewVideo(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-videos", "review_pending"] })
  });

  const isAdmin = user && (user.role === "admin" || user.role === "moderator");

  if (!isAdmin) return <main><div className="card">无权限，请使用管理员账号登录。</div></main>;

  return (
    <main>
      <div className="content" style={{ maxWidth: 960 }}>
        <div className="card">
          <h1>待审核视频</h1>
          {isLoading && <div className="hint">加载中...</div>}
          {error && <div className="error">加载失败</div>}
          {!isLoading && data && data.items.length === 0 && <div className="hint">暂无待审核</div>}
          <div className="grid">
            {data?.items.map((v) => (
              <div key={v.id} className="card" style={{ padding: 16 }}>
                <div className="video-title">{v.title}</div>
                <div className="hint">作者：{v.author?.username ?? ""}</div>
                <div className="hint">分类：{v.category?.name ?? "未分类"}</div>
                <div className="hint">状态：{v.status}</div>
                <div className="hint">创建时间：{new Date(v.createdAt).toLocaleString()}</div>
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button
                    className="ghost"
                    onClick={() => mutation.mutate({ id: v.id, action: "approve" })}
                    disabled={mutation.isPending}
                  >
                    通过
                  </button>
                  <button
                    className="ghost"
                    onClick={() => mutation.mutate({ id: v.id, action: "reject" })}
                    disabled={mutation.isPending}
                  >
                    拒绝
                  </button>
                  <button
                    className="ghost"
                    onClick={() => mutation.mutate({ id: v.id, action: "hide" })}
                    disabled={mutation.isPending}
                  >
                    隐藏
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

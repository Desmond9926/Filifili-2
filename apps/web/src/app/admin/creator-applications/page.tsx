"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";

const statuses = ["pending", "approved", "rejected"] as const;

export default function AdminCreatorApplicationsPage() {
  const { data: user } = useCurrentUser();
  const [status, setStatus] = useState<(typeof statuses)[number]>("pending");
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["creator-applications", status],
    enabled: user?.role === "admin",
    queryFn: () => api.get<{ items: any[]; total: number }>(`/api/admin/creator-applications?status=${status}`)
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, reviewNote }: { id: string; action: "approve" | "reject"; reviewNote?: string }) =>
      api.post(`/api/admin/creator-applications/${id}/review`, { action, reviewNote }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["creator-applications"] })
  });

  if (user?.role !== "admin") {
    return <main><div className="card">无权限，请使用管理员账号登录。</div></main>;
  }

  return (
    <main>
      <div className="content" style={{ maxWidth: 1100 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <h1 style={{ margin: 0 }}>创作者申请审核</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {statuses.map((item) => (
                <button key={item} className={status === item ? "btn" : "ghost"} onClick={() => setStatus(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          {isLoading && <div className="hint">加载中...</div>}
          {error && <div className="error">加载失败</div>}
          {!isLoading && data && data.items.length === 0 && <div className="hint">暂无申请</div>}
          <div className="grid">
            {data?.items.map((item) => (
              <div key={item.id} className="card" style={{ padding: 16 }}>
                <div className="video-title">{item.user.username}</div>
                <div className="hint">邮箱：{item.user.email}</div>
                <div className="hint">性别：{item.gender}</div>
                <div className="hint">国籍：{item.nationality}</div>
                <div className="hint">电话：{item.phone}</div>
                <div className="hint">状态：{item.status}</div>
                <div style={{ marginTop: 8 }}>{item.bio}</div>
                {item.reviewNote && <div className="hint" style={{ marginTop: 8 }}>审核备注：{item.reviewNote}</div>}
                <div className="hint" style={{ marginTop: 8 }}>提交：{new Date(item.createdAt).toLocaleString()}</div>
                {item.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button
                      className="ghost"
                      onClick={() => reviewMutation.mutate({ id: item.id, action: "approve" })}
                      disabled={reviewMutation.isPending}
                    >
                      通过
                    </button>
                    <button
                      className="ghost"
                      onClick={() => {
                        const note = window.prompt("请输入拒绝原因（可选）") || undefined;
                        reviewMutation.mutate({ id: item.id, action: "reject", reviewNote: note });
                      }}
                      disabled={reviewMutation.isPending}
                    >
                      拒绝
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

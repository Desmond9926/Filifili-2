"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "@/lib/api-client";
import { useState } from "react";

const roles = ["all", "user", "creator", "moderator", "admin"] as const;
const disabledOptions = [
  { value: "", label: "全部" },
  { value: "false", label: "正常" },
  { value: "true", label: "已禁用" }
] as const;

export default function AdminUsersPage() {
  const { data: currentUser } = useCurrentUser();
  const [role, setRole] = useState<(typeof roles)[number]>("all");
  const [disabled, setDisabled] = useState<(typeof disabledOptions)[number]["value"]>("");
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users", role, disabled],
    enabled: currentUser?.role === "admin",
    queryFn: () => {
      const qs = new URLSearchParams();
      if (role !== "all") qs.set("role", role);
      if (disabled) qs.set("disabled", disabled);
      return api.get<{ items: any[]; total: number }>(`/api/admin/users?${qs.toString()}`);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "disable" | "enable" }) =>
      api.post(`/api/admin/users/${id}`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] })
  });

  if (currentUser?.role !== "admin") {
    return (
      <main>
        <div className="card">无权限，请使用管理员账号登录。</div>
      </main>
    );
  }

  return (
    <main>
      <div className="content" style={{ maxWidth: 1100 }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <h1 style={{ margin: 0 }}>用户管理</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {roles.map((item) => (
                <button
                  key={item}
                  className={role === item ? "btn" : "ghost"}
                  onClick={() => setRole(item)}
                >
                  {item === "all" ? "全部角色" : item}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {disabledOptions.map((item) => (
              <button
                key={item.label}
                className={disabled === item.value ? "btn" : "ghost"}
                onClick={() => setDisabled(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          {isLoading && <div className="hint">加载中...</div>}
          {error && <div className="error">加载失败</div>}
          {!isLoading && data && data.items.length === 0 && <div className="hint">暂无用户</div>}
          <div className="grid">
            {data?.items.map((user) => (
              <div key={user.id} className="card" style={{ padding: 16 }}>
                <div className="video-title">{user.username}</div>
                <div className="hint">邮箱：{user.email}</div>
                <div className="hint">角色：{user.role}</div>
                <div className="hint">状态：{user.disabledAt ? "已禁用" : "正常"}</div>
                <div className="hint">创建：{new Date(user.createdAt).toLocaleString()}</div>
                {user.role !== "admin" && (
                  <div style={{ marginTop: 12 }}>
                    <button
                      className="ghost"
                      onClick={() =>
                        toggleMutation.mutate({
                          id: user.id,
                          action: user.disabledAt ? "enable" : "disable"
                        })
                      }
                      disabled={toggleMutation.isPending}
                    >
                      {user.disabledAt ? "启用" : "禁用"}
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

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(1, "请输入名称"),
  slug: z.string().min(1, "请输入 slug")
});

type FormValues = z.infer<typeof schema>;

export default function CategoriesAdminPage() {
  const { data: user } = useCurrentUser();
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => api.get<{ categories: any[] }>("/api/categories")
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => api.post<{ category: any }>("/api/categories", values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      reset();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; name?: string; slug?: string }) =>
      api.post<{ category: any }>(`/api/categories/${payload.id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setEditingId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/categories/${id}`, undefined, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] })
  });

  const isAdmin = user && user.role === "admin";
  if (!isAdmin) return <main><div className="card">无权限，请使用管理员账号登录。</div></main>;

  const onSubmit = handleSubmit(async (values) => {
    await createMutation.mutateAsync(values);
  });

  return (
    <main>
      <div className="content" style={{ maxWidth: 900 }}>
        <div className="card">
          <h1>分类管理</h1>
          <form onSubmit={onSubmit} className="upload-form">
            <label>名称</label>
            <input placeholder="分类名称" {...register("name")} />
            {errors.name && <div className="error">{errors.name.message}</div>}

            <label>Slug</label>
            <input placeholder="slug" {...register("slug")} />
            {errors.slug && <div className="error">{errors.slug.message}</div>}

            <button type="submit" disabled={isSubmitting || createMutation.isPending}>
              {isSubmitting ? "创建中..." : "创建分类"}
            </button>
          </form>
        </div>

        <div className="card">
          <h2>分类列表</h2>
          {isLoading && <div className="hint">加载中...</div>}
          {error && <div className="error">加载失败</div>}
          <div className="grid">
            {data?.categories?.map((c) => (
              <div key={c.id} className="card" style={{ padding: 16 }}>
                <div className="video-title">{c.name}</div>
                <div className="hint">slug: {c.slug}</div>
                {editingId === c.id ? (
                  <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="name"
                    />
                    <input
                      value={editSlug}
                      onChange={(e) => setEditSlug(e.target.value)}
                      placeholder="slug"
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="ghost"
                        onClick={() =>
                          updateMutation.mutate({ id: c.id, name: editName || undefined, slug: editSlug || undefined })
                        }
                        disabled={updateMutation.isPending}
                      >
                        保存
                      </button>
                      <button className="ghost" onClick={() => setEditingId(null)}>取消</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      className="ghost"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditName(c.name);
                        setEditSlug(c.slug);
                      }}
                    >
                      编辑
                    </button>
                    <button
                      className="ghost"
                      onClick={() => deleteMutation.mutate(c.id)}
                      disabled={deleteMutation.isPending}
                    >
                      删除
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

"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@/lib/api-client";

export function CategoryList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: any[] }>("/api/categories")
  });

  if (isLoading) return <div className="hint">加载分类...</div>;
  if (error) return <div className="error">分类加载失败</div>;
  if (!data || data.categories.length === 0) return <div className="hint">暂无分类</div>;

  return (
    <div className="category-list">
      {data.categories.map((c) => (
        <Link key={c.id} href={`/categories/${c.id}`} className="tag">
          {c.name}
        </Link>
      ))}
    </div>
  );
}

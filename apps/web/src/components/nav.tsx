"use client";

import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export function Nav() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    try {
      await api.post<{ success: boolean }>("/api/auth/logout");
      queryClient.setQueryData(["me"], null);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="nav">
      <div className="nav-left">
        <Link href="/">Filifili</Link>
        <Link href="/categories">分类</Link>
        {user && <Link href="/upload">投稿</Link>}
        {user && ["creator", "admin", "moderator"].includes(user.role) && (
          <Link href="/my-videos">我的投稿</Link>
        )}
        {user && (user.role === "admin" || user.role === "moderator") && (
          <Link href="/admin/review">审核</Link>
        )}
        {user && (user.role === "admin" || user.role === "moderator") && (
          <Link href="/admin/videos">视频管理</Link>
        )}
        {user && (user.role === "admin" || user.role === "moderator") && (
          <Link href="/admin/comments">评论管理</Link>
        )}
        {user && user.role === "admin" && <Link href="/admin/users">用户管理</Link>}
        {user && user.role === "admin" && <Link href="/admin/categories">分类管理</Link>}
      </div>
      <div className="nav-right">
        {userLoading ? null : user ? (
          <>
            <span className="nav-user">{user.username}</span>
            <button onClick={logout} disabled={loading} className="ghost">
              {loading ? "退出中" : "退出"}
            </button>
          </>
        ) : (
          <>
            <Link href="/login">登录</Link>
            <Link href="/register">注册</Link>
          </>
        )}
      </div>
    </header>
  );
}

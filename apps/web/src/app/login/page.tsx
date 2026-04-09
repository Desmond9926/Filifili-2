"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  usernameOrEmail: z.string().min(1, "请输入用户名或邮箱"),
  password: z.string().min(8, "至少 8 位密码")
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (!res.ok || data.code !== 0) {
        setError(data.message ?? "登录失败");
      } else {
        window.location.href = "/";
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <div className="auth-badge">Filifili</div>
          <h1>欢迎回来</h1>
          <p>
            登录后继续管理你的视频、查看审核进度，并进入创作者工作台。
          </p>
          <div className="auth-highlights">
            <div className="auth-highlight">
              <strong>创作者中心</strong>
              <span>上传、转码、审核状态一站查看</span>
            </div>
            <div className="auth-highlight">
              <strong>数据同步</strong>
              <span>点赞、收藏、评论统计实时回写</span>
            </div>
          </div>
        </section>

        <section className="auth-panel card">
          <div className="auth-header">
            <div>
              <h2>登录账号</h2>
              <p className="hint">使用用户名或邮箱登录 Filifili</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            <div className="field">
              <label>用户名或邮箱</label>
              <input placeholder="请输入用户名或邮箱" {...register("usernameOrEmail")} />
              {errors.usernameOrEmail && <div className="error">{errors.usernameOrEmail.message}</div>}
            </div>

            <div className="field">
              <label>密码</label>
              <input type="password" placeholder="请输入密码" {...register("password")} />
              {errors.password && <div className="error">{errors.password.message}</div>}
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "登录中..." : "登录"}
            </button>

            <div className="auth-footer hint">
              还没有账号？<Link href="/register">立即注册</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

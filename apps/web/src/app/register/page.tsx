"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  username: z.string().min(1, "请输入用户名"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(8, "至少 8 位密码")
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (!res.ok || data.code !== 0) {
        setError(data.message ?? "注册失败");
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
      <div className="auth-shell auth-shell-register">
        <section className="auth-hero auth-hero-soft">
          <div className="auth-badge">Join Filifili</div>
          <h1>开启创作旅程</h1>
          <p>
            注册后即可建立个人主页，申请创作者权限并开始上传你的第一支视频。
          </p>
          <div className="auth-highlights">
            <div className="auth-highlight">
              <strong>轻量起步</strong>
              <span>基础资料、分类投稿、审核发布流程完整可用</span>
            </div>
            <div className="auth-highlight">
              <strong>稳定链路</strong>
              <span>上传、转码、审核、播放闭环已打通</span>
            </div>
          </div>
        </section>

        <section className="auth-panel card">
          <div className="auth-header">
            <div>
              <h2>创建账号</h2>
              <p className="hint">填写基础信息，立即加入 Filifili</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="auth-form">
            <div className="field">
              <label>用户名</label>
              <input placeholder="请输入用户名" {...register("username")} />
              {errors.username && <div className="error">{errors.username.message}</div>}
            </div>

            <div className="field">
              <label>邮箱</label>
              <input placeholder="请输入邮箱地址" {...register("email")} />
              {errors.email && <div className="error">{errors.email.message}</div>}
            </div>

            <div className="field">
              <label>密码</label>
              <input type="password" placeholder="至少 8 位密码" {...register("password")} />
              {errors.password && <div className="error">{errors.password.message}</div>}
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "注册中..." : "注册账号"}
            </button>

            <div className="auth-footer hint">
              已有账号？<Link href="/login">立即登录</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

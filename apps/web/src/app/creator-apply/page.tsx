"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";

const schema = z.object({
  gender: z.string().min(1, "请选择性别"),
  nationality: z.string().min(1, "请输入国籍"),
  phone: z.string().min(6, "请输入有效电话号码").max(30),
  bio: z.string().min(10, "请填写至少 10 个字的个人简介").max(500)
});

type FormValues = z.infer<typeof schema>;

export default function CreatorApplyPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["creator-application"],
    enabled: !!user,
    queryFn: () => api.get<{ application: any }>("/api/creator-application")
  });

  const application = data?.application;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: application
      ? {
          gender: application.gender,
          nationality: application.nationality,
          phone: application.phone,
          bio: application.bio
        }
      : undefined
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) => api.post<{ application: any }>("/api/creator-application", values),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["creator-application"] });
      reset({
        gender: result.application.gender,
        nationality: result.application.nationality,
        phone: result.application.phone,
        bio: result.application.bio
      });
    }
  });

  if (userLoading) return <main><div className="card">加载中...</div></main>;
  if (!user) return <main><div className="card">请先<Link href="/login">登录</Link>后申请。</div></main>;
  if (user.role === "creator" || user.role === "admin" || user.role === "moderator") {
    return <main><div className="card">你当前已经具备创作者或更高权限。</div></main>;
  }

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  return (
    <main>
      <div className="content" style={{ maxWidth: 860 }}>
        <div className="card">
          <h1>申请成为创作者</h1>
          <p className="hint">填写基本信息后提交申请，管理员审核通过后即可获得创作者权限并开始投稿。</p>
          {isLoading ? (
            <div className="hint">正在读取申请状态...</div>
          ) : application ? (
            <div className="auth-highlight" style={{ marginTop: 12 }}>
              <strong>当前状态：{application.status}</strong>
              <span>
                {application.status === "pending" && "申请已提交，等待管理员审核。"}
                {application.status === "approved" && "申请已通过，请刷新页面查看新权限。"}
                {application.status === "rejected" && `申请被拒绝。${application.reviewNote ? `原因：${application.reviewNote}` : ""}`}
              </span>
            </div>
          ) : null}
        </div>

        <div className="card">
          <form onSubmit={onSubmit} className="upload-form">
            <label>性别</label>
            <select {...register("gender")}>
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
            </select>
            {errors.gender && <div className="error">{errors.gender.message}</div>}

            <label>国籍</label>
            <input placeholder="请输入国籍" {...register("nationality")} />
            {errors.nationality && <div className="error">{errors.nationality.message}</div>}

            <label>电话号码</label>
            <input placeholder="请输入电话号码" {...register("phone")} />
            {errors.phone && <div className="error">{errors.phone.message}</div>}

            <label>个人简介</label>
            <textarea className="textarea" rows={6} placeholder="介绍你的创作方向、内容类型和背景" {...register("bio")} />
            {errors.bio && <div className="error">{errors.bio.message}</div>}

            <button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "提交中..." : application ? "更新并重新提交" : "提交申请"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api-client";
import { uploadWithProgress } from "@/lib/uploader";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import Link from "next/link";

const schema = z.object({
  title: z.string().min(1, "请输入标题"),
  description: z.string().min(1, "请输入简介"),
  categoryId: z.string().min(1, "请选择分类"),
  tags: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export default function UploadPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stage, setStage] = useState<string>("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<{ categories: any[] }>("/api/categories")
  });

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async (values) => {
    if (!file) {
      setError("请先选择视频文件");
      return;
    }
    setError(null);
    setStage("准备创建草稿...");
    setUploading(true);
    setProgress(0);
    try {
      // 1) 创建草稿
      setStage("创建草稿...");
      const draft = await api.post<{ video: { id: string } }>("/api/videos/drafts", {
        title: values.title,
        description: values.description,
        categoryId: values.categoryId,
        tags: values.tags ? values.tags.split(",").map((t) => t.trim()).filter(Boolean) : []
      });

      // 2) 申请上传凭证
      setStage("申请上传凭证...");
      const cred = await api.post<{
        uploadUrl: string;
        uploadToken: string;
        key: string;
        mime: string;
      }>("/api/videos/upload-credential", {
        videoId: draft.video.id,
        filename: file.name,
        mime: file.type,
        sizeBytes: file.size
      });

      // 3) 上传文件
      setStage("上传中...");
      await uploadWithProgress({
        file,
        uploadUrl: cred.uploadUrl,
        uploadToken: cred.uploadToken,
        key: cred.key,
        retries: 3,
        onProgress: setProgress
      });

      // 4) 通知完成
      setStage("通知服务器...");
      await api.post(`/api/videos/${draft.video.id}/upload-complete`, {
        key: cred.key,
        sizeBytes: file.size,
        mime: file.type
      });

      setStage("转码排队中...");

      router.push(`/videos/${draft.video.id}`);
    } catch (e: any) {
      setError(e?.message || "上传失败，请检查 OSS 上传域名、CORS 与网络连接");
    } finally {
      setStage("");
      setUploading(false);
    }
  });

  if (userLoading) {
    return <main><div className="card">加载中...</div></main>;
  }

  if (!user) {
    return <main><div className="card">请先<Link href="/login">登录</Link>后投稿。</div></main>;
  }

  if (!["creator", "admin", "moderator"].includes(user.role)) {
    return (
      <main>
        <div className="card">
          当前账号还不是创作者，暂时无法投稿。<Link href="/creator-apply">去申请成为创作者</Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <div className="content" style={{ maxWidth: 800 }}>
        <div className="card">
          <h1>投稿</h1>
          <form onSubmit={onSubmit} className="upload-form">
            <label>标题</label>
            <input placeholder="视频标题" {...register("title")} />
            {errors.title && <div className="error">{errors.title.message}</div>}

            <label>简介</label>
            <textarea rows={4} className="textarea" placeholder="视频简介" {...register("description")} />
            {errors.description && <div className="error">{errors.description.message}</div>}

            <label>分类</label>
            <select {...register("categoryId")}> 
              <option value="">请选择</option>
              {categories?.categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <div className="error">{errors.categoryId.message}</div>}

            <label>标签（用逗号分隔）</label>
            <input placeholder="tag1, tag2" {...register("tags")} />

            <label>视频文件（仅 mp4 / mov，≤2GB）</label>
            <input
              type="file"
              accept="video/mp4,video/quicktime"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <div className="hint">
                已选择：{file.name}，{(file.size / (1024 * 1024)).toFixed(2)} MB
              </div>
            )}

            {stage && <div className="hint">{stage}</div>}
            {uploading && <div className="hint">进度 {progress}%</div>}
            {error && <div className="error">{error}</div>}

            <button type="submit" disabled={uploading}>
              {uploading ? "上传中..." : "提交"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

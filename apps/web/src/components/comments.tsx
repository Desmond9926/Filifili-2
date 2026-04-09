"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api-client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useState } from "react";

const schema = z.object({ content: z.string().min(1, "请输入评论").max(500) });
type FormValues = z.infer<typeof schema>;

export function Comments({ videoId }: { videoId: string }) {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  const commentsQuery = useInfiniteQuery<{ items: any[]; total: number }, Error>({
    queryKey: ["comments", videoId],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get<{ items: any[]; total: number }>(`/api/videos/${videoId}/comments?page=${pageParam}&pageSize=10`),
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const next = lastPage.items.length === 0 ? undefined : (lastPageParam as number) + 1;
      return next;
    }
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const commentMutation = useMutation({
    mutationFn: (values: FormValues) => api.post(`/api/videos/${videoId}/comments`, values),
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    }
  });

  const replyMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      api.post(`/api/comments/${commentId}/reply`, { content }),
    onSuccess: () => {
      setReplyContent({});
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    await commentMutation.mutateAsync(values);
  });

  const allComments = commentsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="card">
      <h2>评论</h2>
      {!user && <div className="hint">登录后可发表评论</div>}
      {user && (
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <textarea
            rows={3}
            placeholder="说点什么..."
            {...register("content")}
            className="textarea"
          />
          {errors.content && <div className="error">{errors.content.message}</div>}
          <button type="submit" disabled={isSubmitting || commentMutation.isPending} className="ghost">
            {isSubmitting || commentMutation.isPending ? "发送中..." : "发送"}
          </button>
        </form>
      )}

      <div style={{ marginTop: 12 }}>
        {commentsQuery.isLoading && <div className="hint">加载评论...</div>}
        {commentsQuery.error && <div className="error">加载失败</div>}
        {!commentsQuery.isLoading && allComments.length === 0 && <div className="hint">还没有评论</div>}
        {allComments.map((c) => (
          <div key={c.id} className="comment-item">
            <div className="comment-author">{c.user?.username ?? "用户"}</div>
            <div className="comment-content">{c.content}</div>
            {c.replies && c.replies.length > 0 && (
              <div style={{ marginTop: 8, paddingLeft: 10, borderLeft: "1px solid #1f2430", display: "grid", gap: 8 }}>
                {c.replies.map((r: any) => (
                  <div key={r.id} className="comment-item" style={{ marginTop: 0 }}>
                    <div className="comment-author">{r.user?.username ?? "用户"}</div>
                    <div className="comment-content">{r.content}</div>
                  </div>
                ))}
              </div>
            )}
            {user && (
              <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                <textarea
                  rows={2}
                  className="textarea"
                  placeholder="回复..."
                  value={replyContent[c.id] ?? ""}
                  onChange={(e) => setReplyContent({ ...replyContent, [c.id]: e.target.value })}
                />
                <button
                  className="ghost"
                  disabled={replyMutation.isPending}
                  onClick={() => {
                    const content = replyContent[c.id]?.trim();
                    if (!content) return;
                    replyMutation.mutate({ commentId: c.id, content });
                  }}
                >
                  {replyMutation.isPending ? "回复中..." : "回复"}
                </button>
              </div>
            )}
          </div>
        ))}
        {commentsQuery.hasNextPage && (
          <button
            className="ghost"
            style={{ marginTop: 12 }}
            onClick={() => commentsQuery.fetchNextPage()}
            disabled={commentsQuery.isFetchingNextPage}
          >
            {commentsQuery.isFetchingNextPage ? "加载中..." : "加载更多"}
          </button>
        )}
      </div>
    </div>
  );
}

import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(8)
});

export const categoryCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1)
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional()
});

export const draftCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().uuid(),
  tags: z.array(z.string().min(1)).optional()
});

export const videoListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  categoryId: z.string().uuid().optional(),
  sort: z.enum(["latest", "hot"]).default("latest")
});

export const userUpdateSchema = z.object({
  username: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(200).optional()
});

export const userVideoListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum([
      "draft",
      "uploading",
      "uploaded",
      "transcoding",
      "review_pending",
      "published",
      "rejected",
      "hidden",
      "deleted"
    ])
    .optional()
});

export const commentCreateSchema = z.object({
  content: z.string().min(1).max(500)
});

export const commentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20)
});

export const adminVideoListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  q: z.string().trim().optional(),
  status: z
    .enum([
      "draft",
      "uploading",
      "uploaded",
      "transcoding",
      "review_pending",
      "published",
      "rejected",
      "hidden",
      "deleted"
    ])
    .default("review_pending")
});

export const adminCommentListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["visible", "hidden", "deleted"]).default("visible"),
  videoId: z.string().uuid().optional()
});

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(["user", "creator", "moderator", "admin"]).optional(),
  disabled: z.enum(["true", "false"]).optional()
});

export const creatorApplicationSchema = z.object({
  gender: z.string().min(1, "请选择性别"),
  nationality: z.string().min(1, "请输入国籍"),
  phone: z.string().min(6, "请输入有效电话号码").max(30),
  bio: z.string().min(10, "请填写至少 10 个字的个人简介").max(500)
});

export const creatorApplicationReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNote: z.string().max(300).optional()
});

export const creatorApplicationListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(["pending", "approved", "rejected"]).default("pending")
});

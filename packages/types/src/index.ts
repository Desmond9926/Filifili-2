export type Role = "user" | "creator" | "moderator" | "admin";

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export type VideoStatus =
  | "draft"
  | "uploading"
  | "uploaded"
  | "transcoding"
  | "review_pending"
  | "published"
  | "rejected"
  | "hidden"
  | "deleted";

export interface Video {
  id: string;
  title: string;
  description: string;
  authorId: string;
  categoryId: string;
  status: VideoStatus;
  tags?: string[];
  coverUrl?: string;
  publishedAt?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoAsset {
  id: string;
  videoId: string;
  originalUrl?: string;
  hlsUrl?: string;
  coverUrl?: string;
  durationSec?: number;
  sizeBytes?: number;
  format?: string;
  resolution?: string;
  bitrate?: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  parentId?: string;
  content: string;
  status: "visible" | "hidden" | "deleted";
  createdAt: string;
}

export interface Like {
  userId: string;
  videoId: string;
  createdAt: string;
}

export interface Favorite {
  userId: string;
  videoId: string;
  createdAt: string;
}

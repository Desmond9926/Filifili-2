export type Role = "user" | "creator" | "moderator" | "admin";

export interface JwtPayload {
  userId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

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

import { ApiResponse, PaginatedData, PaginatedResponse } from "./types";

export const ok = <T>(data: T, message = "ok"): ApiResponse<T> => ({
  code: 0,
  message,
  data
});

export const paginated = <T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number,
  message = "ok"
): PaginatedResponse<T> => {
  const payload: PaginatedData<T> = { items, page, pageSize, total };
  return {
    code: 0,
    message,
    data: payload
  };
};

export const fail = <T extends Record<string, unknown> = Record<string, unknown>>(
  code: number,
  message: string,
  data?: T
): ApiResponse<T> => ({
  code,
  message,
  data: (data ?? {}) as T
});

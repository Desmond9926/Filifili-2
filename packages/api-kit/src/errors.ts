import { ApiResponse } from "./types";

export enum ErrorCode {
  UNKNOWN = 10000,
  UNAUTHORIZED = 10001,
  FORBIDDEN = 10002,
  INVALID_PARAMS = 10003,
  NOT_FOUND = 10004,
  CONFLICT = 10005
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly detail?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { status?: number; detail?: Record<string, unknown> }
  ) {
    super(message);
    this.code = code;
    this.status = options?.status ?? 400;
    this.detail = options?.detail;
  }
}

export const isAppError = (err: unknown): err is AppError => err instanceof AppError;

export const errorResponse = (error: AppError | Error): ApiResponse<Record<string, unknown>> => {
  if (error instanceof AppError) {
    return {
      code: error.code,
      message: error.message,
      data: error.detail ?? {}
    };
  }

  return {
    code: ErrorCode.UNKNOWN,
    message: error.message,
    data: {}
  };
};

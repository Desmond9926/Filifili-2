import { ZodSchema } from "zod";
import { AppError, ErrorCode } from "./errors";

export const validateWith = <T>(schema: ZodSchema<T>, payload: unknown): T => {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new AppError(ErrorCode.INVALID_PARAMS, "invalid parameters", {
      status: 400,
      detail: { issues: result.error.issues }
    });
  }
  return result.data;
};

export const parseQuery = <T>(schema: ZodSchema<T>, query: unknown): T =>
  validateWith(schema, query);

export const parseBody = <T>(schema: ZodSchema<T>, body: unknown): T =>
  validateWith(schema, body);

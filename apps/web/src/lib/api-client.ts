import { ApiResponse } from "@filifili/types";

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { credentials: "include", ...init });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || json.code !== 0) {
    const err = new Error(json.message || res.statusText);
    (err as any).status = res.status;
    throw err;
  }
  return json.data;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { cache: "no-store" }),
  post: <T>(url: string, body?: unknown, init?: RequestInit) =>
    request<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(init?.headers as any) },
      body: body ? JSON.stringify(body) : undefined,
      ...init
    })
};

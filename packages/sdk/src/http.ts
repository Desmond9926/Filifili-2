import { ApiResponse } from "@filifili/types";

export interface HttpConfig {
  baseUrl: string;
  getToken?: () => string | null | undefined;
  fetchImpl?: typeof fetch;
}

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getToken?: () => string | null | undefined;
  private readonly fetchImpl: typeof fetch;

  constructor(config: HttpConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.getToken = config.getToken;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async request<T>(
    path: string,
    options: {
      method?: HttpMethod;
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined | null>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, options.query);
    const token = this.getToken?.();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    };
    if (token) {
      headers["Authorization"] = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    const res = await this.fetchImpl(url, {
      method: options.method ?? "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const json = (await res.json()) as ApiResponse<T>;
    if (!res.ok || json.code !== 0) {
      const error = new Error(json.message || res.statusText);
      (error as any).status = res.status;
      (error as any).code = json.code;
      (error as any).data = json.data;
      throw error;
    }

    return json;
  }

  private buildUrl(path: string, query?: Record<string, string | number | boolean | undefined | null>): string {
    const url = new URL(path.startsWith("http") ? path : `${this.baseUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        url.searchParams.set(key, String(value));
      });
    }
    return url.toString();
  }
}

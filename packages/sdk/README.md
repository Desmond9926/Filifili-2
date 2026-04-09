# @filifili/sdk

前后端共享的 API 客户端封装，基于统一响应结构，依赖 `@filifili/types`。

## 使用示例

```ts
import { ApiClient } from "@filifili/sdk";

const api = new ApiClient({
  baseUrl: "https://api.example.com",
  getToken: () => localStorage.getItem("token")
});

// GET 列表
const list = await api.request<{ items: string[] }>("/api/demo", {
  query: { page: 1, pageSize: 20 }
});

// POST 提交
await api.request<{}>("/api/demo", {
  method: "POST",
  body: { name: "foo" }
});
```

## 约定
- 响应结构：`{ code, message, data }`，其中 `code=0` 表示成功。
- 失败时抛出 `Error`，附带 `status`、`code`、`data` 字段便于上层处理。
- `getToken` 可返回裸 token 或 `Bearer xxx`；默认写入 `Authorization` 头。
- 内置 `Content-Type: application/json`，可通过 `headers` 覆盖或追加。

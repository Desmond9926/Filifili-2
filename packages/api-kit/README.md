# @filifili/api-kit

统一的 API 基线工具，提供响应包装、错误码、zod 校验、JWT 鉴权等能力。

## 安装

工作区已内置依赖：`zod`、`jsonwebtoken`、`@types/jsonwebtoken`、`typescript`。

## 响应包装

```ts
import { ok, paginated, fail } from "@filifili/api-kit";

// 成功响应
return ok({ id: "v1" });

// 分页响应
return paginated(items, page, pageSize, total);

// 业务失败响应（非异常场景）
return fail(10005, "conflict", { reason: "duplicate" });
```

## 错误与错误码

```ts
import { AppError, ErrorCode } from "@filifili/api-kit";

// 抛出参数错误
throw new AppError(ErrorCode.INVALID_PARAMS, "invalid parameters", {
  status: 400,
  detail: { field: "title" }
});
```

在框架层捕获后可使用 `errorResponse(err)` 统一格式化。

## 校验（zod）

```ts
import { z } from "zod";
import { parseBody, parseQuery } from "@filifili/api-kit";

const bodySchema = z.object({ title: z.string().min(1) });
const querySchema = z.object({ page: z.coerce.number().int().positive().default(1) });

const body = parseBody(bodySchema, request.body);
const query = parseQuery(querySchema, request.query);
```

`parseBody/parseQuery` 会在校验失败时抛出 `AppError`，可被统一错误处理中间件捕获。

## JWT 鉴权

```ts
import { signToken, requireAuth, requireRole, Role } from "@filifili/api-kit";

// 登录时颁发 token
const token = signToken({ userId: user.id, role: user.role as Role });

// 在 API 里校验身份
const authPayload = requireAuth({
  authorization: req.headers["authorization"] as string | undefined,
  cookies: req.cookies as Record<string, string>
});

// 角色检查，例如仅 creator 可上传
requireRole(authPayload, ["creator", "admin", "moderator"]);
```

`requireAuth` 支持从 `Authorization: Bearer <token>` 或 `cookies.token` 读取 token，缺失或非法时抛出 `AppError`。

## 统一错误响应示例（伪代码）

```ts
import { isAppError, errorResponse } from "@filifili/api-kit";

try {
  // handler logic...
} catch (err) {
  if (isAppError(err)) {
    return NextResponse.json(errorResponse(err), { status: err.status });
  }
  return NextResponse.json(errorResponse(err as Error), { status: 500 });
}
```

## 约定
- JWT_SECRET 必须配置在环境变量。
- 统一响应格式：`{ code, message, data }`，分页 `{ items, page, pageSize, total }`。
- 所有输入必须经 zod 校验；校验失败抛出 `AppError`，返回 `code=INVALID_PARAMS`。
- 业务逻辑中的鉴权/角色判断应使用 `requireAuth` / `requireRole`。

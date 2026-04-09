# @filifili/web

Next.js 前端与 API（app router）。

## 环境变量（核心）
- `DATABASE_URL`：PostgreSQL 连接串（供 Prisma 客户端使用）。
- `JWT_SECRET`：JWT 签发密钥。
- 上传/存储/转码：
  - `QINIU_ACCESS_KEY`、`QINIU_SECRET_KEY`：七牛 AccessKey / SecretKey。
  - `QINIU_BUCKET`：七牛空间名称。
  - `QINIU_REGION`：上传区域，例如 `as0`。
  - `QINIU_UPLOAD_URL`：客户端上传地址，例如 `https://upload-as0.qiniup.com`。
  - `QINIU_SERVER_UPLOAD_URL`：服务端/Worker 上传地址，例如 `https://up-as0.qiniup.com`。
  - `QINIU_PUBLIC_BASE_URL`：自定义源站域名。
  - `QINIU_USE_CDN`：是否优先使用 CDN 地址，`true/false`。
  - `CDN_BASE_URL`：可选，若启用 CDN，资源 URL 写回时优先使用。
  - `REDIS_URL`：BullMQ 队列使用。
  - `FFMPEG_PATH` / `FFPROBE_PATH`：可选，未设置则使用系统 PATH。

## 核心命令
- 安装依赖：`pnpm install`
- 类型检查：`pnpm typecheck`
- Prisma Client 生成（如需）：`pnpm --filter @filifili/db prisma:generate`
- 本地开发（前端）：`pnpm --filter @filifili/web dev`
- Happy Path E2E：`pnpm e2e:happy-path`

## 上传/转码链路说明
1) 前端 `/upload`：创建草稿 → 请求 `/api/videos/upload-credential` 获得七牛上传 token + 上传地址 → 通过 `FormData` 直传到七牛 → 调用 `/api/videos/:id/upload-complete`。
2) `upload-credential`：校验类型/大小/时长（mp4/mov，≤2GB，≤30min），返回 `uploadUrl/uploadToken/key`。
3) `upload-complete`：写入原视频 URL（优先 `CDN_BASE_URL`，否则 `QINIU_PUBLIC_BASE_URL`），状态置 `uploaded` → 入队转码 → 置 `transcoding`。
4) Worker（BullMQ + FFmpeg）：拉取转码任务，生成 HLS/封面，上传到七牛（路径 `videos/{id}/hls/...`、`videos/{id}/cover.jpg`），写回 HLS/封面 URL，状态置 `review_pending`；失败回退 `uploaded` 并记录错误。
5) 审核：`/api/admin/videos/:id/review` 支持 approve/reject/hide，写入 audit_logs。

## 运行 Worker
1) 配置 `REDIS_URL`、OSS 相关、FFmpeg 路径。
2) 构建：`pnpm --filter @filifili/worker build`
3) 启动：`node packages/worker/dist/worker.js`

## E2E 说明
- `pnpm e2e:happy-path` 依赖以下服务已启动并可访问：
  - Web 应用（默认 `http://localhost:3000`，可通过 `E2E_BASE_URL` 覆盖）
  - Worker
  - PostgreSQL / Redis / OSS / FFmpeg
- 脚本流程：注册用户 -> 提权为 creator -> 登录 -> 创建草稿 -> 申请上传凭证 -> 上传样例 MP4 -> 通知上传完成 -> 等待转码为 `review_pending` -> 管理员审核通过 -> 校验播放页可访问 -> 发表评论。

## 备注
- 当前使用七牛 Kodo 原生上传：前端为 `FormData` 单文件上传，后续如需大文件/断点可扩展分片。
- 播放器使用 Artplayer + HLS；需确保 HLS URL 可公网访问。

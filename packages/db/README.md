# @filifili/db

Prisma schema 和客户端生成配置。

## 运行前置

- 在仓库根目录配置 `DATABASE_URL`，示例见 `.env.example`。
- 默认使用 PostgreSQL。
- 转码/队列依赖：`REDIS_URL`（用于 BullMQ），`FFMPEG_PATH` / `FFPROBE_PATH`（可选，未配置默认走系统 PATH）。
- 对象存储：若需上传/转码产物上云，需在 `.env` 配置 OSS/CDN 变量（参考 `.env.example`）。

## 常用命令

```bash
# 生成 Prisma Client
pnpm --filter @filifili/db prisma:generate

# 开发环境迁移（需数据库可用）

# 格式化 schema
pnpm --filter @filifili/db prisma:format
```

## 模型概览
- users：支持角色 `user/creator/moderator/admin`
- categories：name/slug 唯一
- videos：状态机 `draft/uploading/uploaded/transcoding/review_pending/published/rejected/hidden/deleted`，包含 tags、封面、尺寸、时长、审核/处理备注
- video_assets：原视频/HLS/封面、时长、尺寸、码率、大小
- comments：两级回复，状态 `visible/hidden/deleted`
- likes、favorites：用户与视频的幂等关系
- audit_logs：后台/敏感操作审计

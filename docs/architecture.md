# Architecture Overview

## 1. Project Goal

本项目目标是开发一个类似 bilibili 的视频网站 MVP，优先实现以下核心功能：

1. 用户注册登录
2. 视频上传
3. 视频播放
4. 评论 / 点赞 / 收藏
5. 个人主页
6. 首页推荐 / 分类
7. 管理后台

本项目当前阶段聚焦于：
- 完成核心视频发布与播放闭环
- 支持基础互动能力
- 支持后台内容管理
- 保持架构清晰，便于后续扩展弹幕、搜索、推荐算法、审核流、举报系统等能力

---

## 2. Architecture Principles

### 2.1 Core Principles
- 前后端职责清晰
- 业务逻辑与路由层分离
- 视频处理异步化
- 上传、转码、发布采用状态驱动
- 所有外部资源访问统一封装
- 优先保证 MVP 可交付，再逐步演进

### 2.2 Engineering Principles
- 保持模块化结构，避免把复杂逻辑直接堆入 API Route
- API 层只负责请求解析、鉴权、参数校验、响应封装
- Service 层负责业务逻辑
- Repository / Prisma 层负责数据访问
- Worker 独立处理转码与异步任务
- 所有关键流程都有状态记录与错误处理
- 所有新增功能尽量基于已有模块扩展，不随意引入新依赖

---

## 3. Tech Stack

当前仓库采用 Next.js 单体 Web + 独立 Prisma / Worker 包的实现方式，部分原先规划中的技术尚未落地。

## 3.1 Frontend
- Next.js
- React
- react-hook-form
- TanStack Query
- zod
- Artplayer
- HLS.js

当前状态：
- 已落地：Next.js App Router、TanStack Query、react-hook-form、zod、Artplayer、HLS.js
- 未落地：Tailwind CSS、shadcn/ui、Zustand

## 3.2 Backend
- Next.js API / Route Handlers
- PostgreSQL
- Redis
- Prisma
- 七牛云 Kodo

## 3.3 Video Processing
- FFmpeg
- BullMQ

当前状态：
- 已落地：单文件直传七牛、BullMQ、FFmpeg/FFprobe、转码产物上传七牛并回写 CDN/源站 URL
- 未落地：分片上传

## 3.4 Deployment
- Vercel：前端
- Docker + 云服务器：后端 API / Worker
- CDN：静态资源与视频分发

---

## 4. System Modules

系统由以下核心模块组成：

1. 用户与鉴权模块
2. 视频上传模块
3. 视频处理模块
4. 视频播放模块
5. 评论互动模块
6. 首页推荐与分类模块
7. 个人主页模块
8. 管理后台模块
9. 异步任务模块
10. 基础设施模块（对象存储、缓存、日志、配置）

---

## 5. High-Level Architecture

### 5.1 Logical Components

- Web App（Next.js）
  - 用户端页面
  - 视频播放页
  - 投稿页
  - 个人主页
  - 首页推荐页

- Admin App（可先放在同一 Next.js 项目中，后续可独立）
  - 视频管理
  - 用户管理
  - 评论管理
  - 分类管理
  - 审核管理

- API Layer（Next.js Route Handlers）
  - 鉴权 API
  - 视频 API
  - 评论 API
  - 用户 API
  - 后台 API

- Service Layer
  - Auth Service
  - Video Service
  - Upload Service
  - Comment Service
  - User Service
  - Admin Service

- Data Layer
  - PostgreSQL
  - Prisma ORM
  - Redis

- Storage Layer
  - 七牛云 Kodo
  - CDN

- Async Worker
  - BullMQ Worker
  - FFmpeg 转码任务
  - 封面生成任务
  - 元数据提取任务

---

## 6. Suggested Repository Structure

当前仓库的真实结构如下：

```txt
/apps
  /web
    next.config.mjs
    /src
      /app
        /api
          /auth
          /admin
          /videos
          /categories
          /comments
          /users
          /health
        /admin
        /categories
        /login
        /my-videos
        /register
        /upload
        /videos
      /components
      /lib
      /hooks

/packages
  /api-kit
  /db
    /prisma
    /src
    /scripts
  /sdk
  /types
  /worker
    /src

/docs
  architecture.md
  product.md
  coding-rules.md
  task-board.md

/scripts
  e2e-happy-path.mjs
```

说明：
- 当前 worker 以 `packages/worker` 形式存在，而不是独立 `apps/worker`
- 当前尚未引入 `packages/ui`、`packages/config`
- 当前业务分层已通过工具包和模块化目录做了基础拆分，但 Service / Repository 尚未完全独立目录化


---

## 7. Frontend Architecture

## 7.1 Frontend Responsibilities
前端负责：
- 页面渲染
- 用户交互
- 表单提交
- 播放器交互
- 上传流程控制
- 展示服务端数据

前端不负责：
- 核心业务判断
- 资源权限计算
- 上传完成后的真实状态确认
- 视频状态流转控制

## 7.2 Frontend State Strategy
推荐状态管理划分如下：

### Zustand
用于：
- 播放器本地状态
- UI 状态
- 弹窗状态
- 上传面板本地状态

### TanStack Query（建议）
用于：
- 视频详情请求
- 评论列表
- 个人主页数据
- 首页推荐数据
- 收藏/点赞状态同步

## 7.3 UI Layer
- 使用 shadcn/ui 作为基础组件库
- 页面尽量按 feature 拆分
- 通用组件沉淀到 `components`
- 业务组件沉淀到 `features/*`

---

## 8. Backend Architecture

## 8.1 API Layer Responsibilities
API 层负责：
- 请求解析
- 参数校验
- 鉴权
- 调用 service
- 响应格式统一

API 层不负责：
- 复杂业务逻辑
- 数据库细节
- 文件处理逻辑
- FFmpeg 调用

## 8.2 Service Layer Responsibilities
Service 层负责：
- 用户业务逻辑
- 视频状态流转
- 评论与互动逻辑
- OSS 上传凭证生成
- 调用队列任务
- 后台操作业务流程

当前实现差异：
- 已通过 `packages/api-kit` 提供统一响应、鉴权、校验、日志工具
- 当前 Route Handler 中仍保留一部分业务编排与 Prisma 访问
- 理想状态下应继续把复杂逻辑下沉到独立 Service / Repository 层

## 8.3 Repository / Data Access Layer
数据访问层负责：
- Prisma 查询封装
- 数据持久化
- 事务处理
- 通用查询逻辑复用

---

## 9. Authentication & Authorization

## 9.1 Authentication
- 方案：统一采用 JWT。
- Token 颁发：登录后下发 JWT，可支持 httpOnly Cookie + Authorization header 兼容。
- 刷新策略：预留刷新接口/中间件，占位实现，避免静态长寿命 token。
- 最小实现：注册、登录、登出、获取当前用户信息。

当前已实现接口：
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## 9.2 Authorization
- 角色：`user`（默认注册）、`creator`（后台授予）、`admin`、`moderator`（可选）。
- 能力：
  - user：浏览、评论、点赞、收藏。
  - creator：具备投稿与视频管理能力。
  - moderator：内容审核与评论管理。
  - admin：系统管理全部权限。
- 约束：上传/创建视频需 `creator` 及以上；后台接口需 `admin`/`moderator` 对应权限。

当前后台路由保护：
- `middleware.ts` 会拦截 `/admin/*`
- `admin` / `moderator` 可访问审核、视频管理、评论管理
- 仅 `admin` 可访问用户管理、分类管理

---

## 10. Video Domain Design

## 10.1 Video Entity
视频实体是平台核心资源，包含：
- 基本信息：标题、简介、标签、分类
- 作者信息
- 资源信息：原视频、转码后资源、封面
- 状态信息
- 统计信息：播放量、点赞数、收藏数、评论数

## 10.2 Video Status Lifecycle
建议视频状态机如下：

- `draft`
- `uploading`
- `uploaded`
- `transcoding`
- `review_pending`
- `published`
- `rejected`
- `hidden`
- `deleted`

说明：
- 用户提交稿件后，初始可为 `draft`
- 文件上传成功后变为 `uploaded`
- 转码任务开始后变为 `transcoding`
- 转码完成后进入 `review_pending`
- 审核通过后为 `published`
- 审核不通过为 `rejected`
- 被后台下架为 `hidden`
- 逻辑删除为 `deleted`

---

## 11. Upload Architecture

## 11.1 Upload Strategy
MVP 推荐方案：
- 前端直传到 OSS。
- 后端负责生成上传凭证 / 签名，校验允许的格式与大小。
- 上传完成后，前端通知后端进行文件确认。
- 后端创建/更新视频记录并投递转码任务。
- 文件限制：仅 mp4/mov，单文件 ≤ 2GB，时长 ≤ 30 分钟。
- 原视频保留策略：默认保留 30 天（可配置生命周期），需清理任务占位。

当前实现：
- `POST /api/videos/drafts` 创建草稿
- `POST /api/videos/upload-credential` 返回 OSS 预签名 PUT URL
- 浏览器单 PUT 上传原视频到 OSS
- `POST /api/videos/:id/upload-complete` 写入原视频 URL、入队转码、状态置 `transcoding`

## 11.2 Upload Flow
1. 用户创建视频草稿。
2. 前端请求上传凭证（校验格式/大小/时长，前后端双校验）。
3. 前端单 PUT 上传到 OSS。
4. 上传完成后通知后端。
5. 后端校验文件信息并更新视频状态为 `uploaded`，记录原视频信息。
6. 后端投递 BullMQ 转码任务。
7. Worker 拉取任务并执行转码（元数据、封面、HLS）。
8. 转码完成后写回视频资源信息。
9. 视频进入 `review_pending`，需审核通过后 `published`。

---

## 12. Video Processing Architecture

## 12.1 Processing Responsibilities
Worker 负责：
- 拉取原视频
- 提取元数据（时长、分辨率、码率等）
- 截取封面
- 输出 HLS 资源
- 上传转码结果到 OSS
- 回写数据库状态

## 12.2 Output Format
MVP 推荐：
- 输出 HLS (`.m3u8`)
- 生成封面图
- 保存视频时长、宽高、清晰度信息
- 原视频保留策略可配置

## 12.3 Retry & Failure
转码任务必须支持：
- 重试
- 失败日志记录
- 失败状态回写
- 人工重新触发

失败时视频状态可设为：
- `uploaded` + error info
或
- `transcoding_failed`（如果后续单独扩展状态）

---

## 13. Playback Architecture

## 13.1 Player
播放器采用 Artplayer，支持：
- HLS 播放
- 播放进度记忆
- 倍速播放
- 清晰度切换（后续扩展）
- 基础播放状态同步

## 13.2 Playback Data
播放页需要加载：
- 视频基本信息
- 作者信息
- 统计信息
- 评论列表
- 推荐视频列表

## 13.3 Playback Security
MVP 阶段：
- 通过 CDN 分发 HLS 资源
- 播放地址可采用受控路径
- 后续可扩展防盗链、签名 URL、Referer 控制

---

## 14. Comment / Like / Favorite Architecture

## 14.1 Comment System
MVP 评论系统建议：
- 支持一级评论
- 支持二级回复
- 支持软删除
- 支持评论审核 / 隐藏（后台）

## 14.2 Like / Favorite
交互行为建议单独建表：
- likes
- favorites

要求：
- 幂等
- 支持取消操作
- 统计字段异步或同步维护均可，但要保持一致性策略明确

---

## 15. Homepage & Recommendation

## 15.1 Homepage Data Sources
首页 MVP 可采用：
- 最新发布
- 热门视频
- 分类推荐
- 人工配置推荐位

## 15.2 Recommendation Strategy
MVP 阶段不做复杂推荐算法，优先使用：
- 发布时间
- 播放量
- 点赞量
- 收藏量
- 分类维度
- 人工配置权重

后续可扩展个性化推荐。

---

## 16. User Profile Architecture

个人主页模块包含：
- 用户基本资料
- 用户投稿视频列表
- 收藏列表（可选）
- 点赞列表（可选）
- 粉丝与关注（后续扩展）

MVP 优先支持：
- 个人信息展示
- 用户投稿列表

---

## 17. Admin Architecture

## 17.1 Admin Responsibilities
后台至少支持：
- 用户管理
- 视频管理
- 评论管理
- 分类管理
- 审核管理

## 17.2 Admin Actions
管理员可执行：
- 审核视频
- 下架视频
- 删除 / 隐藏评论
- 禁用用户
- 配置分类
- 配置推荐位（可选）

当前已落地后台页面：
- `/admin/review`：待审核视频处理
- `/admin/videos`：视频管理（状态筛选、搜索、分页、隐藏/拒绝/删除）
- `/admin/comments`：评论管理（状态筛选、隐藏/删除）
- `/admin/users`：用户管理（按角色/禁用状态筛选、禁用/启用）
- `/admin/categories`：分类管理（增删改）

## 17.3 Audit Logging
后台关键操作建议记录审计日志，包括：
- 操作者
- 操作对象
- 操作类型
- 操作时间
- 变更内容摘要

---

## 18. Data Storage Design

## 18.1 PostgreSQL
用于持久化核心业务数据：
- users
- videos
- video_assets
- comments
- likes
- favorites
- categories
- reports
- audit_logs

## 18.2 Redis
用于：
- BullMQ
- 热点缓存
- 计数类缓存
- 登录态辅助（视鉴权方案而定）

## 18.3 OSS
用于：
- 原始视频文件
- HLS 转码文件
- 封面图
- 用户头像
- 其他静态资源

---

## 19. Caching Strategy

MVP 缓存策略建议：
- 首页推荐列表缓存
- 视频详情热点缓存
- 评论列表分页缓存（可选）
- 分类页缓存

缓存失效策略：
- 视频发布后主动更新首页缓存
- 评论新增后局部失效
- 点赞收藏更新后局部更新计数

---

## 20. Observability

建议至少支持：

### Logging
- API 请求日志
- 关键业务日志
- 队列任务日志
- 转码失败日志

当前已实现：
- API 层统一错误日志
- 上传签名、上传完成、转码入队日志
- Worker 转码开始 / 完成 / 失败日志
- 后台审核、用户禁用操作日志

### Error Tracking
- 服务端异常上报
- 前端异常上报
- Worker 异常上报

### Health Check
- API 健康检查
- Redis 连通性检查
- 数据库连通性检查
- Worker 状态检查

当前已实现：
- `GET /api/health`
- 检查数据库与 Redis 连通性

---

## 21. Security Considerations

MVP 必须考虑：
- 输入参数校验
- 鉴权保护
- 角色权限控制
- XSS 过滤
- CSRF 保护（若使用 session）
- 上传文件类型限制
- 上传大小限制
- 资源访问控制
- 管理后台接口保护
- 敏感操作审计

---

## 22. API Design Conventions

所有 API 应遵循统一约定：

- 统一响应结构
- 统一错误结构
- 统一分页结构
- 严格参数校验
- 明确状态码语义

示例响应格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

分页格式示例：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 100
  }
}
```

---

## 23. Environment Strategy

建议至少区分：
- `development`
- `staging`
- `production`

关键环境变量包括：
- DATABASE_URL
- REDIS_URL
- QINIU_ACCESS_KEY
- QINIU_SECRET_KEY
- QINIU_BUCKET
- QINIU_REGION
- QINIU_UPLOAD_URL
- QINIU_SERVER_UPLOAD_URL
- QINIU_PUBLIC_BASE_URL
- QINIU_USE_CDN
- CDN_BASE_URL
- JWT_SECRET / AUTH_SECRET
- FFMPEG_PATH
- APP_BASE_URL

必须提供 `.env.example`。

---

## 24. Non-Goals for MVP

以下能力不纳入当前 MVP：
- 弹幕系统
- 直播系统
- 复杂推荐算法
- 多语言
- 支付 / 充电 / 投币
- 完整社交关系链
- 大规模风控系统

这些能力在架构上要预留扩展空间，但当前不优先实现。

---

## 25. Future Evolution

后续可扩展方向：
- 独立 Admin App
- 独立 API 服务（若当前仍为 Next.js API）
- 独立转码集群
- 搜索引擎（Elasticsearch / Meilisearch）
- 推荐系统
- 弹幕系统
- 通知系统
- 举报与风控系统
- 数据分析后台

---

## 26. Implementation Constraints for Agents

为保证 agent 开发一致性，必须遵守以下约束：

1. 不允许把复杂业务逻辑直接写进 API Route
2. 所有新增接口必须先定义输入输出结构
3. 所有数据库操作通过 Prisma 或封装仓储层完成
4. 所有上传与转码流程必须通过状态流转管理
5. 不允许在未评估影响范围的情况下随意修改目录结构
6. 不允许未经批准引入新依赖
7. 所有关键模块改动必须给出测试步骤
8. 所有后台敏感操作必须考虑权限校验与审计日志
9. 所有异步任务必须考虑失败与重试
10. 所有新功能优先复用已有组件和服务

---

## 27. Current MVP Milestones

### Phase 1
- 用户注册登录
- 用户基础资料
- 分类模型
- 视频草稿模型

### Phase 2
- 视频上传
- OSS 集成
- 转码 Worker
- 视频封面与元数据生成

### Phase 3
- 视频播放页
- 评论 / 点赞 / 收藏
- 首页推荐 / 分类页
- 个人主页

### Phase 4
- 管理后台
- 视频审核
- 评论管理
- 用户管理

---

## 28. Current Implementation Snapshot

当前已落地模块：
- 鉴权：注册 / 登录 / 登出 / 当前用户
- 用户：个人资料查询与更新、个人主页、我的投稿
- 分类：分类 CRUD、分类页、分类视频查询 API
- 视频：草稿创建、公开视频列表、视频详情、推荐视频、首页最新/热门展示
- 上传：OSS 预签名直传、上传完成回调、转码入队
- 转码：BullMQ Worker、FFmpeg/FFprobe、HLS/封面上传 OSS、状态回写
- 审核：后台审核接口与页面
- 互动：评论/回复/删除/隐藏、点赞/收藏、统计数同步策略
- 后台：视频管理、评论管理、用户管理、分类管理
- 健康检查：`GET /api/health`
- 质量：Happy Path E2E 脚本、基础结构化日志

当前仍未完全落地的模块：
- 首页专用 Feed API
- 搜索占位
- 推荐位配置占位
- 完整错误上报集成
- 分片上传

---

## 29. Summary

本项目采用以 Next.js 为中心的全栈架构，结合 PostgreSQL、Redis、Prisma、OSS、BullMQ、FFmpeg 构建视频网站 MVP。系统重点围绕“视频上传 → 转码 → 审核 → 发布 → 播放 → 互动”主链路设计，并通过明确的模块分层和状态流转保证工程可维护性。

当前重点不是一次性实现完整视频平台，而是在架构上保证：
- MVP 可快速落地
- 关键链路稳定
- 后续可平滑演进

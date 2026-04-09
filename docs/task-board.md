# Task Board

本任务板用于指导 AI agent 以小步、可验证、可回滚的方式完成视频网站 MVP 开发。  
所有任务严格遵守 `coding-rules.md` 中的分层、命名、校验、权限与工程约束。

---

## 0. Global Conventions

### 0.1 Task Execution Order
任务需按 Phase 顺序执行。同一 Phase 内任务按编号顺序执行。  
未完成上游任务不得跳级执行下游任务。

### 0.2 Layering Constraints
- UI 层不得直接写业务逻辑或 Prisma 查询
- API 层仅做校验、鉴权、调用 Service
- Service 层处理业务与状态流转
- Repository 层封装 Prisma 访问
- Worker 层仅处理异步任务

### 0.3 Definitions
- `published` 视频才对前台可见
- 未登录用户为 Guest
- 后台页面需 Admin / Moderator 角色

---

## 1. Preconditions

### TASK-00: Project Initialization
Objective: 初始化项目骨架与工程约束
Scope:
- 创建目录结构
- 初始化环境变量模板 `.env.example`
- 配置 ESLint / Prettier / TypeScript strict
- 配置基础脚本：lint / typecheck / test / build
Acceptance:
- 可运行 pnpm lint/typecheck
- 目录结构符合 architecture.md
- `.env.example` 包含核心变量占位

### TASK-01: Documentation Context
Objective: 确保 agent 可访问核心文档
Scope:
- 将 architecture.md / coding-rules.md / product.md 放入 `/docs`
- 创建 `docs/glossary.md`（可选）
Acceptance:
- agent 可通过文件检索读取文档

---

## 2. Cross-Cutting Foundations

### TASK-02: Shared Types & SDK
Objective: 建立前后端共享类型与 SDK 基础
Scope:
- `packages/types`：定义通用接口类型
- `packages/sdk`：封装 API 请求函数
Acceptance:
- 前端通过 sdk 调用后端，不直接写 fetch

### TASK-03: Unified API Response
Objective: 统一 API 响应结构
Scope:
- 实现响应包装器
- 实现错误码枚举
- 实现分页包装器
Acceptance:
- 所有 API 返回 `{ code, message, data }`

### TASK-04: Input Validation Setup
Objective: 引入统一校验
Scope:
- 接入 zod
- 提供通用校验中间件 / 工具函数
Acceptance:
- API 层可统一使用 zod schema 校验

### TASK-05: Auth Infrastructure Choice
Objective: 确定鉴权方案
Scope:
- 选择 JWT 或 session 方案并记录在文档
- 实现基础鉴权中间件占位
Acceptance:
- 可校验请求是否已登录
- 可获取当前用户 ID

### TASK-06: Logging & Error Tracking Skeleton
Objective: 日志与错误上报占位
Scope:
- 接入结构化日志工具
- 预留错误上报接口
Acceptance:
- 可记录关键操作日志

---

## 3. Data Layer Foundations

### TASK-07: Prisma Initialization
Objective: 初始化 Prisma 与数据库连接
Scope:
- 初始化 Prisma schema
- 配置 DATABASE_URL
Acceptance:
- 可运行 prisma generate 与 migrate

### TASK-08: Core Models - User & Auth
Objective: 建立用户模型
Scope:
- users 表
- 基础字段：id / username / email / password_hash / role / created_at
Acceptance:
- 可创建用户记录

### TASK-09: Core Models - Category
Objective: 建立分类模型
Scope:
- categories 表
Acceptance:
- 可创建与查询分类

### TASK-10: Core Models - Video
Objective: 建立视频主模型
Scope:
- videos 表
- 状态字段覆盖 `draft/uploading/uploaded/transcoding/review_pending/published/rejected/hidden/deleted`
Acceptance:
- 可创建视频草稿

### TASK-11: Core Models - Video Asset
Objective: 建立视频资源模型
Scope:
- video_assets 表
- 记录原文件、HLS、封面、时长、分辨率
Acceptance:
- 可关联视频记录资源信息

### TASK-12: Core Models - Interaction
Objective: 建立评论 / 点赞 / 收藏模型
Scope:
- comments
- likes
- favorites
Acceptance:
- 可对视频进行互动记录

### TASK-13: Core Models - Admin & Audit
Objective: 建立后台管理基础表
Scope:
- reports（可选 MVP）
- audit_logs
Acceptance:
- 可记录后台操作

---

## 4. Authentication Module

### TASK-14: Register API
Objective: 实现用户注册
Scope:
- API: POST /api/auth/register
- 输入校验
- 密码哈希
- 创建用户
Acceptance:
- 可通过接口注册新用户
- 重复用户名/邮箱返回错误

### TASK-15: Login API
Objective: 实现用户登录
Scope:
- API: POST /api/auth/login
- 校验凭据
- 下发凭证
Acceptance:
- 登录成功可获取身份凭证
- 错误密码返回统一错误

### TASK-16: Current User API
Objective: 获取当前登录用户
Scope:
- API: GET /api/auth/me
Acceptance:
- 登录后可获取用户信息
- 未登录返回未授权

### TASK-17: Logout API
Objective: 登出
Scope:
- API: POST /api/auth/logout
Acceptance:
- 清除登录态

### TASK-18: Frontend Auth Pages
Objective: 前端登录 / 注册页面
Scope:
- 登录页表单
- 注册页表单
- 表单校验与错误提示
Acceptance:
- 可完成注册登录流程
- 登录后可访问受限页面

---

## 5. User Profile Module

### TASK-19: User Profile API
Objective: 获取用户资料
Scope:
- API: GET /api/users/:id
Acceptance:
- 可获取用户基础信息

### TASK-20: Update Profile API
Objective: 编辑个人资料
Scope:
- API: PATCH /api/users/me
Acceptance:
- 用户可修改昵称、简介、头像

### TASK-21: User Profile Page
Objective: 个人主页前端
Scope:
- 展示用户信息
- 展示用户投稿列表
Acceptance:
- 可查看自己与他人主页
- 列表可点击进入播放页

---

## 6. Category Module

### TASK-22: Category CRUD API
Objective: 分类管理接口
Scope:
- GET /api/categories
- POST /api/categories (admin)
- PATCH /api/categories/:id (admin)
Acceptance:
- 普通用户可读取分类
- 管理员可管理分类

### TASK-23: Category Seed Data
Objective: 初始化基础分类
Scope:
- 创建默认分类数据脚本
Acceptance:
- 系统初始至少有 5-10 个分类

---

## 7. Video Upload Module

### TASK-24: Video Draft API
Objective: 创建视频草稿
Scope:
- API: POST /api/videos/drafts
- 字段校验
Acceptance:
- 创作者可创建草稿

### TASK-25: OSS Upload Credential API
Objective: 生成直传凭证
Scope:
- API: POST /api/videos/upload-credential
- 封装 OSS SDK
Acceptance:
- 前端可获取上传签名

### TASK-26: Frontend Upload Page Scaffold
Objective: 投稿页基础结构
Scope:
- 表单：标题、简介、分类、标签
- 上传区域占位
Acceptance:
- 页面可渲染

### TASK-27: Frontend Multipart Upload
Objective: 实现分片直传 OSS
Scope:
- 分片上传实现
- 进度展示
- 错误重试
Acceptance:
- 可上传文件到 OSS
- 可显示进度

### TASK-28: Upload Completion Callback API
Objective: 通知后端上传完成
Scope:
- API: POST /api/videos/:id/upload-complete
- 更新视频状态为 uploaded
Acceptance:
- 后端记录文件信息并更新状态

### TASK-29: Enqueue Transcode Job
Objective: 上传完成后投递转码任务
Scope:
- 写入 BullMQ 任务
Acceptance:
- 任务进入队列

---

## 8. Video Processing Module

### TASK-30: Worker Skeleton
Objective: 建立转码 worker
Scope:
- 初始化 BullMQ worker
- 监听转码任务
Acceptance:
- 可消费队列任务

### TASK-31: Metadata Extraction
Objective: 提取视频元数据
Scope:
- 使用 FFmpeg 获取时长、分辨率等
Acceptance:
- 元数据可写回数据库

### TASK-32: Cover Generation
Objective: 自动生成封面
Scope:
- 截取关键帧并上传 OSS
Acceptance:
- 视频记录关联封面地址

### TASK-33: HLS Transcoding
Objective: 输出 HLS
Scope:
- FFmpeg 转码为 m3u8
- 上传结果到 OSS
Acceptance:
- 数据库记录 HLS 地址

### TASK-34: Processing Status Update
Objective: 更新视频状态
Scope:
- 转码成功 → review_pending
- 转码失败 → 记录错误
Acceptance:
- 状态正确流转

### TASK-35: Retry & Failure Handling
Objective: 失败重试机制
Scope:
- 配置重试次数
- 记录失败日志
Acceptance:
- 失败任务可重新触发

---

## 9. Video Review & Publish Module

### TASK-36: Review API
Objective: 审核接口
Scope:
- API: POST /api/admin/videos/:id/review
- 支持通过 / 拒绝 / 下架
Acceptance:
- 审核后状态更新

### TASK-37: Public Video Query API
Objective: 前台视频查询
Scope:
- 仅返回 published 视频
Acceptance:
- 未发布视频不可见

### TASK-38: Video Detail API
Objective: 视频详情接口
Scope:
- API: GET /api/videos/:id
Acceptance:
- 返回视频信息、作者、资源地址、统计

---

## 10. Playback Module

### TASK-39: Playback Page Scaffold
Objective: 视频播放页基础结构
Scope:
- 播放器区域
- 标题简介区域
- 作者卡片
- 操作区占位
Acceptance:
- 页面可渲染

### TASK-40: Artplayer Integration
Objective: 接入播放器
Scope:
- 渲染 HLS
- 基础控制
Acceptance:
- 可播放 published 视频

### TASK-41: Playback UX States
Objective: 播放页状态处理
Scope:
- loading / error / empty
Acceptance:
- 异常情况有提示

### TASK-42: Video Actions (Like/Favorite)
Objective: 点赞收藏前端交互
Scope:
- 按钮状态切换
- 调用 API
Acceptance:
- 登录用户可操作

---

## 11. Comments Module

### TASK-43: Create Comment API
Objective: 发表评论
Scope:
- API: POST /api/videos/:id/comments
Acceptance:
- 登录用户可评论

### TASK-44: Reply Comment API
Objective: 回复评论
Scope:
- API: POST /api/comments/:id/reply
Acceptance:
- 支持二级回复

### TASK-45: List Comments API
Objective: 获取评论列表
Scope:
- API: GET /api/videos/:id/comments
Acceptance:
- 支持分页

### TASK-46: Delete/Hide Comment API
Objective: 评论管理
Scope:
- 用户删除自己评论
- 管理员隐藏评论
Acceptance:
- 权限正确控制

### TASK-47: Comments UI
Objective: 评论区前端
Scope:
- 评论列表
- 发表框
- 回复框
Acceptance:
- 可正常交互

---

## 12. Like / Favorite Module

### TASK-48: Like API
Objective: 点赞接口
Scope:
- POST /api/videos/:id/like
- DELETE /api/videos/:id/like
Acceptance:
- 幂等操作

### TASK-49: Favorite API
Objective: 收藏接口
Scope:
- POST /api/videos/:id/favorite
- DELETE /api/videos/:id/favorite
Acceptance:
- 幂等操作

### TASK-50: Stats Sync Strategy
Objective: 统计数更新
Scope:
- 点赞数 / 收藏数更新策略
Acceptance:
- 前端显示与数据库一致

---

## 13. Homepage & Discovery Module

### TASK-51: Homepage List API
Objective: 首页推荐接口
Scope:
- API: GET /api/home/feed
- 返回最新 / 热门 / 分类混合
Acceptance:
- 可返回视频列表

### TASK-52: Homepage UI
Objective: 首页前端
Scope:
- 推荐列表
- 分类入口
Acceptance:
- 可点击进入播放页

### TASK-53: Category Page API
Objective: 分类页接口
Scope:
- API: GET /api/categories/:id/videos
Acceptance:
- 返回分类下视频

### TASK-54: Category Page UI
Objective: 分类页前端
Scope:
- 分类筛选与列表
Acceptance:
- 可浏览分类内容

---

## 14. Personal Center Enhancements

### TASK-55: My Videos API
Objective: 获取我的投稿
Scope:
- API: GET /api/users/me/videos
Acceptance:
- 创作者可查看自己稿件各状态

### TASK-56: My Videos UI
Objective: 个人中心投稿管理
Scope:
- 列表展示草稿 / 审核中 / 已发布
Acceptance:
- 可查看状态与进入编辑

---

## 15. Admin Module

### TASK-57: Admin Auth Guard
Objective: 后台访问控制
Scope:
- 中间件校验角色
Acceptance:
- 非管理员无法访问

### TASK-58: Admin Video List API
Objective: 后台视频管理接口
Scope:
- API: GET /api/admin/videos
- 支持状态筛选
Acceptance:
- 可分页查询

### TASK-59: Admin Video Management UI
Objective: 视频管理页面
Scope:
- 列表 + 审核操作
Acceptance:
- 可通过 / 拒绝 / 下架

### TASK-60: Admin Comment Management
Objective: 评论管理
Scope:
- API + UI
Acceptance:
- 可隐藏 / 删除评论

### TASK-61: Admin User Management
Objective: 用户管理
Scope:
- API + UI
Acceptance:
- 可查看用户列表与禁用

### TASK-62: Admin Category Management UI
Objective: 分类管理页面
Acceptance:
- 可增删改分类

---

## 16. Observability & Quality

### TASK-63: Health Check API
Objective: 系统健康检查
Scope:
- API: GET /api/health
Acceptance:
- 检查 DB / Redis 连通性

### TASK-64: Basic Logging Integration
Objective: 关键流程日志
Scope:
- 上传 / 转码 / 审核 / 后台操作
Acceptance:
- 可在日志中检索关键事件

### TASK-65: Error Tracking Integration
Objective: 错误上报占位
Acceptance:
- 前后端异常可上报

### TASK-66: E2E Happy Path Test
Objective: 主链路端到端验证
Scope:
- 注册 → 登录 → 上传 → 转码 → 发布 → 播放 → 评论
Acceptance:
- 可一次性跑通

---

## 17. Documentation Updates

### TASK-67: Update Architecture with Real Implementation
Objective: 同步实际实现与文档
Acceptance:
- 架构文档反映真实模块

### TASK-68: API Spec Draft
Objective: 输出核心 API 文档
Acceptance:
- 包含鉴权、视频、评论、后台主要接口

---

## 18. Post-MVP Preparation

### TASK-69: Search Placeholder
Objective: 预留搜索扩展点
Scope:
- 视频标题索引占位
Acceptance:
- 后续可接入搜索服务

### TASK-70: Recommendation Placeholder
Objective: 预留推荐位配置
Scope:
- 首页推荐位配置表
Acceptance:
- 后台可手动配置推荐

---

## 19. Definition of Ready for Each Task

每个任务开始前必须满足：
- 依赖的前置任务已完成
- 相关文档已阅读
- 输入输出已明确
- 不会引入未批准依赖

## 20. Definition of Done for Each Task

每个任务完成后必须满足：
- 功能符合验收标准
- 代码符合分层与命名规范
- 输入校验完整
- 权限控制正确
- 不破坏既有功能
- 提供验证步骤

## 21. Agent Execution Notes

AI agent 执行本任务板时必须：
1. 每次只执行一个任务
2. 执行前输出实施计划
3. 执行后输出变更总结与验证步骤
4. 遇到不确定问题先提问
5. 不得擅自合并多个任务
6. 不得擅自跳过中间状态
7. 不得在任务范围内扩展非 MVP 功能
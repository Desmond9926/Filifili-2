# Coding Rules

## 1. Purpose

本文档定义本项目的编码规范、工程约束、模块边界和 agent 工作规则。  
所有人类开发者与 AI agent 在修改代码时都必须遵循本规范。

目标：

- 保持代码结构清晰
- 保持命名、风格、一致性
- 降低跨模块改动风险
- 限制无计划重构
- 确保 AI 生成代码可维护、可测试、可演进

---

## 2. Global Rules

### 2.1 Mandatory Rules
1. 所有改动必须以最小必要改动为原则
2. 修改前必须先阅读相关模块与上下文
3. 不允许凭空假设不存在的文件、方法、表结构或接口
4. 不允许未经批准引入新依赖
5. 不允许把复杂业务逻辑直接写入路由层、页面层或组件层
6. 不允许绕过统一校验、统一错误处理和统一鉴权机制
7. 不允许在没有说明影响范围的情况下修改数据库结构
8. 不允许直接删除已有功能，除非明确说明替代方案
9. 所有新增代码必须与现有架构保持一致
10. 新增模块前先提交方案
11. 所有关键改动必须附带验证步骤
12. 优先使用已有工具链
13. 修改后给测试步骤
14. 不确定时先提问，不要猜

### 2.2 Preferred Workflow
每次开发任务按以下步骤进行：

1. 阅读需求文档
2. 阅读相关代码和模块
3. 输出实施计划
4. 说明涉及文件
5. 说明风险点
6. 经确认后再执行修改
7. 修改完成后进行自检
8. 提供验证步骤与后续建议

---

## 3. Repository & Module Boundaries

## 3.1 Directory Principles
目录结构必须体现职责边界，不允许随意堆叠。

推荐结构：

```txt
src/
  app/
    api/
    (pages)/
  components/
  features/
  hooks/
  stores/
  lib/
  server/
    modules/
    services/
    repositories/
    lib/
  types/
```

### 目录职责
- `app/`：Next.js 页面、路由、布局、API route
- `components/`：通用 UI 组件
- `features/`：业务功能模块的前端实现
- `hooks/`：通用 hooks
- `stores/`：Zustand stores
- `lib/`：前端工具函数、配置封装
- `server/modules/`：后端业务模块
- `server/services/`：服务层
- `server/repositories/`：数据访问层
- `server/lib/`：后端通用工具、基础设施封装
- `types/`：共享类型定义

---

## 4. Layering Rules

## 4.1 UI Layer
页面层和组件层只负责：
- 展示
- 用户交互
- 调用 hooks / actions / services
- 状态展示（loading / empty / error）

页面层和组件层不负责：
- 复杂业务逻辑
- 权限判断核心逻辑
- 数据库存取
- 文件处理
- 直接构造 SQL / Prisma 查询

## 4.2 API Layer
API Route 只负责：
- 解析请求
- 参数校验
- 调用鉴权
- 调用 service
- 返回统一响应

API Route 不负责：
- 核心业务判断
- 数据库复杂操作
- 上传处理细节
- 转码逻辑

## 4.3 Service Layer
Service 层负责：
- 业务逻辑编排
- 状态流转
- 权限规则判断
- 调用 repository
- 调用 OSS / Redis / Queue 等外部服务封装

## 4.4 Repository Layer
Repository 层负责：
- 封装 Prisma 查询
- 数据写入与读取
- 事务
- 复用常见查询逻辑

Repository 层不负责：
- 业务规则
- API 输入输出格式
- 组件/UI 逻辑

---

## 5. Naming Rules

## 5.1 General Naming
- 文件名：使用 `kebab-case`
- 变量名 / 函数名：使用 `camelCase`
- 组件名 / 类型名 / 类名：使用 `PascalCase`
- 常量名：使用 `UPPER_SNAKE_CASE`
- 数据库字段：使用 `snake_case` 或 Prisma 推荐风格（以项目既有风格为准）
- API path：使用小写短横线风格

## 5.2 Boolean Naming
布尔变量必须表达真实含义：
- `isPublished`
- `hasPermission`
- `canUpload`
- `shouldRetry`

避免：
- `flag`
- `ok`
- `status1`

## 5.3 Function Naming
函数命名必须体现行为：
- `getVideoById`
- `createVideoDraft`
- `publishVideo`
- `enqueueTranscodeJob`
- `toggleFavorite`

避免使用过于模糊的名称：
- `handleData`
- `processItem`
- `doThing`

---

## 6. Frontend Rules

## 6.1 Component Design
组件必须遵循以下原则：
- 优先拆分为可复用小组件
- 避免超大组件
- 展示组件与业务组件尽量分离
- 组件 props 必须清晰、可读、最小化

建议：
- 通用组件放 `components/`
- 业务组件放 `features/<feature-name>/components/`

## 6.2 Page Design
页面文件只负责：
- 获取路由参数
- 组合页面结构
- 调用 feature 组件
- 触发数据请求 hooks

不要在页面文件里写大量业务逻辑。

## 6.3 Hooks Rules
自定义 hooks 适用于：
- 数据请求封装
- UI 交互逻辑封装
- 重复逻辑复用

禁止：
- 在 hooks 中混入无关职责
- 写“万能 hook”
- 在 hook 中直接拼接复杂页面展示逻辑

## 6.4 Zustand Rules
Zustand 只用于：
- 本地 UI 状态
- 播放器状态
- 上传面板状态
- 跨组件但非持久化的交互状态

不要用 Zustand 管理：
- 所有服务端数据
- 列表请求缓存
- 接口分页缓存

服务端数据必须使用 TanStack Query（已规定为必选依赖）。

## 6.5 Form Rules
表单必须：
- 使用统一表单方案 react-hook-form
- 使用 zod 校验输入（schema 复用服务端校验时保持一致）
- 明确错误展示
- 明确提交态和禁用态

---

## 7. UI & Styling Rules

## 7.1 Styling Principles
- 优先使用 Tailwind CSS
- 优先使用 shadcn/ui 组件
- 不随意写大量内联样式
- 不随意引入新的 UI 库

## 7.2 Responsive Design
所有核心页面必须考虑：
- 桌面端
- 平板端
- 手机端（至少基本可用）

## 7.3 UX States
所有异步页面都必须处理：
- loading
- empty
- error
- success

不要只处理成功态。

## 7.4 Accessibility
基本要求：
- 按钮和链接语义正确
- 表单有 label
- 可点击区域合理
- 避免纯颜色表达状态

---

## 8. Backend Rules

## 8.1 API Design
所有 API 必须：
- 有明确输入输出
- 参数经过校验
- 返回统一结构
- 错误有统一格式
- 权限受控

统一响应格式：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

分页响应格式：

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

## 8.2 Validation
所有接口输入必须校验。  
推荐统一使用 `zod`。

校验范围包括：
- query
- params
- body
- headers（必要时）
- env

不允许信任前端输入。

## 8.3 Error Handling
错误处理必须统一：
- 业务错误使用统一错误码
- 不向客户端暴露敏感内部实现信息
- 未知错误记录日志
- 必要时上报错误追踪系统

禁止：
- 到处 `throw new Error('xxx')` 而不归类
- 直接把数据库错误原样返回给前端

## 8.4 Authorization
所有需要身份的接口必须鉴权。  
所有后台接口必须做角色权限控制。  
所有敏感操作必须检查操作者身份与角色。

---

## 9. Database & Prisma Rules

## 9.1 Schema Rules
Prisma schema 修改必须遵循：
- 先说明变更目的
- 说明受影响模块
- 保持命名一致
- 尽量避免破坏性变更
- 需要 migration

## 9.2 Table Design Principles
表结构设计应满足：
- 语义清晰
- 可审计
- 可扩展
- 避免滥用 JSON 字段
- 状态字段明确

## 9.3 Query Rules
- 优先封装到 repository
- 避免在 route 中直接写 Prisma 查询
- 避免重复查询逻辑散落多个文件
- 注意分页、排序、筛选一致性

## 9.4 Transaction Rules
涉及多表一致性操作时必须考虑事务，例如：
- 创建视频记录 + 创建资源记录
- 审核状态变更 + 审计日志写入
- 点赞/收藏变更 + 统计同步

---

## 10. Video Domain Rules

## 10.1 Status-Driven Design
视频相关逻辑必须围绕状态流转实现。  
不得跳过状态机直接修改终态。

推荐状态：
- `draft`
- `uploading`
- `uploaded`
- `transcoding`
- `review_pending`
- `published`
- `rejected`
- `hidden`
- `deleted`

## 10.2 Upload Rules
上传流程必须保证：
- 文件类型校验
- 文件大小限制
- 上传结果可追踪
- 上传完成后有明确确认动作
- 与视频记录绑定

## 10.3 Processing Rules
转码任务必须：
- 异步执行
- 可重试
- 可记录失败原因
- 状态可回写数据库
- 不阻塞主请求链路

## 10.4 Asset Rules
视频资产信息必须与视频主表职责分离，建议独立记录：
- 原视频
- HLS 输出
- 封面图
- 清晰度信息
- 时长与分辨率

---

## 11. Queue & Worker Rules

## 11.1 Queue Usage
BullMQ 任务必须：
- 命名明确
- payload 结构清晰
- 幂等
- 有失败重试策略
- 有日志

## 11.2 Worker Responsibilities
Worker 只负责异步任务处理：
- 转码
- 截帧
- 元数据提取
- 状态回写

Worker 不负责：
- 页面请求响应
- 用户直接交互逻辑

## 11.3 Retry Rules
所有可恢复失败任务应支持重试。  
重试策略必须可配置，避免无限重试。

---

## 12. OSS / External Services Rules

## 12.1 External Service Encapsulation
所有外部服务必须封装，不允许业务代码到处直接调用 SDK。

例如：
- `ossService`
- `queueService`
- `cacheService`

## 12.2 Configuration
外部服务配置必须来自环境变量。  
禁止硬编码：
- endpoint
- bucket
- access key
- secret
- CDN 地址

---

## 13. Logging Rules

## 13.1 What Must Be Logged
以下场景必须记录日志：
- 登录失败
- 上传开始 / 完成 / 失败
- 转码开始 / 成功 / 失败
- 审核操作
- 评论删除 / 隐藏
- 后台敏感操作
- 异步任务失败

## 13.2 Logging Principles
- 日志内容简洁且可检索
- 结构化日志优先
- 不记录明文密码、密钥、敏感 token

---

## 14. Security Rules

## 14.1 General Security
必须遵循：
- 所有输入做校验
- 所有鉴权接口检查身份
- 所有后台接口检查角色
- 上传文件限制类型和大小
- 避免 XSS 风险
- 避免把敏感内部错误暴露给前端

## 14.2 Sensitive Operations
以下操作必须审计：
- 下架视频
- 审核视频
- 删除评论
- 封禁用户
- 修改分类
- 修改推荐位

---

## 15. Testing Rules

## 15.1 Minimum Requirements
所有重要改动至少满足以下之一：
- 单元测试
- 集成测试
- 明确的手工验证步骤

## 15.2 Critical Paths to Test
以下链路优先保障：
- 注册 / 登录
- 视频上传
- 上传完成确认
- 转码任务入队
- 视频发布 / 审核
- 播放页加载
- 评论创建与删除
- 点赞 / 收藏切换
- 后台权限校验

## 15.3 Agent Validation
AI agent 修改完成后必须说明：
- 如何运行
- 如何验证
- 是否影响数据库
- 是否影响已有接口
- 是否需要补测试

---

## 16. Refactor Rules

## 16.1 Refactor Constraints
未经明确要求，不要做大范围重构。  
优先保证功能完成与局部可维护性。

## 16.2 Allowed Refactor
允许的重构：
- 提取重复逻辑
- 提取 service / repository
- 小范围命名优化
- 修复明显类型错误
- 改善测试可读性

## 16.3 Disallowed Refactor
禁止：
- 无说明地重写整个模块
- 改动大量目录结构
- 替换核心依赖
- 在功能开发任务中夹带大规模技术重构

---

## 17. Dependency Rules

## 17.1 New Dependencies
新增依赖前必须说明：
- 引入原因
- 用于解决什么问题
- 是否已有替代方案
- 体积与维护成本
- 是否影响部署

## 17.2 Preferred Strategy
优先使用：
- 现有依赖
- 原生能力
- 项目已有工具函数

不要为了小问题引入重库。

---

## 18. Documentation Rules

## 18.1 Must Update Docs When Needed
以下情况必须同步更新文档：
- 新增核心模块
- 修改架构边界
- 修改数据库核心模型
- 修改 API 规范
- 修改上传 / 转码主流程
- 修改角色权限模型

## 18.2 Code Comments
只在必要时写注释。  
注释应解释“为什么”，不是重复“做了什么”。

避免：
```ts
// increment count by 1
count += 1;
```

推荐：
```ts
// 防止重复投递导致统计错误，这里仅在状态从 unpublished -> published 时增加计数
```

---

## 19. Git & Commit Rules

## 19.1 Commit Principles
一次提交尽量只做一类事情：
- 功能开发
- bug 修复
- 重构
- 文档更新
- 配置更新

## 19.2 Suggested Commit Prefix
建议：
- `feat:`
- `fix:`
- `refactor:`
- `docs:`
- `chore:`
- `test:`

---

## 20. Agent-Specific Rules

## 20.1 Before Editing
Agent 在修改代码前必须：
1. 阅读相关文件
2. 总结当前实现方式
3. 给出最小修改方案
4. 说明涉及文件列表

## 20.2 During Editing
Agent 修改时必须：
- 保持风格一致
- 不引入无关改动
- 不随意改命名
- 不修改未涉及任务的业务逻辑

## 20.3 After Editing
Agent 修改后必须：
- 总结变更内容
- 标明影响范围
- 给出验证步骤
- 标明潜在风险
- 标明后续建议

## 20.4 When Uncertain
如果上下文不足，必须先提问，不得猜测。  
禁止“脑补实现”。

---

## 21. Definition of Done

一个任务完成，至少应满足：

1. 功能符合需求
2. 代码结构符合分层规范
3. 输入校验完整
4. 权限控制正确
5. 错误处理合理
6. 不破坏既有功能
7. 已提供验证步骤
8. 必要文档已更新

---

## 22. Quick Checklist

每次提交前检查：

- [ ] 是否遵循最小改动原则
- [ ] 是否阅读了相关上下文
- [ ] 是否保持分层清晰
- [ ] 是否做了参数校验
- [ ] 是否做了权限检查
- [ ] 是否避免了重复逻辑
- [ ] 是否没有引入未批准依赖
- [ ] 是否说明了影响范围
- [ ] 是否提供了验证步骤
- [ ] 是否需要更新文档

---

## 23. Final Rule

如本文档与临时任务要求冲突：
- 优先遵循安全性
- 优先遵循架构一致性
- 优先遵循最小改动原则
- 如仍冲突，先提出问题并等待确认

# PlayableForge 实施计划

**目标：** 构建完整的 PlayableForge 平台，实现素材上传 → AI 生成 → 对话迭代 → 批量变体的全流程。
**架构：** Next.js 14 单体应用，SQLite + Prisma，Vercel AI SDK，本地文件存储。
**设计文档：** `docs/superpowers/specs/2026-03-30-playableforge-design.md`

---

## 阶段一：脚手架与基础设施（P0）

### Task 1: 项目初始化
**目标：** 创建 Next.js 14 项目，配置 Tailwind CSS、Prisma、目录结构
**文件：**
- 创建: `playable-forge/` 项目根目录
- 创建: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`
- 创建: `prisma/schema.prisma`
- 创建: `.env.example`, `.env`
- 创建: `data/` 目录结构
**步骤：**
- [ ] `npx create-next-app@14` 初始化项目
- [ ] 安装所有依赖（prisma, ai, sharp, bcryptjs, jsonwebtoken, zod, archiver, swr, react-hook-form, lucide-react, clsx, tailwind-merge）
- [ ] 配置 Prisma schema（完整 7 张表）
- [ ] `npx prisma db push` 初始化数据库
- [ ] 创建 `data/uploads`, `data/base64`, `data/html`, `data/db` 目录
- [ ] 创建 `.env.example`
**验收：** `npm run dev` 能启动，访问 localhost:3000 看到默认页面，`npx prisma studio` 能看到所有表

### Task 2: 基础 UI 组件库
**目标：** 创建共享 UI 组件，统一设计风格
**文件：**
- 创建: `components/ui/button.tsx`
- 创建: `components/ui/input.tsx`
- 创建: `components/ui/card.tsx`
- 创建: `components/ui/badge.tsx`
- 创建: `components/ui/dialog.tsx`
- 创建: `components/ui/dropdown.tsx`
- 创建: `components/ui/tabs.tsx`
- 创建: `components/ui/toast.tsx`
- 创建: `lib/utils.ts` (cn 工具函数)
**步骤：**
- [ ] 用 Tailwind 实现基础组件（参考 shadcn/ui 风格，但手写不引入 shadcn）
- [ ] 每个组件支持基本的 variants（size, variant）
**验收：** 所有组件能导入使用，无 TypeScript 报错

### Task 3: 认证系统
**目标：** 实现用户注册/登录，JWT 认证，路由保护
**文件：**
- 创建: `lib/auth/jwt.ts`
- 创建: `lib/auth/password.ts`
- 创建: `lib/auth/middleware.ts`
- 创建: `app/api/auth/register/route.ts`
- 创建: `app/api/auth/login/route.ts`
- 创建: `app/api/auth/me/route.ts`
- 创建: `components/auth-provider.tsx`
- 创建: `components/protected-route.tsx`
- 创建: `app/login/page.tsx`
- 创建: `lib/db.ts` (Prisma client 单例)
**步骤：**
- [ ] 实现 JWT 签发/验证
- [ ] 实现 bcrypt 密码加密/比对
- [ ] 实现认证中间件（从 header 提取 token）
- [ ] 实现注册 API（校验用户名唯一、密码长度）
- [ ] 实现登录 API
- [ ] 实现 /api/auth/me
- [ ] 实现 AuthProvider（Context，管理 token + 用户状态）
- [ ] 实现 ProtectedRoute 组件
- [ ] 实现登录/注册页面（表单切换）
- [ ] 根 layout 中包裹 AuthProvider
**验收：** 能注册用户、登录获取 token、用 token 访问受保护 API、未登录跳转 /login

---

## 阶段二：素材管理（P0）

### Task 4: 素材上传与处理
**目标：** 实现多文件上传、自动压缩、缩略图生成、base64 预计算
**文件：**
- 创建: `lib/assets/processor.ts` (Sharp 压缩 + 缩略图)
- 创建: `lib/assets/base64.ts` (base64 编码 + 缓存)
- 创建: `app/api/projects/[id]/assets/upload/route.ts`
- 创建: `app/api/projects/[id]/assets/route.ts` (GET 列表)
- 创建: `app/api/projects/[id]/assets/[assetId]/route.ts` (PATCH/DELETE)
- 创建: `app/api/projects/[id]/assets/[assetId]/thumbnail/route.ts`
- 创建: `app/api/projects/[id]/assets/[assetId]/file/route.ts`
**依赖：** Task 1, Task 3
**步骤：**
- [ ] 实现 Sharp 图片压缩（保持视觉质量，目标压缩率 60-80%）
- [ ] 实现缩略图生成（200x200 内，JPEG）
- [ ] 实现 base64 预计算（写 .b64 文件）
- [ ] 实现上传 API（multipart/form-data，支持多文件）
- [ ] 自动创建项目目录结构
- [ ] 实现素材列表/更新/删除 API
- [ ] 实现文件/缩略图服务 API
**验收：** 上传图片后能在 data/uploads/ 看到压缩文件和缩略图，API 返回正确的元数据

### Task 5: AI 素材分类
**目标：** 上传完成后 AI 自动识别素材角色
**文件：**
- 创建: `lib/ai/provider.ts` (Vercel AI SDK 配置)
- 创建: `lib/ai/classify.ts` (分类逻辑 + prompt)
**依赖：** Task 4
**步骤：**
- [ ] 配置 Vercel AI SDK，连接 OpenAI 兼容端点
- [ ] 实现分类 prompt（参见设计文档 §5.2）
- [ ] 使用 `generateObject` + zod schema 确保结构化输出
- [ ] 上传 API 中调用分类，结果写入 Asset 记录
- [ ] 处理分类失败（fallback 到 "unrecognized"）
**验收：** 上传多张图片后，每张图片自动获得分类标签和变体角色建议

### Task 6: 素材面板 UI
**目标：** 实现工作台左侧的素材面板（上传区 + 素材网格）
**文件：**
- 创建: `app/projects/[id]/page.tsx` (工作台三栏布局骨架)
- 创建: `components/workbench/asset-panel.tsx`
- 创建: `components/workbench/upload-zone.tsx` (拖拽+点击+粘贴)
- 创建: `components/workbench/asset-grid.tsx`
- 创建: `components/workbench/asset-card.tsx` (缩略图+标签+角色)
- 创建: `hooks/use-assets.ts` (SWR hook)
**依赖：** Task 2, Task 4
**步骤：**
- [ ] 实现三栏布局框架（左素材/中对话/右预览）
- [ ] 实现拖拽上传区（drag & drop + click + paste）
- [ ] 实现素材网格（显示缩略图 + AI 分类标签 badge）
- [ ] 实现分类标签修改（下拉切换）
- [ ] 实现变体角色切换（variant/fixed/excluded）
- [ ] 显示压缩前后大小对比
- [ ] 显示预估 HTML 总体积
**验收：** 拖拽上传文件后，看到缩略图、分类标签、可修改分类和角色

---

## 阶段三：AI 生成与预览（P0）

### Task 7: AI 骨架生成
**目标：** 实现 AI 生成带 data-variant-slot 的 HTML 骨架
**文件：**
- 创建: `lib/ai/orchestrator.ts` (AI 编排器)
- 创建: `lib/ai/prompts.ts` (所有 prompt 集中管理)
- 创建: `lib/ai/retry.ts` (重试 + 降级)
- 创建: `app/api/projects/[id]/generate/route.ts` (SSE)
**依赖：** Task 5
**步骤：**
- [ ] 实现 AI 编排器的 generateSkeleton 方法
- [ ] 构建生成 prompt（素材元数据 + 效果图 + 描述 + 规范约束）
- [ ] 实现 SSE 流式返回（status/progress/skeleton/validation/complete/error/question 事件）
- [ ] 效果图以 image_url 方式传给 AI（仅传效果图，不传所有素材的 base64）
- [ ] 实现重试逻辑（最多 2 次重试）
**验收：** 调用 generate API，SSE 流中能收到状态更新，最终返回包含 data-variant-slot 的 HTML 骨架

### Task 8: HTML 合成器
**目标：** 将骨架 HTML 和 base64 素材合成完整 HTML
**文件：**
- 创建: `lib/html/synthesizer.ts`
**依赖：** Task 4 (base64 缓存)
**步骤：**
- [ ] 实现 slot 解析（查找所有 data-variant-slot）
- [ ] 实现 PLACEHOLDER 替换为实际 base64
- [ ] 实现未替换检测（报告遗漏的 slot）
- [ ] 实现体积计算
- [ ] 将合成结果写入 data/html/{projectId}/v{version}.html
**验收：** 给定骨架 + 素材映射，输出完整 HTML，体积计算准确，无遗漏 PLACEHOLDER

### Task 9: 校验引擎
**目标：** 实现 10 项校验规则 + 评级 + AI 自修复循环
**文件：**
- 创建: `lib/validation/engine.ts`
- 创建: `lib/validation/rules.ts` (10 项规则)
**依赖：** Task 8
**步骤：**
- [ ] 实现 10 项校验规则（参见设计文档 §7.1）
- [ ] 实现评级算法（A/B/C/D）
- [ ] 实现 AI 自修复循环（≤3 次，失败项→AI 修复→重新校验）
- [ ] 将生成流程串联：AI 生成 → 合成 → 校验 → (自修复) → 返回结果
**验收：** 给定 HTML 能正确检测所有违规项，评级准确，自修复能调 AI 修复并重新校验

### Task 10: 版本管理
**目标：** 每次 AI 生成/修改产生新版本，支持回退
**文件：**
- 创建: `app/api/projects/[id]/versions/route.ts` (GET 列表)
- 创建: `app/api/projects/[id]/versions/[versionId]/route.ts` (GET 详情)
- 创建: `app/api/projects/[id]/versions/[versionId]/rollback/route.ts`
- 创建: `app/api/projects/[id]/versions/[versionId]/lock/route.ts`
- 创建: `app/api/projects/[id]/versions/[versionId]/unlock/route.ts`
**依赖：** Task 7
**步骤：**
- [ ] 每次 AI 生成/迭代自动创建 HtmlVersion 记录
- [ ] 版本号自增
- [ ] 回退 = 基于历史版本创建新版本（不删除历史）
- [ ] 锁定/解锁操作更新 isLocked 字段
**验收：** 生成多个版本后能列出版本历史，能回退到任意版本，锁定/解锁正常工作

### Task 11: 预览面板
**目标：** iframe sandbox 渲染完整 HTML，横竖屏切换，设备模拟
**文件：**
- 创建: `app/api/projects/[id]/preview/route.ts`
- 创建: `app/api/projects/[id]/preview/[versionId]/route.ts`
- 创建: `components/workbench/preview-panel.tsx`
- 创建: `components/workbench/preview-frame.tsx`
- 创建: `components/workbench/device-selector.tsx`
- 创建: `components/workbench/orientation-toggle.tsx`
- 创建: `components/workbench/validation-badge.tsx`
**依赖：** Task 8, Task 9
**步骤：**
- [ ] 预览 API 返回合成后的完整 HTML（Content-Type: text/html）
- [ ] iframe sandbox 渲染（sandbox="allow-scripts"）
- [ ] 设备模拟（iPhone 13 Pro / iPhone SE / iPad 等预设尺寸）
- [ ] 横竖屏切换（调整 iframe 宽高比）
- [ ] 校验状态 badge（等级 + 体积）
**验收：** 工作台右侧能看到广告真实渲染效果，能切换设备和横竖屏

### Task 12: 对话迭代
**目标：** 聊天界面 + AI 修改 HTML + 自动校验
**文件：**
- 创建: `app/api/projects/[id]/iterate/route.ts` (SSE)
- 创建: `components/workbench/chat-panel.tsx`
- 创建: `components/workbench/chat-input.tsx`
- 创建: `components/workbench/message-list.tsx`
- 创建: `components/workbench/chat-message.tsx`
- 创建: `components/workbench/version-history.tsx`
- 创建: `hooks/use-sse.ts` (SSE 自定义 hook)
- 创建: `hooks/use-conversation.ts`
**依赖：** Task 7, Task 9, Task 10, Task 11
**步骤：**
- [ ] 实现迭代 API（接收当前骨架 + 用户消息 + 历史，SSE 返回新骨架）
- [ ] 实现对话消息存储（ConversationMessage 表）
- [ ] 实现聊天 UI（消息气泡，用户/AI/系统区分）
- [ ] 实现聊天输入（文本 + 可附加素材）
- [ ] 实现 useSSE hook（消费 SSE 事件流，更新 UI 状态）
- [ ] 每次迭代后自动合成 → 校验 → 更新预览
- [ ] 版本历史面板（Tab 切换 "对话"/"版本"）
- [ ] 对话中上传新素材 → 自动处理并应用
**验收：** 在聊天框输入修改指令，AI 返回新版本，预览自动更新，校验自动运行

---

## 阶段四：项目管理与仪表盘（P0/P1）

### Task 13: 项目 CRUD
**目标：** 项目的创建、列表、更新、删除
**文件：**
- 创建: `app/api/projects/route.ts` (GET 列表, POST 创建)
- 创建: `app/api/projects/[id]/route.ts` (GET/PATCH/DELETE)
**依赖：** Task 3
**步骤：**
- [ ] 创建项目 API（自动命名 or 用户指定）
- [ ] 列表 API（含变体计数、按更新时间排序）
- [ ] 更新 API（名称、状态）
- [ ] 删除 API（级联删除素材文件 + DB 记录）
**验收：** 能创建/列出/修改/删除项目，删除时文件同步清理

### Task 14: 仪表盘 + 项目列表页
**目标：** Dashboard 页面，含统计卡片和项目列表
**文件：**
- 创建: `app/api/stats/dashboard/route.ts`
- 创建: `app/dashboard/page.tsx`
- 创建: `components/dashboard/stats-bar.tsx`
- 创建: `components/dashboard/project-list.tsx`
- 创建: `components/dashboard/project-card.tsx`
- 创建: `components/dashboard/new-project-button.tsx`
**依赖：** Task 13
**步骤：**
- [ ] 统计 API（总项目数、本月变体数、首次通过率、平均迭代轮数）
- [ ] StatsBar（4 个卡片，参考 UI 截图）
- [ ] ProjectList（项目名、状态 badge、变体数、日期、箭头链接）
- [ ] NewProjectButton（创建后跳转工作台）
- [ ] 状态 badge 颜色：草稿(灰) / 进行中(绿) / 已完成(蓝)
**验收：** 访问 /dashboard 看到统计数据和项目列表，能新建项目跳转

---

## 阶段五：批量变体（P1）

### Task 15: 变体配置与批量生成
**目标：** 锁定骨架后，配置变体维度，排列组合，批量素材替换
**文件：**
- 创建: `lib/variants/generator.ts` (排列组合 + 批量合成)
- 创建: `app/api/projects/[id]/variant-config/route.ts`
- 创建: `app/api/projects/[id]/variants/generate/route.ts`
- 创建: `app/api/projects/[id]/variants/route.ts` (GET 列表)
- 创建: `app/api/variants/[variantId]/preview/route.ts`
- 创建: `app/api/projects/[id]/variants/download/route.ts` (ZIP)
**依赖：** Task 8, Task 10 (锁定骨架)
**步骤：**
- [ ] 实现变体维度自动检测（从 variantRole="variant" 的素材按 variantGroup 分组）
- [ ] 实现笛卡尔积组合计算
- [ ] 实现批量合成（遍历组合，替换 slot，写文件）
- [ ] 每个变体自动校验
- [ ] 预估总体积 API
- [ ] ZIP 打包下载（archiver）
**验收：** 6张背景 × 3张弹窗 = 18个变体，全部生成并校验，能打包下载 ZIP

### Task 16: 变体页面 UI
**目标：** 变体生成页面（骨架预览 + 维度配置 + 矩阵 + 批量操作）
**文件：**
- 创建: `app/projects/[id]/variants/page.tsx`
- 创建: `components/variants/skeleton-preview.tsx`
- 创建: `components/variants/dimension-config.tsx`
- 创建: `components/variants/dimension-row.tsx`
- 创建: `components/variants/combination-count.tsx`
- 创建: `components/variants/variant-matrix.tsx`
- 创建: `components/variants/variant-card.tsx`
- 创建: `components/variants/estimate-bar.tsx`
- 创建: `components/variants/batch-actions.tsx`
**依赖：** Task 15
**步骤：**
- [ ] 锁定骨架只读预览 + 解锁按钮
- [ ] 维度行（维度名 + 缩略图勾选）
- [ ] 组合计数展示（"6 × 3 = 18 个变体"）
- [ ] 变体矩阵网格（缩略图 + 绿框通过/红框失败）
- [ ] 底栏（预估体积 + 成本 + 进度条 + 开始生成按钮 + 批量下载）
**验收：** 参考 UI 截图，页面布局一致，能配置维度、生成变体、查看矩阵、下载 ZIP

---

## 阶段六：设置与收尾（P1）

### Task 17: 设置页面
**目标：** AI 配置、校验规则、压缩参数的管理界面
**文件：**
- 创建: `app/api/settings/route.ts`
- 创建: `app/settings/page.tsx`
- 创建: `components/settings/ai-settings-form.tsx`
- 创建: `components/settings/validation-settings-form.tsx`
- 创建: `components/settings/compression-settings-form.tsx`
- 创建: `lib/settings.ts` (设置读写，存 JSON 文件或 DB)
**依赖：** Task 2
**步骤：**
- [ ] 设置存储（简单 JSON 文件，`data/settings.json`）
- [ ] AI 设置表单（baseUrl, model, apiKey 脱敏显示, maxTokens）
- [ ] 校验设置表单（体积上限、平台选择）
- [ ] 压缩设置表单（图片质量、最大宽度、音频码率）
- [ ] System Prompt 查看/编辑
**验收：** 能修改设置并保存，修改后 AI 调用和校验使用新配置

### Task 18: 工作台页面头部与导航
**目标：** 完善工作台页面的头部信息栏、底部操作栏、全局导航
**文件：**
- 创建: `components/workbench/workbench-header.tsx`
- 创建: `components/workbench/lock-skeleton-button.tsx`
- 创建: `components/workbench/generate-variants-button.tsx`
- 创建: `components/layout/navbar.tsx`
- 修改: `app/layout.tsx`
**依赖：** Task 11, Task 12
**步骤：**
- [ ] 头部：返回箭头 + 项目名 + 校验等级 badge + 体积显示 + 设置图标
- [ ] 底栏：锁定骨架按钮（左） + 生成变体按钮（右，跳转变体页）
- [ ] 全局顶部导航栏（PlayableForge logo + 用户名 + 登出）
**验收：** 工作台页面完整，参考 UI 截图，所有元素就位

### Task 19: 整体联调与修复
**目标：** 端到端走通完整流程，修复集成问题
**步骤：**
- [ ] 完整流程测试：注册 → 登录 → 新建项目 → 上传素材 → AI 分类 → 生成初稿 → 预览 → 对话迭代 → 锁定骨架 → 配置变体 → 批量生成 → 下载 ZIP
- [ ] 检查所有边界情况（参见 PRD 第六节）
- [ ] 修复发现的问题
- [ ] 确保无 TypeScript 报错、无运行时错误
**验收：** 全流程可走通，无阻断性 bug

---

## 执行顺序与依赖关系

```
Task 1 (脚手架)
├── Task 2 (UI 组件) ─── Task 17 (设置)
├── Task 3 (认证) ────── Task 13 (项目 CRUD) ── Task 14 (仪表盘)
│   └── Task 4 (素材上传)
│       └── Task 5 (AI 分类)
│           ├── Task 6 (素材面板 UI)
│           └── Task 7 (AI 骨架生成)
│               ├── Task 8 (HTML 合成器)
│               │   ├── Task 9 (校验引擎)
│               │   │   └── Task 11 (预览面板)
│               │   └── Task 15 (变体生成)
│               │       └── Task 16 (变体页面 UI)
│               └── Task 10 (版本管理)
│                   └── Task 12 (对话迭代)
│                       └── Task 18 (头部与导航)
└── Task 19 (联调)
```

## 估时

| 阶段 | 任务 | 估时 |
|------|------|------|
| 一：基础设施 | Task 1-3 | 1.5 天 |
| 二：素材管理 | Task 4-6 | 2 天 |
| 三：AI 生成与预览 | Task 7-12 | 4 天 |
| 四：项目管理 | Task 13-14 | 0.5 天 |
| 五：批量变体 | Task 15-16 | 1.5 天 |
| 六：收尾 | Task 17-19 | 1.5 天 |
| **合计** | | **~11 天** |

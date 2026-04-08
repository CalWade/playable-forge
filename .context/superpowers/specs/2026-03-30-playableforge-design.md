# PlayableForge 工程设计规格 v1.0

> **日期**：2026-03-30  
> **基于**：PRD v4.1 + 工程设计 v1.1 + CEO Review  
> **状态**：待审核

---

## 一、系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Next.js 14 单体应用                              │
│                                                                     │
│  ┌─────────────────────────────┐   ┌──────────────────────────────┐ │
│  │        前端 (App Router)     │   │      API Routes (后端)       │ │
│  │                             │   │                              │ │
│  │  /login        认证页面      │   │  /api/auth/*    认证服务     │ │
│  │  /dashboard    项目列表+仪表盘│   │  /api/projects/* 项目管理   │ │
│  │  /projects/[id] 工作台      │   │  /api/assets/*   素材处理    │ │
│  │  /projects/[id]/variants 变体│   │  /api/generate/* AI生成      │ │
│  │  /settings     设置页面      │   │  /api/variants/* 变体管理    │ │
│  │                             │   │  /api/stats/*    统计数据     │ │
│  └──────────┬──────────────────┘   └──────┬───────────────────────┘ │
│             │ React Server Components       │                        │
│             │ + Client Components            │                        │
│  ┌──────────▼───────────────────────────────▼───────────────────────┐│
│  │                     核心服务层                                    ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           ││
│  │  │ AI 编排器 │ │HTML 合成器│ │ 校验引擎 │ │ 素材处理器│           ││
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘           ││
│  └───────┼────────────┼────────────┼────────────┼──────────────────┘│
│          │            │            │            │                    │
│  ┌───────▼────┐ ┌─────▼──────┐ ┌──▼───┐ ┌─────▼──────┐            │
│  │ Vercel AI  │ │  文件系统   │ │Prisma│ │   Sharp    │            │
│  │ SDK        │ │ (素材存储)  │ │(ORM) │ │ + FFmpeg   │            │
│  └───────┬────┘ └────────────┘ └──┬───┘ └────────────┘            │
│          │                        │                                 │
│  ┌───────▼────┐            ┌──────▼──────┐                         │
│  │ OpenAI 兼容│            │   SQLite    │                         │
│  │ API 端点   │            │  (dev.db)   │                         │
│  └────────────┘            └─────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 模块职责

| 模块 | 职责 | 关键文件 |
|------|------|---------|
| **AI 编排器** | 管理所有 AI 调用（分类/生成/迭代），处理重试和降级 | `lib/ai/orchestrator.ts` |
| **HTML 合成器** | 将骨架 HTML + base64 素材合成完整 HTML | `lib/html/synthesizer.ts` |
| **校验引擎** | 10 项规则校验，评级，驱动自修复循环 | `lib/validation/engine.ts` |
| **素材处理器** | 图片压缩(Sharp)、音频压缩(FFmpeg)、base64 编码 | `lib/assets/processor.ts` |
| **认证模块** | 用户注册/登录，JWT 签发/验证 | `lib/auth/` |

### 1.3 核心数据流

```
上传素材 → Sharp/FFmpeg 压缩 → 写入磁盘 + DB记录 → base64 预计算缓存
                                                          ↓
AI 分类 ← 文件名+尺寸+缩略图 ────────────────────── 素材元数据
    ↓
用户确认分类 → 点击"生成初稿"
    ↓
AI 编排器 → 发送(素材元数据 + 效果图base64 + 描述 + system prompt) → AI 返回骨架 HTML
    ↓
HTML 合成器 → 骨架 + base64 素材 → 完整 HTML
    ↓
校验引擎 → 10项检查 → 不通过？→ AI 自修复(≤3次) → 通过 → 展示预览
    ↓
对话迭代 → AI 编排器(当前骨架 + 用户指令) → 新骨架 → 合成 → 校验 → 预览
    ↓
锁定骨架 → 配置变体维度 → 排列组合 → 批量素材替换(不调AI) → 校验 → 下载
```

---

## 二、数据模型

### 2.1 Prisma Schema

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ==================== 用户 ====================

model User {
  id            String    @id @default(cuid())
  username      String    @unique
  passwordHash  String
  displayName   String?
  role          String    @default("member") // "member" | "admin"
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  projects      Project[]
}

// ==================== 项目 ====================

model Project {
  id            String    @id @default(cuid())
  name          String
  status        String    @default("draft") // "draft" | "in_progress" | "completed"
  description   String?
  userId        String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User      @relation(fields: [userId], references: [id])
  assets        Asset[]
  versions      HtmlVersion[]
  variants      Variant[]
  conversations ConversationMessage[]
  stats         ProjectStats?
}

// ==================== 素材 ====================

model Asset {
  id              String    @id @default(cuid())
  projectId       String
  fileName        String
  originalName    String
  mimeType        String
  fileSize        Int       // 原始文件大小 (bytes)
  compressedSize  Int?      // 压缩后大小 (bytes)
  width           Int?      // 图片宽度
  height          Int?      // 图片高度
  duration        Float?    // 音频时长 (秒)
  filePath        String    // 磁盘路径
  thumbnailPath   String?   // 缩略图路径
  base64Cache     String?   // 预计算的 base64（存文件路径，非内联）
  
  // AI 分类
  category        String    @default("unrecognized") 
  // "reference" | "background" | "popup" | "button" | "icon" | "audio" | "unrecognized"
  categoryConfirmed Boolean @default(false)
  
  // 变体控制
  variantRole     String    @default("fixed")
  // "variant" (参与排列组合) | "fixed" (每个变体都用) | "excluded" (不使用)
  variantGroup    String?   // 变体分组名（如 "background", "popup"）
  
  slotName        String?   // 对应骨架中的 data-variant-slot 值

  createdAt       DateTime  @default(now())
  
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// ==================== HTML 版本 ====================

model HtmlVersion {
  id              String    @id @default(cuid())
  projectId       String
  version         Int       // 自增版本号
  skeletonHtml    String    // AI 生成的骨架 HTML（不含 base64）
  fullHtmlPath    String?   // 合成后的完整 HTML 文件路径
  fullHtmlSize    Int?      // 完整 HTML 大小 (bytes)
  isLocked        Boolean   @default(false) // 是否已锁定为变体模板
  
  // 校验结果
  validationGrade String?   // "A" | "B" | "C" | "D"
  validationJson  String?   // JSON: 各项校验结果详情
  
  // 生成信息
  aiModel         String?   // 使用的模型
  promptTokens    Int?
  completionTokens Int?
  
  createdAt       DateTime  @default(now())
  
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  variants        Variant[]
}

// ==================== 对话消息 ====================

model ConversationMessage {
  id            String    @id @default(cuid())
  projectId     String
  role          String    // "user" | "assistant" | "system"
  content       String
  versionId     String?   // 关联的 HTML 版本（如果此消息产生了新版本）
  
  // 素材附件（对话中追加的素材）
  attachmentIds String?   // JSON array of asset IDs
  
  createdAt     DateTime  @default(now())
  
  project       Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
}

// ==================== 变体 ====================

model Variant {
  id              String    @id @default(cuid())
  projectId       String
  versionId       String    // 基于哪个锁定版本
  name            String    // 自动命名，如 "bg1_popup2"
  slotMapping     String    // JSON: { "background": "asset_id_1", "popup": "asset_id_2" }
  fullHtmlPath    String?   // 合成后的文件路径
  fullHtmlSize    Int?      // 文件大小
  
  // 校验
  validationGrade String?
  validationJson  String?
  
  status          String    @default("pending") // "pending" | "generated" | "failed"
  errorMessage    String?
  
  createdAt       DateTime  @default(now())
  
  project         Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  version         HtmlVersion @relation(fields: [versionId], references: [id])
}

// ==================== 项目统计 ====================

model ProjectStats {
  id                  String  @id @default(cuid())
  projectId           String  @unique
  iterationCount      Int     @default(0)   // 对话迭代次数
  firstPassValidation Boolean @default(false) // 首次生成是否通过校验
  totalVariants       Int     @default(0)
  passedVariants      Int     @default(0)
  
  project             Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

### 2.2 关键设计说明

- **base64Cache 不内联存储**：base64 字符串可能很大（几 MB），存为独立文件路径引用，避免 SQLite 行膨胀
- **skeletonHtml 直接存 DB**：骨架代码（不含 base64）通常 < 100KB，SQLite 可以承受
- **validationJson 存 JSON 字符串**：SQLite 无 JSON 列类型，用 String 存序列化 JSON
- **slotMapping 存 JSON**：变体的素材映射关系，格式如 `{"background": "asset_id", "popup": "asset_id"}`

---

## 三、API 路由设计

### 3.1 认证

```typescript
// POST /api/auth/register
interface RegisterRequest {
  username: string;     // 3-20 字符
  password: string;     // 最少 6 字符
  displayName?: string;
}
interface RegisterResponse {
  user: { id: string; username: string; displayName: string };
  token: string; // JWT
}

// POST /api/auth/login
interface LoginRequest {
  username: string;
  password: string;
}
interface LoginResponse {
  user: { id: string; username: string; displayName: string; role: string };
  token: string;
}

// GET /api/auth/me — 获取当前用户信息（需认证）
interface MeResponse {
  user: { id: string; username: string; displayName: string; role: string };
}
```

### 3.2 项目管理

```typescript
// GET /api/projects — 项目列表
interface ProjectListResponse {
  projects: Array<{
    id: string;
    name: string;
    status: string;
    variantCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

// POST /api/projects — 创建项目
interface CreateProjectRequest {
  name?: string; // 不提供则自动命名
}

// GET /api/projects/[id] — 项目详情
// PATCH /api/projects/[id] — 更新项目（名称/状态）
// DELETE /api/projects/[id] — 删除项目
```

### 3.3 素材管理

```typescript
// POST /api/projects/[id]/assets/upload — 上传素材（multipart/form-data）
// 支持多文件同时上传
interface UploadResponse {
  assets: Array<{
    id: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    compressedSize: number;
    width?: number;
    height?: number;
    category: string;        // AI 自动分类结果
    thumbnailUrl: string;
  }>;
  totalSize: number;
  estimatedHtmlSize: number; // 预估最终 HTML 体积
}

// PATCH /api/projects/[id]/assets/[assetId] — 修改素材属性
interface UpdateAssetRequest {
  category?: string;
  variantRole?: string;    // "variant" | "fixed" | "excluded"
  variantGroup?: string;
  slotName?: string;
}

// DELETE /api/projects/[id]/assets/[assetId] — 删除素材

// GET /api/projects/[id]/assets — 获取项目所有素材
// GET /api/projects/[id]/assets/[assetId]/thumbnail — 缩略图
// GET /api/projects/[id]/assets/[assetId]/file — 原始文件
```

### 3.4 AI 生成（SSE 流式）

```typescript
// POST /api/projects/[id]/generate — 生成初稿（SSE）
interface GenerateRequest {
  description?: string; // 用户的文字描述
}
// SSE 事件流:
// event: status     data: { step: "understanding" | "generating" | "validating" | "fixing", message: string }
// event: progress   data: { percent: number }
// event: skeleton   data: { html: string, versionId: string }
// event: validation data: { grade: string, results: ValidationResult[] }
// event: complete   data: { versionId: string, grade: string, fullHtmlSize: number }
// event: error      data: { message: string, canRetry: boolean }
// event: question   data: { message: string } // AI 反问用户

// POST /api/projects/[id]/iterate — 对话迭代（SSE）
interface IterateRequest {
  message: string;
  attachments?: string[]; // 新上传的素材 ID
}
// SSE 事件流同上

// GET /api/projects/[id]/versions — 版本列表
// GET /api/projects/[id]/versions/[versionId] — 版本详情
// POST /api/projects/[id]/versions/[versionId]/rollback — 回退到某版本
// POST /api/projects/[id]/versions/[versionId]/lock — 锁定骨架
// POST /api/projects/[id]/versions/[versionId]/unlock — 解锁骨架
```

### 3.5 预览

```typescript
// GET /api/projects/[id]/preview — 获取当前版本的完整 HTML（用于 iframe）
// GET /api/projects/[id]/preview/[versionId] — 获取指定版本的完整 HTML
// GET /api/variants/[variantId]/preview — 获取变体的完整 HTML
```

### 3.6 变体管理

```typescript
// GET /api/projects/[id]/variant-config — 获取变体维度配置
interface VariantConfigResponse {
  dimensions: Array<{
    name: string;           // 如 "background"
    label: string;          // 如 "背景图"
    assets: Array<{ id: string; thumbnailUrl: string; fileName: string }>;
    enabled: boolean;
  }>;
  totalCombinations: number;
  estimatedTotalSize: number;
}

// PATCH /api/projects/[id]/variant-config — 修改维度配置
interface UpdateVariantConfigRequest {
  dimensions: Array<{
    name: string;
    enabled: boolean;
    assetIds: string[];
  }>;
}

// POST /api/projects/[id]/variants/generate — 批量生成变体
interface BatchGenerateResponse {
  total: number;
  variants: Array<{
    id: string;
    name: string;
    status: "pending";
  }>;
}
// 注意：批量生成是同步操作（纯素材替换，不调 AI），通常 < 5 秒完成

// GET /api/projects/[id]/variants — 变体列表
// GET /api/projects/[id]/variants/download — 打包下载 ZIP
```

### 3.7 统计

```typescript
// GET /api/stats/dashboard — 仪表盘数据
interface DashboardResponse {
  totalProjects: number;
  monthlyVariants: number;
  firstPassRate: number;      // 首次通过率 (0-1)
  avgIterations: number;      // 平均迭代轮数
  recentProjects: Array<{
    id: string;
    name: string;
    status: string;
    updatedAt: string;
  }>;
}
```

### 3.8 设置

```typescript
// GET /api/settings — 获取系统设置
// PATCH /api/settings — 更新设置
interface SettingsData {
  ai: {
    baseUrl: string;
    model: string;
    fallbackModel?: string;
    maxTokens: number;
  };
  validation: {
    maxFileSize: number;     // bytes, default 5242880
    warnFileSize: number;    // bytes, default 4194304
    platform: string;        // "applovin"
  };
  compression: {
    imageQuality: number;    // 0-100, default 80
    maxImageWidth: number;   // pixels, default 1920
    audioTargetKbps: number; // default 128
  };
}
```

### 3.9 中间件

所有 `/api/*` 路由（除 `/api/auth/register` 和 `/api/auth/login`）都需要 JWT 认证：

```typescript
// lib/auth/middleware.ts
export async function withAuth(request: NextRequest): Promise<AuthResult> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new AuthError('Missing token');
  
  const payload = verifyJwt(token);
  return { userId: payload.sub, role: payload.role };
}
```

---

## 四、前端页面结构

### 4.1 页面路由表

| 路由 | 页面 | 类型 | 认证 |
|------|------|------|------|
| `/login` | 登录/注册 | Client | ✗ |
| `/` | 重定向到 `/dashboard` | - | ✓ |
| `/dashboard` | 项目列表 + 仪表盘 | Server + Client | ✓ |
| `/projects/[id]` | 工作台（素材+对话+预览） | Client | ✓ |
| `/projects/[id]/variants` | 变体生成页 | Client | ✓ |
| `/settings` | 系统设置 | Client | ✓ |

### 4.2 组件树

```
app/
├── layout.tsx                    // 根布局（含 AuthProvider）
├── login/
│   └── page.tsx
│       └── LoginForm             // 登录/注册表单切换
│
├── dashboard/
│   └── page.tsx
│       ├── StatsBar              // 4个统计卡片（总项目/本月变体/通过率/迭代轮数）
│       ├── NewProjectButton
│       └── ProjectList
│           └── ProjectCard       // 项目名/状态/变体数/日期/箭头
│
├── projects/[id]/
│   ├── page.tsx                  // 工作台主页面（三栏布局）
│   │   ├── WorkbenchHeader       // 项目名 + 校验等级 + 体积显示 + 设置
│   │   ├── AssetPanel            // 左栏
│   │   │   ├── UploadZone        // 拖拽上传区
│   │   │   └── AssetGrid
│   │   │       └── AssetCard     // 缩略图 + 分类标签 + 变体角色
│   │   ├── ChatPanel             // 中栏
│   │   │   ├── TabBar            // "对话" | "版本" 切换
│   │   │   ├── MessageList
│   │   │   │   └── ChatMessage   // 用户/AI/系统消息气泡
│   │   │   ├── ChatInput         // 文本输入 + 附件上传
│   │   │   └── VersionHistory    // 版本时间线
│   │   │       └── VersionItem
│   │   └── PreviewPanel          // 右栏
│   │       ├── PreviewFrame      // iframe sandbox 渲染
│   │       ├── DeviceSelector    // 设备模拟下拉
│   │       ├── OrientationToggle // 横竖屏切换
│   │       └── ValidationBadge   // 校验状态
│   │
│   ├── LockSkeletonButton        // 底栏左：锁定骨架
│   └── GenerateVariantsButton    // 底栏右：生成变体
│
│   └── variants/
│       └── page.tsx              // 变体生成页
│           ├── SkeletonPreview   // 锁定骨架预览（只读）+ 解锁按钮
│           ├── DimensionConfig
│           │   └── DimensionRow  // 维度名 + 素材缩略图勾选
│           ├── CombinationCount  // "6 × 3 = 18 个变体"
│           ├── VariantMatrix     // 变体网格预览
│           │   └── VariantCard   // 缩略图 + 状态（绿框/红框）
│           ├── EstimateBar       // 预估体积 + 成本 + 进度
│           └── BatchActions      // 开始生成 + 批量下载
│
├── settings/
│   └── page.tsx
│       ├── AISettingsForm
│       ├── ValidationSettingsForm
│       └── CompressionSettingsForm
│
└── components/                   // 共享组件
    ├── ui/                       // 基础 UI（Button, Input, Dialog, Badge, Card...）
    ├── AuthProvider.tsx           // JWT 状态管理
    ├── ProtectedRoute.tsx        // 路由保护
    └── GenerateButton.tsx        // 生成初稿按钮（带 loading 状态）
```

### 4.3 状态管理

| 范围 | 方案 | 说明 |
|------|------|------|
| 全局认证 | React Context (`AuthProvider`) | JWT token + 用户信息 |
| 服务端数据 | SWR 或 React Query | 项目列表、素材列表、版本列表等 |
| SSE 流 | 自定义 Hook (`useSSE`) | AI 生成/迭代的流式进度 |
| 工作台本地状态 | `useState` / `useReducer` | 当前预览版本、设备选择、横竖屏 |
| 表单 | React Hook Form | 设置页面、登录表单 |

---

## 五、AI 集成设计

### 5.1 Vercel AI SDK 配置

```typescript
// lib/ai/provider.ts
import { createOpenAI } from '@ai-sdk/openai';

export const aiProvider = createOpenAI({
  baseURL: process.env.AI_BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

export function getModel(modelId?: string) {
  return aiProvider(modelId || process.env.AI_MODEL || 'gpt-4o');
}
```

### 5.2 场景 A：素材分类

```typescript
// lib/ai/classify.ts
import { generateObject } from 'ai';
import { z } from 'zod';

const classificationSchema = z.object({
  assets: z.array(z.object({
    fileName: z.string(),
    category: z.enum([
      'reference', 'background', 'popup', 'button', 'icon', 'audio', 'unrecognized'
    ]),
    confidence: z.number(),
    suggestedSlotName: z.string().optional(),
    suggestedVariantRole: z.enum(['variant', 'fixed', 'excluded']),
  })),
});

const CLASSIFY_SYSTEM_PROMPT = `你是一个 Playable Ad 素材分类专家。根据给定的素材文件信息，判断每个素材在广告中的角色。

分类规则：
- reference (效果图/参考图)：通常是完整的广告截图或设计稿，尺寸较大，内容丰富
- background (背景图)：全屏背景素材，通常尺寸大（>= 750px 宽），风景/场景类
- popup (弹窗/卡片)：UI 弹窗、对话框、卡片，通常有圆角或边框特征，文件名可能含 popup/dialog/card/win
- button (按钮/CTA)：下载按钮、操作按钮，通常较小且宽>高，文件名可能含 btn/button/cta/download/play
- icon (图标/装饰)：手指引导、Logo、星星、小图标，通常较小（< 200px）
- audio (音频)：MP3/WAV 文件
- unrecognized：无法判断

变体角色推断：
- 如果同类素材有多个（如多张背景图），标为 variant
- 如果是唯一的按钮/CTA，标为 fixed
- 效果图/参考图标为 excluded（不参与最终 HTML）

请返回 JSON 格式。confidence 为 0-1 之间的置信度。`;
```

### 5.3 场景 B：骨架生成

```typescript
const GENERATE_SYSTEM_PROMPT = `你是一个 Playable Ad HTML 开发专家。你需要生成一个单文件 HTML 广告，遵循以下严格规范：

## 输出格式
生成完整的 HTML 代码，但所有素材位置使用占位符而非实际 base64 数据。

## 素材占位规则
- 每个需要素材的位置，使用 data-variant-slot 属性标记
- 图片：<img data-variant-slot="background" src="data:image/png;base64,PLACEHOLDER" />
- 音频：<audio data-variant-slot="bgm" src="data:audio/mp3;base64,PLACEHOLDER"></audio>
- src 属性必须包含 "PLACEHOLDER" 作为占位符，系统会自动替换为实际 base64

## AppLovin Playable Ad 规范
1. 单文件 HTML，所有资源必须内嵌（base64），不允许任何外部链接（<script src>, <link href>, <img src="http..."> 等）
2. 必须实现 MRAID 2.0 协议：
   - 监听 mraid ready 事件
   - 通过 mraid.open(url) 跳转商店
   - 检测 mraid.getState() === 'default' 才开始
3. 横竖屏全屏适配：
   - 使用 CSS media queries 或 JS 监听 orientation change
   - 横屏和竖屏都必须正确布局
   - 使用 viewport meta: <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
4. 首次交互后广告才开始（点击/触摸启动）
5. 音频只在用户交互后播放
6. 不设退出按钮（平台统一处理）

## 代码质量要求
- 所有 CSS 写在 <style> 标签内（不允许外部样式表）
- 所有 JS 写在 <script> 标签内（不允许外部脚本）
- 动画优先用 CSS animation/transition，复杂交互用 JS
- 代码要简洁高效，最终含 base64 后需 < 5MB

## 你会收到
1. 素材列表：文件名、尺寸、分类、slot名称
2. 效果图（如果有）：作为图片附件
3. 用户描述（如果有）

## 你需要返回
仅返回完整的 HTML 代码，不要有任何解释文字。从 <!DOCTYPE html> 开始，到 </html> 结束。`;
```

### 5.4 场景 C：对话迭代

```typescript
const ITERATE_SYSTEM_PROMPT = `你是一个 Playable Ad HTML 开发专家。用户会给你当前的 HTML 骨架代码和修改指令。

## 你的任务
根据用户的自然语言描述，修改 HTML 代码。

## 规则
1. 保留所有 data-variant-slot 属性，不要删除或更改 slot 名称
2. 保留 MRAID 协议代码
3. 保留横竖屏适配逻辑
4. 保留首次交互启动逻辑
5. 不要引入任何外部资源引用
6. 修改后的代码仍然必须是完整的 HTML（从 <!DOCTYPE html> 到 </html>）
7. 如果用户的修改请求不明确，主动反问，不要猜

## 你会收到
1. 当前的完整骨架 HTML 代码
2. 用户的修改指令

## 你需要返回
仅返回修改后的完整 HTML 代码，不要解释。`;
```

### 5.5 上下文管理

```typescript
// lib/ai/orchestrator.ts
export class AIOrchestrator {
  // 生成初稿
  async generateSkeleton(params: {
    assets: AssetMetadata[];       // 素材元数据（不含 base64）
    referenceImages?: string[];    // 效果图的 base64（仅效果图传给 AI）
    description?: string;
    projectId: string;
  }): Promise<ReadableStream> {
    // 构建消息
    const messages = [
      { role: 'system', content: GENERATE_SYSTEM_PROMPT },
      { role: 'user', content: this.buildGeneratePrompt(params) },
    ];
    // 如有效果图，作为 image_url 附件传入
    return streamText({ model: getModel(), messages });
  }

  // 对话迭代
  async iterate(params: {
    currentSkeleton: string;       // 当前骨架 HTML（约 50KB）
    userMessage: string;
    conversationHistory: Message[]; // 历史对话（最近 10 轮）
    newAttachments?: string[];      // 新上传素材的 base64（如有）
  }): Promise<ReadableStream> {
    const messages = [
      { role: 'system', content: ITERATE_SYSTEM_PROMPT },
      ...params.conversationHistory.slice(-20), // 最近 20 条消息
      { role: 'user', content: `当前 HTML 骨架：\n\`\`\`html\n${params.currentSkeleton}\n\`\`\`\n\n修改要求：${params.userMessage}` },
    ];
    return streamText({ model: getModel(), messages });
  }
}
```

### 5.6 错误处理与重试

```typescript
// lib/ai/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;    // default 2
    retryDelay?: number;    // default 1000ms
    fallbackModel?: string; // 降级模型
  } = {}
): Promise<T> {
  const { maxRetries = 2, retryDelay = 1000, fallbackModel } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        if (fallbackModel) {
          // 最后尝试降级模型
          return await fn(); // 调用方切换 model
        }
        throw error;
      }
      await new Promise(r => setTimeout(r, retryDelay * (attempt + 1)));
    }
  }
  throw new Error('Unreachable');
}
```

---

## 六、HTML 合成器

### 6.1 合成流程

```typescript
// lib/html/synthesizer.ts
export class HtmlSynthesizer {
  /**
   * 将骨架 HTML + 素材 base64 合成完整 HTML
   * @param skeleton - AI 生成的骨架 HTML（含 PLACEHOLDER）
   * @param slotAssets - slot 名称到 base64 内容的映射
   * @returns 完整 HTML 字符串
   */
  synthesize(skeleton: string, slotAssets: Map<string, SlotAsset>): SynthesisResult {
    let html = skeleton;
    
    // 1. 查找所有 data-variant-slot 属性
    const slotRegex = /data-variant-slot="([^"]+)"[^>]*src="data:[^;]+;base64,PLACEHOLDER"/g;
    
    // 2. 逐个替换 PLACEHOLDER 为实际 base64
    for (const [slotName, asset] of slotAssets) {
      const placeholder = new RegExp(
        `(data-variant-slot="${slotName}"[^>]*src="data:[^;]+;base64,)PLACEHOLDER"`,
        'g'
      );
      html = html.replace(placeholder, `$1${asset.base64}"`);
    }
    
    // 3. 检查是否有未替换的 PLACEHOLDER
    const unreplaced = html.match(/PLACEHOLDER/g);
    
    // 4. 计算体积
    const size = Buffer.byteLength(html, 'utf-8');
    
    return {
      html,
      size,
      unreplacedSlots: unreplaced ? unreplaced.length : 0,
    };
  }
}
```

### 6.2 data-variant-slot 规范

| 属性 | 规则 |
|------|------|
| 命名 | 小写字母+连字符，如 `background`, `popup-1`, `btn-cta`, `bgm` |
| 唯一性 | 同一 slot 名称可出现多次（如背景图在横屏竖屏各用一次） |
| 必须配对 | 每个 slot 必须在素材表中有对应的 `slotName` |
| src 格式 | `src="data:{mimeType};base64,PLACEHOLDER"` |

### 6.3 批量变体排列组合

```typescript
// lib/variants/generator.ts
export function generateVariantCombinations(
  dimensions: VariantDimension[]
): VariantCombination[] {
  // 笛卡尔积
  const enabledDimensions = dimensions.filter(d => d.enabled);
  
  function cartesian(dims: VariantDimension[]): VariantCombination[] {
    if (dims.length === 0) return [{}];
    const [first, ...rest] = dims;
    const restCombos = cartesian(rest);
    const result: VariantCombination[] = [];
    
    for (const asset of first.assets) {
      for (const combo of restCombos) {
        result.push({ ...combo, [first.name]: asset.id });
      }
    }
    return result;
  }
  
  return cartesian(enabledDimensions);
}

// 批量合成：不调 AI，纯素材替换
export async function batchGenerate(
  skeleton: string,
  combinations: VariantCombination[],
  assetBase64Map: Map<string, SlotAsset>,
  synthesizer: HtmlSynthesizer
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  
  for (const combo of combinations) {
    const slotAssets = new Map<string, SlotAsset>();
    for (const [slotName, assetId] of Object.entries(combo)) {
      slotAssets.set(slotName, assetBase64Map.get(assetId)!);
    }
    // 固定素材也加入
    // ... merge fixed assets
    
    const result = synthesizer.synthesize(skeleton, slotAssets);
    results.push({ combination: combo, ...result });
  }
  
  return results;
}
```

---

## 七、校验引擎

### 7.1 校验规则实现

```typescript
// lib/validation/engine.ts
interface ValidationRule {
  id: string;
  name: string;
  level: 'error' | 'warning';
  check: (html: string, meta: ValidationMeta) => ValidationCheckResult;
}

const rules: ValidationRule[] = [
  {
    id: 'file-size',
    name: '文件体积',
    level: 'error',
    check: (html) => {
      const size = Buffer.byteLength(html, 'utf-8');
      return {
        passed: size <= 5 * 1024 * 1024,
        detail: `${(size / 1024).toFixed(0)}KB / 5120KB`,
        value: size,
      };
    },
  },
  {
    id: 'file-size-warn',
    name: '体积预警',
    level: 'warning',
    check: (html) => {
      const size = Buffer.byteLength(html, 'utf-8');
      return {
        passed: size <= 4 * 1024 * 1024,
        detail: `${(size / 1024).toFixed(0)}KB / 4096KB`,
        value: size,
      };
    },
  },
  {
    id: 'no-external-refs',
    name: '外部引用检查',
    level: 'error',
    check: (html) => {
      const externalPatterns = [
        /src=["']https?:\/\//gi,
        /href=["']https?:\/\//gi,
        /<link[^>]+href=["'](?!data:)/gi,
        /<script[^>]+src=["'](?!data:)/gi,
      ];
      const found: string[] = [];
      for (const pattern of externalPatterns) {
        const matches = html.match(pattern);
        if (matches) found.push(...matches);
      }
      return {
        passed: found.length === 0,
        detail: found.length === 0 ? '无外部引用' : `发现 ${found.length} 个外部引用`,
        violations: found,
      };
    },
  },
  {
    id: 'mraid-open',
    name: 'MRAID 跳转',
    level: 'error',
    check: (html) => ({
      passed: /mraid\.open\s*\(/.test(html),
      detail: /mraid\.open\s*\(/.test(html) ? '包含 mraid.open()' : '缺少 mraid.open()',
    }),
  },
  {
    id: 'mraid-ready',
    name: 'MRAID 状态处理',
    level: 'warning',
    check: (html) => ({
      passed: /mraid.*ready|addEventListener.*ready/s.test(html),
      detail: 'MRAID ready 事件监听',
    }),
  },
  {
    id: 'orientation',
    name: '横竖屏适配',
    level: 'error',
    check: (html) => {
      const hasMediaQuery = /@media.*orientation/i.test(html);
      const hasOrientationJS = /orientation|innerWidth|innerHeight|resize/i.test(html);
      const passed = hasMediaQuery || hasOrientationJS;
      return { passed, detail: passed ? '有横竖屏适配逻辑' : '缺少横竖屏适配' };
    },
  },
  {
    id: 'audio-autoplay',
    name: '音频自动播放检查',
    level: 'warning',
    check: (html) => ({
      passed: !/<audio[^>]*autoplay/i.test(html),
      detail: '音频自动播放检查',
    }),
  },
  {
    id: 'html-structure',
    name: 'HTML 完整性',
    level: 'error',
    check: (html) => {
      const hasDoctype = /<!DOCTYPE\s+html/i.test(html);
      const hasHtmlTag = /<html[\s>]/i.test(html) && /<\/html>/i.test(html);
      const hasHead = /<head[\s>]/i.test(html) && /<\/head>/i.test(html);
      const hasBody = /<body[\s>]/i.test(html) && /<\/body>/i.test(html);
      const passed = hasDoctype && hasHtmlTag && hasHead && hasBody;
      return { passed, detail: passed ? '结构完整' : '结构不完整' };
    },
  },
  {
    id: 'asset-integrity',
    name: '素材完整性',
    level: 'error',
    check: (html) => {
      const placeholders = (html.match(/PLACEHOLDER/g) || []).length;
      return {
        passed: placeholders === 0,
        detail: placeholders === 0 ? '所有素材已注入' : `${placeholders} 个素材未注入`,
      };
    },
  },
  {
    id: 'viewport',
    name: '移动端适配标签',
    level: 'warning',
    check: (html) => ({
      passed: /meta[^>]*viewport/i.test(html),
      detail: 'viewport meta 标签',
    }),
  },
];
```

### 7.2 评级算法

```typescript
function calculateGrade(results: ValidationCheckResult[]): string {
  const errors = results.filter(r => r.level === 'error' && !r.passed);
  const warnings = results.filter(r => r.level === 'warning' && !r.passed);
  
  if (errors.length === 0 && warnings.length === 0) return 'A';
  if (errors.length === 0 && warnings.length <= 2) return 'B';
  if (errors.length <= 1) return 'C';
  return 'D';
}
```

### 7.3 AI 自修复循环

```typescript
async function generateWithAutoFix(params: GenerateParams): Promise<GenerateResult> {
  const MAX_AUTO_FIX = 3;
  
  let skeleton = await aiOrchestrator.generateSkeleton(params);
  
  for (let attempt = 0; attempt < MAX_AUTO_FIX; attempt++) {
    const fullHtml = synthesizer.synthesize(skeleton, params.slotAssets);
    const validation = validator.validate(fullHtml.html);
    
    if (validation.grade === 'A' || validation.grade === 'B') {
      return { skeleton, validation, fullHtml };
    }
    
    // 收集失败项，让 AI 自修复
    const failedItems = validation.results
      .filter(r => !r.passed)
      .map(r => `- ${r.name}: ${r.detail}`)
      .join('\n');
    
    skeleton = await aiOrchestrator.iterate({
      currentSkeleton: skeleton,
      userMessage: `校验未通过，请修复以下问题：\n${failedItems}`,
      conversationHistory: [],
    });
  }
  
  // 超过 3 次，返回最新结果 + 失败项列表
  const finalHtml = synthesizer.synthesize(skeleton, params.slotAssets);
  const finalValidation = validator.validate(finalHtml.html);
  return {
    skeleton,
    validation: finalValidation,
    fullHtml: finalHtml,
    needsManualFix: true,
    failedItems: finalValidation.results.filter(r => !r.passed),
  };
}
```

---

## 八、认证系统

### 8.1 实现

```typescript
// lib/auth/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';

export function signJwt(payload: { sub: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): { sub: string; role: string } {
  return jwt.verify(token, JWT_SECRET) as { sub: string; role: string };
}

// lib/auth/password.ts
import bcrypt from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 8.2 前端 Token 管理

```typescript
// lib/auth/client.ts
// Token 存 localStorage，每次 API 请求自动附加 Authorization header
// AuthProvider 在 app 启动时检查 token 有效性（调 /api/auth/me）
// 过期/无效 → 跳转 /login
```

---

## 九、文件存储

### 9.1 目录结构

```
data/
├── uploads/                      # 上传的原始文件
│   └── {projectId}/
│       ├── {assetId}-original.jpg
│       ├── {assetId}-compressed.jpg
│       └── {assetId}-thumbnail.jpg
├── base64/                       # 预计算的 base64 文件
│   └── {projectId}/
│       └── {assetId}.b64
├── html/                         # 合成的完整 HTML
│   └── {projectId}/
│       ├── v{version}.html       # 版本 HTML
│       └── variants/
│           ├── {variantId}.html
│           └── all-variants.zip
└── db/
    └── dev.db                    # SQLite 数据库
```

### 9.2 文件命名规则

- 原始文件：`{assetId}-original.{ext}`
- 压缩文件：`{assetId}-compressed.{ext}`
- 缩略图：`{assetId}-thumbnail.jpg`（统一 JPG，200x200 内）
- base64 缓存：`{assetId}.b64`（纯文本，含 data URI 前缀）
- HTML 版本：`v{version}.html`
- 变体 HTML：`{variantId}.html`

### 9.3 清理策略

- 删除项目时级联删除该项目下所有文件
- 素材标记为 "excluded" 不删文件，仅 DB 标记
- 未来可加定时清理未关联文件的 cron

---

## 十、开发环境

### 10.1 依赖

```json
{
  "name": "playable-forge",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "db:seed": "prisma db seed",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^5.14.0",
    "ai": "^3.3.0",
    "@ai-sdk/openai": "^0.0.50",
    "sharp": "^0.33.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.23.0",
    "archiver": "^7.0.0",
    "tailwindcss": "^3.4.0",
    "swr": "^2.2.0",
    "react-hook-form": "^7.52.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.4.0"
  },
  "devDependencies": {
    "prisma": "^5.14.0",
    "typescript": "^5.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/archiver": "^6.0.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### 10.2 环境变量

```bash
# .env.example

# 数据库
DATABASE_URL="file:./data/db/dev.db"

# AI 服务（OpenAI 兼容端点）
AI_BASE_URL="https://your-api-endpoint/v1"
AI_API_KEY="sk-..."
AI_MODEL="gpt-4o"

# 认证
JWT_SECRET="your-random-secret-at-least-32-chars"

# 文件存储
DATA_DIR="./data"

# 服务
PORT=3000
NODE_ENV="development"
```

### 10.3 启动命令

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库
npx prisma generate
npx prisma db push

# 3. 启动开发服务器
npm run dev
```

---

## 附录：开发任务对照表

| PRD 功能 | 设计章节 | 预估 |
|---------|---------|------|
| F1 素材上传 + AI 分类 | §3.3 + §5.2 + §9 | 1.5 天 |
| F2 AI 生成初稿 | §5.3 + §6 + §7.3 | 2.5 天 |
| F3 实时预览 | §3.5 + §4.2 (PreviewPanel) | 1 天 |
| F4 对话迭代 | §3.4 + §5.4 + §4.2 (ChatPanel) | 1.5 天 |
| F5 批量变体 | §3.6 + §6.3 + §4.2 (variants) | 1.5 天 |
| F6 质量校验 | §7 | 0.5 天 |
| F8 项目管理 | §3.2 + §4.2 (dashboard) | 0.5 天 |
| F9 仪表盘 | §3.7 + §4.2 (StatsBar) | 0.5 天 |
| F10 设置 | §3.8 + §4.2 (settings) | 0.3 天 |
| 认证系统 | §8 | 0.5 天 |
| 脚手架 + DB | §10 + §2 | 0.3 天 |
| **合计** | | **约 10.6 天** |

---

*设计规格 v1.0 完。等待审核后进入 planning 阶段。*

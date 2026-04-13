# PlayableForge — 完整项目交接文档

> 最后更新：2026-04-13
> GitHub: https://github.com/CalWade/playable-forge (private)

---

## 一、项目概述

PlayableForge 是一个 Web 平台，用于批量生成 AppLovin Playable Ads（试玩广告）。

**核心流程：** 上传素材 → AI 视觉分类（可选）→ AI 生成 HTML 骨架 → 对话迭代修改 → 批量变体产出 → 下载 ZIP

**产出物：** 单文件 HTML（<5MB，base64 内嵌所有资源，MRAID 2.0 合规）

---

## 二、技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 14 (App Router) + React 18 |
| 样式 | Tailwind CSS + Claymorphism 蓝色主题 |
| 组件 | shadcn/ui 基础 + 自定义 clay 化 |
| 数据库 | SQLite + Prisma 5（**不是 7**，7 和 Next.js 14 不兼容） |
| AI | Vercel AI SDK (`ai` + `@ai-sdk/openai`)，OpenAI 兼容端点 |
| 图片 | Sharp（压缩+缩略图） |
| 音频 | FFmpeg（MP3 128kbps mono，可选） |
| 认证 | JWT + bcrypt |
| 测试 | Vitest（50 tests） |
| 部署 | 本地开发，支持服务器部署 |

---

## 三、关键架构决策

### 3.1 三张素材表分离
- `Asset` = 初始素材，参与 AI 骨架生成 + 预览合成（注入 HTML 的 base64）
- `ReferenceImage` = 效果参考图，只给 AI 看做布局参考，不注入 HTML
- `VariantAsset` = 变体素材，只参与批量替换，不进 AI 生成流程

### 3.2 骨架 + 合成架构
- AI 生成 HTML 骨架（带 `data-variant-slot="s1"` 占位符 + PLACEHOLDER）
- 系统层注入 base64 素材合成完整 HTML
- 批量变体 = 纯素材替换，不调 AI

### 3.3 slotName 是上传时生成的稳定 ID
- 上传时自动分配：s1, s2, s3...（短、稳定、项目内唯一）
- **永不改变**，不受分类影响
- prompt 里用 slot="s1"，AI 生成 data-variant-slot="s1"，合成时精确匹配
- 只用精确匹配，无 fallback（旧的四层模糊匹配已删除）

### 3.4 AI 分类与生成分离
- 分类是可选的手动操作，只输出 category（不输出 slotName）
- 分类可以用独立的 API/Key/Model（设置页有独立配置区）
- 分类失败不降级，直接报错给用户手动处理
- 生成不依赖分类结果（但分类后 prompt 里的 category 信息更准确）

### 3.5 AI 响应验证（lib/ai/response-validator.ts）
在 extractHtml **之前**检查原始 AI 输出：
- empty → 报错（显示实际响应长度和内容）
- refused → 提示安全声明
- question → 转对话
- truncated → 警告继续
- valid → 正常流程

### 3.6 校验 + 自修复（lib/generation/validate-and-fix.ts）
- 10 项规则校验 → error 级别失败项发给 AI 修复 → 重新校验 → 最多 3 轮
- mraid-open 是 error 级别（AppLovin 硬性要求）
- orientation、asset-integrity 是 warning 级别
- 外部引用严格检查，无白名单

### 3.7 多用途 AI 配置
```
settings.json
├── ai              ← 主配置（生成/迭代/修复）
│   ├── baseUrl, apiKey, model, maxTokens
├── aiOverrides     ← 按用途覆盖
│   └── classification  ← 素材分类（可选独立配置）
```
- `getModel()` → 生成用，读主配置
- `getClassificationModel()` → 分类用，读 classification 覆盖 > 主配置
- 必须用 `provider.chat()` 强制 /v1/chat/completions（第三方 API 不支持 /responses）

### 3.8 withAuth 高阶函数
所有 API route（除 auth/*）用 `withAuth` 包裹。支持 Authorization header 和 `?token=` query param。

### 3.9 前端 API 层
- `lib/api-client.ts` — 集中式 HTTP 客户端，自动带 auth header
- `lib/swr-fetcher.ts` — SWR 用的 fetcher，基于 api-client
- AuthProvider 在 login/register/logout 时同步 token 到 api-client
- SWR 调用用 `token ? url : null` 防止未认证请求

---

## 四、数据库表（12 张）

| 表 | 用途 |
|---|------|
| User | 用户名密码登录 |
| Project | 项目（含状态：draft/in_progress/completed） |
| Asset | 初始素材（AI 生成用），slotName 上传时自动分配 |
| ReferenceImage | 效果参考图（给 AI 看，不注入 HTML） |
| VariantAsset | 变体素材（批量替换用） |
| HtmlVersion | 骨架版本（含 parentId 用于回退追踪） |
| ConversationMessage | 对话历史（持久化） |
| Variant | 变体产出（含校验结果） |
| ProjectTemplate | 项目模板（骨架 + system prompt） |
| AssetLibrary | 全局素材库（跨项目复用） |
| ActivityLog | 操作日志（7 种操作类型） |
| ProjectStats | 项目统计（通过率、迭代轮数） |

---

## 五、目录结构

```
src/
├── app/api/           # 40 个 API 端点
├── app/               # 5 个页面（login/dashboard/workbench/variants/settings）
├── components/
│   ├── ui/            # 基础 UI（button/card/input/badge/toast/tabs/dialog/dropdown/label/device-frame）
│   ├── workbench/     # 工作台组件（asset-panel/chat-panel/preview-panel/debug-panel/generate-panel/message-list/chat-input/version-list/activity-list/compare-preview-modal/template-select-modal）
│   ├── variants/      # 变体页组件
│   └── library/       # 素材库组件
├── hooks/             # useSSE, useAssets
├── lib/
│   ├── ai/            # orchestrator, classify, provider, prompts, response-validator
│   ├── assets/        # processor, base64, classifier
│   ├── auth/          # jwt, password, middleware(withAuth)
│   ├── generation/    # pipeline(barrel), generate, iterate, validate-and-fix, types
│   ├── html/          # synthesizer, slot-matcher
│   ├── sse/           # stream helper
│   ├── validation/    # engine (10 rules)
│   ├── variants/      # generator (cartesian product)
│   ├── api-client.ts  # 前端 HTTP 客户端
│   ├── swr-fetcher.ts # SWR fetcher
│   ├── constants.ts   # DATA_DIR + PATHS
│   ├── activity-log.ts
│   ├── webhook.ts
│   ├── settings.ts    # AppSettings + AIOverrides + getAIConfig
│   ├── db.ts          # Prisma 单例
│   └── utils.ts       # cn 工具函数
├── types/             # 统一类型定义
└── __tests__/         # 8 个测试文件 (50 tests)
```

---

## 六、数据流

### 素材上传
```
文件 → Sharp 压缩 + 缩略图 → base64 预计算 → Asset(slotName=s1) → DB
```

### AI 分类（手动触发）
```
Asset 缩略图 + 元数据 → AI（多模态）→ category → 更新 Asset.category
```

### AI 生成骨架
```
Asset 元数据(slot="s1" | category | 尺寸) + ReferenceImage base64 + 用户描述
  → AI(MRAID 模板 + 规范)
  → HTML 骨架(data-variant-slot="s1" + PLACEHOLDER)
  → validateAIResponse → extractHtml → validateAndAutoFix
  → HtmlVersion
```

### 预览/下载
```
HtmlVersion.skeletonHtml + Asset[slotName 精确匹配] → synthesize(替换 PLACEHOLDER) → 完整 HTML
```

### 对话迭代
```
当前骨架 + 用户消息 + 对话历史 → AI → 新骨架 → 校验 → 新 HtmlVersion
```

---

## 七、已完成功能

**核心功能（PRD F1-F10）：**
- 素材上传（拖拽+粘贴+AI视觉分类+压缩对比）
- AI 生成（MRAID 模板+自修复+进度阶段可视化）
- 实时预览（设备模拟+横竖屏+重播+下载）
- 对话迭代（自动校验+追加素材+版本回退+版本对比）
- 批量变体（独立素材池+维度配置+矩阵预览+单个重试+变体对比）
- 质量校验（10 规则+评级+报告 UI）
- 产出管理（列表+单个下载+批量 ZIP）
- 项目管理（CRUD+重命名+状态+模板化）
- 仪表盘（5 指标+最近活动）
- 设置（AI 主配置+分类独立配置+校验+压缩+System Prompt 编辑+Webhook）

**新增功能（2026-04-08 后）：**
- 项目模板化（存为模板+从模板新建）
- 体积预估前置（MB 格式+三色进度条+警告图标）
- 流式进度（阶段清单 DOCTYPE→CSS→HTML→Script+字符计数+完成淡入）
- 版本并排对比（2-4 个版本 iframe 对比+采用版本）
- 素材资产库（收藏+搜索+导入到项目）
- 批量变体对比（复用对比组件）
- 操作日志（7 种操作类型+活动 tab）
- Webhook 通知（生成完成+批量完成+测试按钮）
- 效果参考图独立上传区
- AI 视觉分类（多模态+手动触发+独立 API 配置）
- 调试面板显示 API URL 和模型名

---

## 八、技术陷阱

1. **DATABASE_URL** 必须 `file:./prisma/dev.db`（不能用绝对路径）
2. **Prisma 5**，不能升到 7（和 Next.js 14 不兼容）
3. **@ai-sdk/openai 新版**默认走 /responses 端点，必须用 `provider.chat()` 强制走 /v1/chat/completions
4. **FFmpeg** 未装会 fallback 到复制
5. **SWR 调用**必须用 `token ? url : null`，否则未认证请求被缓存导致数据不加载
6. **prisma db push** 是 schema 变更后的必需步骤
7. **mraid.open URL** 用 example.com 占位（AppLovin 运行时注入真实 URL），不要用 play.google.com
8. **设置优先级**：settings.json > .env > 默认值，保存即生效无需重启

---

## 九、用户信息

- GitHub: CalWade
- Git: calwade <CalvinvWei@gmail.com>
- 开发环境: Mac
- 偏好: 不用子代理，全部主 session 执行
- 沟通风格: 直接，会指出问题，期望快速迭代
- 代码标准: 低耦合高内聚，没有死代码，类型统一，利于 AI 迭代

---

## 十、工作风格备忘

- 每次改动必须 git commit + push
- 不要声称完成而没有贴验证输出（tsc + vitest）
- 大改动前先问澄清问题
- UI 改动要全面一致
- 架构审查要彻底（检查死代码、类型一致性、职责边界）
- 用户很重视第一性原理——不要为了兼容旧代码而加 hack，宁可重构

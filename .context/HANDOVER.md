# PlayableForge — 完整项目交接文档

> 最后更新：2026-04-08
> 作者：AI Agent (Claude Opus)
> GitHub: https://github.com/CalWade/playable-forge (private)

---

## 一、项目概述

PlayableForge 是一个内部 Web 平台，用于批量生成 AppLovin Playable Ads（试玩广告）。

**核心流程：** 上传素材 → AI 生成 HTML 骨架 → 对话迭代修改 → 批量变体产出 → 下载 ZIP

**产出物：** 单文件 HTML（<5MB，base64 内嵌所有资源，MRAID 2.0 合规）

---

## 二、技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 14 (App Router) + React 18 |
| 样式 | Tailwind CSS + Claymorphism 蓝色主题 |
| 组件 | shadcn/ui 基础 + 自定义 clay 化 |
| 数据库 | SQLite + Prisma 5（**不是 7**，7 和 Next.js 14 不兼容） |
| AI | Vercel AI SDK (`ai` + `@ai-sdk/openai`)，单端点 OpenAI 兼容 |
| 图片 | Sharp（压缩+缩略图） |
| 音频 | FFmpeg（MP3 128kbps mono，可选） |
| 认证 | JWT + bcrypt |
| 测试 | Vitest（24 tests） |
| 部署 | 本地开发，未部署到生产 |

---

## 三、关键架构决策

### 3.1 Asset vs VariantAsset 分离
- `Asset` 表 = 初始素材，参与 AI 骨架生成 + 预览合成
- `VariantAsset` 表 = 变体素材，只参与批量替换，不进 AI 流程
- 体积预估只算 Asset，不算 VariantAsset

### 3.2 骨架 + 合成架构
- AI 生成 HTML 骨架（带 `data-variant-slot` 占位符）
- 系统层注入 base64 素材合成完整 HTML
- 批量变体 = 纯素材替换，不调 AI

### 3.3 Slot 匹配策略（lib/html/slot-matcher.ts）
4 级 fallback：精确 slotName → category 匹配 → 文件名模糊匹配（中英文）→ MIME 类型

### 3.4 AI 响应验证（lib/ai/response-validator.ts）
在 extractHtml **之前**检查原始 AI 输出：
- empty → 报错
- refused → 提示安全声明（先于 HTML 结构检查）
- question → 转对话
- truncated → 警告继续
- valid → 正常流程

### 3.5 校验 + 自修复（lib/generation/pipeline.ts）
- `validateAndAutoFix()` 是 generate 和 iterate 共用的函数
- 10 项规则校验 → 失败项发给 AI 修复 → 重新校验 → 最多 3 轮
- 自修复结果也过 response-validator

### 3.6 withAuth 高阶函数
所有 API route（除 auth/login、auth/register、auth/me）用 `withAuth` 包裹，消除 try/catch + getAuth 样板。支持 Authorization header 和 `?token=` query param。

---

## 四、数据库表

| 表 | 用途 |
|---|------|
| User | 用户名密码登录 |
| Project | 项目（含状态：draft/in_progress/completed） |
| Asset | 初始素材（AI 流程用） |
| VariantAsset | 变体素材（批量替换用） |
| HtmlVersion | 骨架版本（含 parentId 用于回退追踪） |
| ConversationMessage | 对话历史（持久化） |
| Variant | 变体产出（含校验结果） |
| ProjectStats | 项目统计（通过率、迭代轮数） |

---

## 五、目录结构

```
src/
├── app/api/           # 27 个 API 端点
├── app/               # 5 个页面（login/dashboard/workbench/variants/settings）
├── components/
│   ├── ui/            # 基础 UI（button/card/input/badge/toast/tabs/dialog/dropdown/label）
│   ├── workbench/     # 工作台组件（asset-panel/chat-panel/preview-panel/debug-panel 等）
│   └── variants/      # 变体页组件（skeleton-preview/dimension-config/variant-matrix 等）
├── hooks/             # useSSE, useAssets
├── lib/
│   ├── ai/            # orchestrator, classify, provider, prompts, response-validator
│   ├── assets/        # processor, base64, classifier
│   ├── auth/          # jwt, password, middleware(withAuth)
│   ├── generation/    # pipeline (validateAndAutoFix)
│   ├── html/          # synthesizer, slot-matcher
│   ├── sse/           # stream helper
│   ├── validation/    # engine (10 rules)
│   └── variants/      # generator (cartesian product)
├── types/             # 统一类型定义
└── __tests__/         # 3 个测试文件 (24 tests)
```

---

## 六、PRD 完成度：100%

全部 F1-F10 功能完成，包括：
- 素材上传（拖拽+点击+粘贴+AI分类+压缩对比）
- AI 生成（多模态效果图+自修复+进度透明化）
- 实时预览（设备模拟+横竖屏+重播+下载）
- 对话迭代（自动校验+追加素材+版本回退）
- 批量变体（独立素材池+维度配置+矩阵预览+单个重试）
- 质量校验（10 规则+评级+报告 UI）
- 产出管理（列表+单个下载+批量 ZIP）
- 项目管理（CRUD+重命名+状态）
- 仪表盘（5 指标+最近活动）
- 设置（AI/校验/压缩/System Prompt 编辑）
- AI 响应验证 + 安全声明
- 调试面板（完整 AI 交互日志）

---

## 七、已知问题 & 注意事项

1. **DATABASE_URL** 必须设为 `file:./prisma/dev.db`（不能用绝对路径）
2. **Prisma 5**，不能升到 7（和 Next.js 14 不兼容）
3. **效果图多模态**需要模型支持 vision（GPT-4o/Claude 3.5+ 可以，其他模型可能不行）
4. **FFmpeg** 音频压缩需要系统安装 ffmpeg，没装会 fallback 到复制
5. **claymorphism-backup** 分支保留了另一个 AI 写的粉色 UI 版本

---

## 八、用户信息

- GitHub: CalWade
- Git: calwade <CalvinvWei@gmail.com>
- 开发环境: Mac
- 偏好: 不用子代理，全部主 session 执行
- 沟通风格: 直接，会指出问题，期望快速迭代

---

## 九、工作风格备忘

- 用户要求严格遵守 superpowers 工作流
- 每次改动必须 git commit + push
- 不要声称完成而没有贴验证输出
- 大改动前先问澄清问题
- 代码质量要求：低耦合高内聚，没有死代码，类型统一
- UI 改动要全面一致，不能只改一半

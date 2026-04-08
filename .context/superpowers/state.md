# PlayableForge Workflow State

## Current Workflow
Phase: paused (user requested pause)
Previous: executing (PRD gap fixes + UI improvements)
Design: docs/superpowers/specs/2026-03-30-playableforge-design.md
Plan: docs/superpowers/plans/2026-03-30-playableforge.md
GitHub: https://github.com/CalWade/playable-forge (private)
Latest commit: 36dee25 (fix: variants page layout)

## Completed
- 19 original tasks ✅
- 11 PRD gap fixes ✅
- shadcn/ui migration ✅
- Blank preview fix (slot naming + synthesizer) ✅
- Persistent chat history ✅
- UI layout fixes (preview, header, bottom bar) ✅
- Variant page: per-dimension upload, thumbnails, batch download fix ✅
- Skeleton lock enforcement + readonly preview ✅
- Variant page left-right layout ✅
- Git author rewrite to calwade ✅

## Remaining (low priority)
- 边界：AI 安全过滤降级重试
- 边界：变体失败分组 + 单独重试
- F3.2 设备模拟在横屏模式下按设备尺寸

## Known Issues Being Tracked
- AI classification depends on API availability (fallback to filename works)
- System Prompt override in settings not yet wired to actual AI calls

## User Info
- GitHub: CalWade
- Git: calwade <CalvinvWei@gmail.com>
- Runs on Mac locally
- .env needs DATABASE_URL="file:./prisma/dev.db"

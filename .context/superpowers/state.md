# PlayableForge Workflow State

## Current Workflow
Phase: paused (user-driven, ready for next task)
Latest commit: db1f34e (refactor: slotName is a stable upload-time ID)
GitHub: https://github.com/CalWade/playable-forge (private)

## Completed (2026-04-08 ~ 2026-04-13)

### New Features
- Project template system (save + create from template)
- Size estimation with color-coded warnings
- Streaming progress stages (replaces broken iframe preview)
- Version side-by-side comparison (2-4 versions)
- Asset library (cross-project reuse)
- Variant comparison (reuses version compare component)
- Activity logging system (7 operation types)
- Webhook notifications (generate + batch complete)
- Visual AI classification (multimodal, manual trigger)
- Independent classification AI config
- Reference image separation (dedicated table + upload area)
- Debug panel shows API config
- Settings page: API Key, default system prompt, webhook config

### Architecture Refactors
- DATA_DIR extracted to constants.ts (was duplicated 10x)
- pipeline.ts split into generate/iterate/validate-and-fix/types
- Frontend: centralized api-client.ts + swr-fetcher.ts
- Library thumbnail: proper route (was pathname hack)
- AppSettings: added webhook + aiOverrides types
- Activity log injected into all 7 key operations
- Classification separated from variant logic
- slotName: stable upload-time ID (s1, s2, s3), no derivation
- Slot matching: exact-only (removed 4-level fuzzy fallback)
- MRAID template in prompt (AI fills in content, not writes from scratch)
- Validation: mraid-open is error, orientation/asset-integrity are warning
- External refs: strict check, no store URL whitelist
- Removed dead code: variantRole from Asset flow, streamPreview flag, reference category

### Bug Fixes
- provider.chat() to force /v1/chat/completions (third-party API compat)
- Settings page changes take effect without restart
- SWR token guards restored (prevent 401 caching)
- SimpleTabs height chain fixed
- Chat UI overhaul (layout, textarea, message bubbles)
- Error diagnostics: show actual AI response content on failure

## Remaining (none tracked)

## Known Technical Debt
- 50 tests cover core modules but not API routes
- Some SWR calls use `any` type (marked with eslint-disable)
- classifier.ts still exports inferFromFile (used by variant-assets route only)

# AI Response Validation + Safety Declaration

**Date:** 2026-04-01
**Goal:** Validate AI responses before storing, handle refusals gracefully, allow safety declaration for ad testing.

## Response Validator
New `lib/ai/response-validator.ts`:
- `validateAIResponse(text)` → `valid | empty | truncated | refused | question`
- Injected into pipeline between extractHtml and validate

## Safety Declaration
- Checkbox in generate-panel
- Injects disclaimer into AI prompt
- Passed through: generate-panel → chat-panel → generate API → orchestrator

## Files Changed
1. NEW `lib/ai/response-validator.ts`
2. MOD `lib/generation/pipeline.ts` — add validation after extractHtml
3. MOD `lib/ai/orchestrator.ts` — accept safetyClarification param
4. MOD `components/workbench/generate-panel.tsx` — checkbox
5. MOD `components/workbench/chat-panel.tsx` — pass safety flag

## Status: EXECUTING

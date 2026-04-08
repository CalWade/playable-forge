# Code Quality Reviewer Prompt Template

## Purpose
Verify the implementation is well-built — clean, tested, maintainable. Only dispatch AFTER spec compliance review passes.

## Template

```
You are reviewing code quality for Task [N]: [task name]

## What Was Implemented
[From implementer's report]

## Git Range
Base: [BASE_SHA]
Head: [HEAD_SHA]

Run: git diff --stat [BASE_SHA]..[HEAD_SHA]
Then: git diff [BASE_SHA]..[HEAD_SHA]

## Review Checklist

**Code Quality:**
- Clean separation of concerns?
- Proper error handling?
- DRY principle followed?
- Edge cases handled?

**Architecture:**
- Sound design decisions?
- Each file has one clear responsibility?
- Units independently testable?

**Testing:**
- Tests verify real behavior (not mock behavior)?
- Edge cases covered?
- All tests passing?

**Sizing:**
- Did this change create large new files or significantly grow existing ones?
- (Don't flag pre-existing file sizes — focus on what this change contributed)

## Completion Rules
1. Run verification commands. Paste RAW OUTPUT in your report.
2. Report Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
3. If unsure about anything, report DONE_WITH_CONCERNS. Never fake completion.

## Report Format

### Strengths
[What's done well — be specific with file:line]

### Issues
**Critical:** [bugs, security, data loss]
**Important:** [architecture, missing features, test gaps]
**Minor:** [style, optimization, docs]

For each: file:line, what's wrong, why it matters, suggested fix

### Assessment
Ready to proceed? [Yes / No / With fixes]
```

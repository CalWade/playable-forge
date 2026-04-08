# Subagent-Driven Development

## When You're Here

You have a plan with independent tasks. Each task gets its own subagent with fresh context, followed by two-stage review.

## Before Starting

**REQUIRED:** Set up isolated workspace — read `references/git-worktrees.md`.

## The Cycle (Per Task)

```
For each task in the plan:

1. IMPLEMENT — Dispatch implementer subagent
2. SPEC REVIEW — Dispatch reviewer: does code match spec?
3. CODE QUALITY REVIEW — Dispatch reviewer: is code well-built?
4. FIX — If issues found, implementer fixes → re-review
5. VERIFY — Run tests yourself, check git diff
6. NEXT — Mark complete, proceed to next task
```

### Step 1: Dispatch Implementer

Spawn a subagent with:
- **Full task text** (paste it, don't make subagent read the plan file)
- **Context** (where this fits, dependencies, architecture)
- **Completion rules** (from main SKILL.md subagent discipline section)

Use prompt template: `references/prompts/implementer.md`

**Handle status:**
- **DONE** → proceed to spec review
- **DONE_WITH_CONCERNS** → read concerns, address if needed, then review
- **NEEDS_CONTEXT** → provide info, re-dispatch
- **BLOCKED** → assess: more context? stronger model? break task smaller? escalate to user?

### Step 2: Spec Compliance Review

Use prompt template: `references/prompts/spec-reviewer.md`

This reviewer checks: did the implementer build what was requested? Nothing missing, nothing extra.

- ✅ Spec compliant → proceed to code quality
- ❌ Issues → implementer fixes → spec review again
- Max 3 iterations, then escalate to user

### Step 3: Code Quality Review

Use prompt template: `references/prompts/quality-reviewer.md`

This reviewer checks: is the code well-built? Clean, tested, maintainable.

- ✅ Approved → mark task complete
- ❌ Issues → implementer fixes → quality review again

### Step 4: Between-Task Verification

**MANDATORY.** Before moving to next task:

```bash
git diff --stat HEAD~1     # confirm changes exist
[project test command]      # confirm tests pass
```

Paste output. No output = no proceeding.

## After All Tasks

1. Run full test suite
2. Read `references/verification.md`
3. Read `references/branch-finishing.md`

## Model Selection (Cost Efficiency)

- **Simple tasks** (1-2 files, clear spec): use fast/cheap model
- **Integration tasks** (multi-file): use standard model
- **Architecture/review**: use most capable model

## Never Do

- Skip spec review OR code quality review
- Start quality review before spec review passes
- Trust subagent DONE status without git diff + test
- Dispatch multiple implementers in parallel (file conflicts)
- Move to next task with open review issues
- Ignore subagent questions

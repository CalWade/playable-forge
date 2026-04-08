# Planning — Break Work Into Tasks

## When You're Here

You have an approved design/spec. You need to turn it into executable tasks before writing any code.

## Plan Structure

Save to `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`:

```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence]
**Architecture:** [2-3 sentences about approach]
**Tech Stack:** [Key technologies]

---

### Task 1: [Clear name]
**Files:** Create/modify/test paths
**Steps:**
- [ ] Step 1: Write failing test
- [ ] Step 2: Run test — verify FAIL
- [ ] Step 3: Write minimal implementation
- [ ] Step 4: Run test — verify PASS
- [ ] Step 5: Commit

### Task 2: ...
```

## Task Decomposition Rules

**Each task MUST be:**
- **Self-contained** — completable with only the task description + codebase access
- **Small** — 2-5 minutes of focused work
- **Testable** — has clear acceptance criteria
- **Independent** — minimal dependencies (state them explicitly if any)

**Each task MUST include:**
- Clear goal (what, not how)
- Exact file paths
- Concrete steps with commands
- Acceptance criteria

**Red flags in tasks:**
- "Update various files" → too vague
- "Refactor the system" → too large
- No acceptance criteria → untestable
- Depends on 3+ other tasks → too coupled

## File Structure Planning

Before defining tasks, map out which files will be created/modified:
- Each file = one clear responsibility
- Prefer smaller, focused files over large ones
- Files that change together should live together
- In existing codebases, follow established patterns

## After the Plan

Offer two execution options:
1. **Subagent-Driven** (recommended if subagents available) → read `references/subagent-dev.md`
2. **Sequential Execution** → read `references/executing.md`

Get user's choice before proceeding.

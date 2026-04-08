# Code Review — Requesting

## When You're Here

You've completed work and want a quality check before proceeding or merging.

## When to Request

**Mandatory:** After each task in subagent-driven development. Before merge to main.
**Valuable:** When stuck. Before refactoring. After complex bug fix.

## How to Request

### 1. Get Git Range

```bash
BASE_SHA=$(git merge-base HEAD main)  # or HEAD~N
HEAD_SHA=$(git rev-parse HEAD)
```

### 2. Dispatch Reviewer

Spawn a subagent with:
- What was implemented (brief description)
- Requirements/plan reference
- Git range (BASE_SHA..HEAD_SHA)
- Instruction to run `git diff` and review

Use prompt template: `references/prompts/quality-reviewer.md`

### 3. Act on Feedback

| Severity | Action |
|----------|--------|
| Critical | Fix immediately |
| Important | Fix before proceeding |
| Minor | Note for later |
| Wrong | Push back with technical reasoning |

## Review Checklist (What Reviewers Check)

- **Code quality** — separation of concerns, error handling, DRY
- **Architecture** — sound design, scalability, security
- **Testing** — tests verify real behavior, edge cases covered
- **Requirements** — all met, no scope creep
- **File quality** — each file has one responsibility, manageable size

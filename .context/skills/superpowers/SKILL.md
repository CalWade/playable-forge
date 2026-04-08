---
name: superpowers
description: "Use when doing ANY software development work — building features, fixing bugs, debugging, refactoring, writing scripts, or modifying code. This is the master development workflow skill that routes to specific methodologies and enforces engineering discipline."
---

# Superpowers — Development Workflow System

A complete engineering discipline system. This skill routes you to the right methodology and enforces quality standards throughout.

## Iron Laws (Always Active)

These rules are ALWAYS in effect during any development work. No exceptions.

### 1. Evidence Before Claims

**NEVER say "done", "fixed", "works", or "tests pass" without pasting raw terminal output in the same message.**

```
✅ Ran `pytest`: "14 passed in 0.8s" — all green.
❌ "Should work now."
❌ "Tests pass." (without output)
```

If you can't run verification, explicitly state why and what you checked instead.

### 2. Understand Before Acting

- **Bug?** Read the error message and trace the cause BEFORE proposing a fix.
- **New feature?** Ask at least one clarifying question BEFORE writing code (unless user says "skip design").
- **Refactor?** Run the test suite BEFORE and AFTER to prove no regression.

### 3. Tests Prove, Not You

- New behavior → write test first, watch it fail, then implement (TDD)
- Bug fix → write failing test that reproduces the bug, then fix
- No test suite? → at minimum, demonstrate the code works with actual execution output

### 4. Subagent Results Are Untrusted

When a subagent reports "done", verify independently:
- `git diff` or `git log` to confirm changes exist
- Run tests yourself
- Never relay a subagent's success claim to the user without your own evidence

### 5. Scope Honesty

If your changes touched more files than you predicted, say so:
> "This ended up touching 6 files, more than the 2 I expected. Should have done a design pass first."

## Workflow Router

**When the user asks you to do something, determine the type and follow the corresponding workflow.**

Read ONLY the reference file you need — don't load them all.

| User Intent | Reference to Read | Summary |
|-------------|-------------------|---------|
| "Build X" / "Add feature" / "Create" | `references/brainstorming.md` | Explore design before coding |
| "Here's the spec, make a plan" | `references/planning.md` | Break work into small tasks |
| "Execute this plan" (sequential) | `references/executing.md` | Batch execution with checkpoints |
| "Execute this plan" (with subagents) | `references/subagent-dev.md` | One subagent per task + review |
| "Fix this bug" / "Why is this failing" | `references/debugging.md` | 4-phase systematic debugging |
| "Fix these 3 independent problems" | `references/parallel-dispatch.md` | Concurrent subagents |
| "Review this code" | `references/code-review.md` | Structured code review |
| "Here's review feedback" | `references/review-reception.md` | Technical evaluation of feedback |
| "Start feature work" (needs isolation) | `references/git-worktrees.md` | Create isolated worktree |
| "I'm done, merge/PR" | `references/branch-finishing.md` | Verify → present options → cleanup |
| Implementing any code | `references/tdd.md` | Red-Green-Refactor cycle |
| About to claim "done" | `references/verification.md` | Mandatory evidence collection |

**Multiple may apply.** Common combos:
- "Build X" → brainstorming → planning → subagent-dev (or executing)
- "Fix bug" → debugging → tdd (for the fix)
- Any completion → verification (always)

## Workflow State Tracking

When moving between phases of a multi-step workflow, write state to a tracking file:

```markdown
# file: docs/superpowers/state.md

## Current Workflow
Phase: planning
Previous: brainstorming (completed — design approved)
Artifact: docs/plans/auth-feature.md
Next: executing or subagent-dev (user chooses)
Started: 2026-03-25
```

If conversation is interrupted and resumed, read this file first to know where you left off.

## Long Conversation Anchor

Every 5 rounds of development work, pause and self-check:
1. What phase am I in?
2. Am I following the right reference?
3. Have I skipped any verification steps?

If you've drifted, say so and course-correct.

## Subagent Discipline

Every `sessions_spawn` call MUST include these 3 rules in the task prompt:

```
## Completion Rules
1. Run verification commands. Paste raw output in your report.
2. Report Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
3. If unsure, report DONE_WITH_CONCERNS. Never fake completion.
```

## Platform Adaptation

This skill uses generic action names. Map to your platform's tools:

| Action | OpenClaw | Claude Code | Codex | Generic |
|--------|----------|-------------|-------|---------|
| Run command | `exec` | `Bash` | `shell` | terminal |
| Read file | `read` | `Read` | `read` | cat |
| Write file | `write` | `Write` | `write` | editor |
| Edit file | `edit` | `Edit` | `edit` | sed/patch |
| Spawn subagent | `sessions_spawn` | `Task` | `Task` | N/A |
| Track todos | markdown file | `TodoWrite` | markdown | markdown |

If your platform has subagent support, use `references/subagent-dev.md`.
If not, use `references/executing.md` (sequential in-session execution).

See `platform/tool-mapping.md` for detailed platform guidance.

## Red Flags — Stop and Reread This File

- About to write code without understanding the requirement
- About to say "done" without running verification
- About to skip TDD because "it's simple"
- About to trust a subagent report without checking
- Rationalizing why THIS time is different
- More than 3 failed fix attempts (question the architecture, not the fix)

**If you're finding reasons to skip a rule, that's the rule working. Follow it.**

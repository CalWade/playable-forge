# Sequential Execution — Plans With Checkpoints

## When You're Here

You have a written plan and will execute it in the current session (no subagents).

## Before Starting

**REQUIRED:** Set up isolated workspace — read `references/git-worktrees.md`.

## The Process

### 1. Load and Review Plan
- Read the plan file
- Identify any concerns or questions
- If concerns: raise with user before starting

### 2. Execute in Batches of 3

For each task:
1. Follow each step exactly as written
2. Follow TDD (read `references/tdd.md`) for implementation steps
3. Run verifications as specified
4. Update progress tracker

### 3. Checkpoint After Each Batch

Report to user:
```
Batch [N] complete:
- ✅ Task 1: [summary]
- ✅ Task 2: [summary]
- ⚠️ Task 3: [issue found]

Tests: [actual output]
Next batch: Tasks 4-6

Continue?
```

**Wait for user approval before proceeding.**

### 4. After All Tasks

1. Run full test suite — paste output
2. Read `references/verification.md` before claiming done
3. Read `references/branch-finishing.md` to complete the branch

## When to Stop

**STOP immediately when:**
- Hit a blocker (missing dependency, unclear instruction)
- Test fails unexpectedly
- Verification fails repeatedly
- You don't understand what to do next

Ask for clarification. Don't guess.

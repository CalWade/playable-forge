# Finishing a Development Branch

## When You're Here

Implementation is complete, tests pass. Time to decide how to integrate.

## Step 1: Verify Tests

```bash
[project test command]
```

**Tests fail?** Stop. Fix first. Do not present options.

## Step 2: Present Exactly 4 Options

```
Implementation complete. What would you like to do?

1. Merge back to [base-branch] locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

## Step 3: Execute

**Option 1 — Merge:**
```bash
git checkout <base>
git pull
git merge <feature>
[run tests on merged result]
git branch -d <feature>
```

**Option 2 — PR:**
```bash
git push -u origin <feature>
gh pr create --title "<title>" --body "## Summary\n..."
```

**Option 3 — Keep:** Report location. Don't clean up.

**Option 4 — Discard:** Show what will be deleted. Require explicit confirmation.
```bash
git checkout <base>
git branch -D <feature>
```

## Step 4: Cleanup Worktree

Options 1, 2, 4: `git worktree remove <path>`
Option 3: keep worktree.

## Never

- Present options with failing tests
- Merge without testing the merged result
- Delete work without typed confirmation
- Force-push without explicit request

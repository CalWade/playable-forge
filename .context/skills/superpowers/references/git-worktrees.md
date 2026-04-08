# Git Worktrees — Isolated Workspaces

## When You're Here

Starting feature work or plan execution that needs isolation from the main branch.

## Directory Selection (Priority Order)

1. Check existing: `ls -d .worktrees worktrees 2>/dev/null` → use if found (`.worktrees` wins)
2. Check project config (AGENTS.md, CLAUDE.md) for preference
3. Ask user: `.worktrees/` (local, hidden) or `~/.config/superpowers/worktrees/<project>/` (global)

## Safety Check

For project-local directories:
```bash
git check-ignore -q .worktrees 2>/dev/null
```
If NOT ignored → add to `.gitignore`, commit, then proceed.

## Creation

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
git worktree add "$DIR/$BRANCH" -b "$BRANCH"
cd "$DIR/$BRANCH"

# Auto-detect and run setup
[ -f package.json ] && npm install
[ -f Cargo.toml ] && cargo build
[ -f requirements.txt ] && pip install -r requirements.txt
[ -f go.mod ] && go mod download

# Verify clean baseline
[run project test suite]
```

**Tests fail?** Report failures, ask whether to proceed.
**Tests pass?** Report ready: location + test count.

## Red Flags

- Creating worktree without checking gitignore (project-local)
- Skipping baseline test verification
- Proceeding with failures without asking

# Parallel Agent Dispatch

## When You're Here

You have 2+ independent problems that don't share state. Solving them sequentially wastes time.

## The Pattern

### 1. Identify Independent Domains

Group by what's broken. Each domain must be independently fixable with no shared files.

### 2. Craft Focused Prompts

Each agent gets:
- **Specific scope** — one file or subsystem
- **Clear goal** — "make these tests pass" or "fix this bug"
- **Constraints** — "don't change code outside [path]"
- **Error context** — paste actual error messages and test names
- **Expected output** — "summary of root cause + changes made"
- **Completion rules** — from main SKILL.md subagent discipline section

### 3. Dispatch Concurrently

Spawn all agents at once — they run in parallel.

### 4. Review and Integrate

When agents return:
1. Read each summary
2. Check for conflicts (did agents touch same files?)
3. Run full test suite
4. Spot check — agents can make systematic errors

## When NOT to Use

- **Related failures** — fix one might fix others; investigate together
- **Need full context** — understanding requires seeing entire system
- **Shared state** — agents would interfere (editing same files)
- **Exploratory** — you don't know what's broken yet

## Prompt Quality Checklist

```
✅ Focused — one clear problem domain
✅ Self-contained — all context to understand the problem
✅ Constrained — clear scope boundaries
✅ Specific output — what should the agent return?
✅ Error context — actual messages, not vague descriptions

❌ "Fix all the tests" — too broad
❌ "Fix the race condition" — no context
❌ "Fix it" — no output spec
```

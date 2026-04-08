# Systematic Debugging

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

If you haven't completed Phase 1, you cannot propose fixes.

## The Four Phases

### Phase 1: Root Cause Investigation

**BEFORE attempting ANY fix:**

1. **Read error messages carefully** — full stack trace, line numbers, error codes. Don't skip.
2. **Reproduce consistently** — exact steps, every time? If not reproducible, gather more data.
3. **Check recent changes** — `git diff`, recent commits, new dependencies, config changes.
4. **Multi-component systems** — add diagnostic logging at each boundary. Run once. See WHERE it breaks.
5. **Trace data flow** — where does the bad value originate? Trace backward through calls until you find the source.

### Phase 2: Pattern Analysis

1. Find similar **working** code in the codebase
2. Compare working vs broken — list every difference
3. Read reference implementations **completely** (don't skim)
4. Understand all dependencies and assumptions

### Phase 3: Hypothesis Testing

1. **Form one hypothesis:** "I think X because Y"
2. **Test minimally:** smallest possible change, one variable at a time
3. **Evaluate:** Worked → Phase 4. Didn't → new hypothesis (don't stack fixes)

### Phase 4: Implementation

1. **Write failing test** that reproduces the bug (read `references/tdd.md`)
2. **Fix root cause** — ONE change, not symptoms
3. **Verify** — test passes, no regressions
4. **If 3+ fixes failed:** STOP. Question the architecture. Discuss with user.

## Debugging Log

Your messages must show your phase:

```
📍 Phase 1: Root Cause Investigation
Error: [actual error text from terminal]
Reproduction: [command that triggers it]
Recent changes: git log shows [X]
Trace: bad value comes from [Y] → called by [Z]

📍 Phase 3: Hypothesis
"I think [X] because [Y]"
Change: [what I'm changing]
Result: [actual output after change]
→ Confirmed / Rejected
```

Jumping to "I fixed it" without Phase 1 evidence = violation.

## Red Flags — Return to Phase 1

- "Quick fix for now"
- "Just try changing X"
- Proposing solutions before reading the error
- "One more fix attempt" (after 2+ failures)
- Each fix reveals a new problem elsewhere

## Defense in Depth

After fixing root cause, add validation at multiple layers:
1. **Entry point** — reject invalid input at API boundary
2. **Business logic** — ensure data makes sense for this operation
3. **Environment guards** — prevent dangerous ops in wrong context
4. **Debug instrumentation** — log context for future forensics

## Condition-Based Waiting (for timing bugs)

Replace arbitrary delays with condition polling:

```
❌ await sleep(500)
✅ await waitFor(() => condition === true, "description", timeoutMs)
```

Wait for the condition you care about, not a guess about timing.

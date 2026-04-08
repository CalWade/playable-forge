# Verification Before Completion

## The Iron Law

```
NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE
```

## The Gate

```
BEFORE claiming any success:
1. IDENTIFY — What command proves this claim?
2. RUN — Execute it (fresh, complete, not cached)
3. READ — Full output, check exit code
4. PASTE — Raw terminal output in your message
5. CLAIM — Only now state the result
```

## Mandatory Output Format

Every completion message MUST include:

```
## Verification
Command: [exact command]
Output:
> [raw terminal output — copied from terminal, NOT your summary]
Result: [PASS/FAIL]
```

**Anti-gaming:**
- Output MUST be raw terminal text, not your paraphrase
- "All tests pass" in your words is NOT valid evidence
- If output is long, quote the summary line verbatim (e.g., `> 47 passing, 0 failing`)
- If you can't run automated verification, state what you checked and why

## What Requires Verification

| Claim | Evidence Required | NOT Sufficient |
|-------|-------------------|----------------|
| Tests pass | Test output: 0 failures | "Should pass" |
| Build works | Build output: exit 0 | "Linter passed" |
| Bug fixed | Test reproducer now passes | "Code changed" |
| Requirements met | Line-by-line checklist | "Tests pass" |
| Subagent done | Your own git diff + test run | Subagent's report |

## Red Flags — STOP

- Words: "should", "probably", "seems to", "looks correct"
- Emotions: "Great!", "Perfect!", "Done!" (before evidence)
- Trust: believing subagent reports without checking
- Shortcuts: "just this once", "I'm confident", "partial check is enough"

**All mean: you haven't verified. Go verify.**

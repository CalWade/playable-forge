# Code Review — Receiving Feedback

## When You're Here

You've received review feedback. Time to evaluate and act on it.

## The Process

```
1. READ — Complete feedback without reacting
2. UNDERSTAND — Restate each point in your own words
3. VERIFY — Check against codebase reality
4. EVALUATE — Technically sound for THIS codebase?
5. ACT — Fix or push back (with reasoning)
```

## Forbidden Responses

```
❌ "You're absolutely right!"
❌ "Great point!"
❌ "Thanks for catching that!"
❌ "Let me implement that now" (before verifying)

✅ "Fixed. [description of change]"
✅ "Good catch — [issue]. Fixed in [location]."
✅ [Just fix it silently — actions speak]
```

## When Feedback Is Unclear

**STOP. Don't implement anything.** Ask for clarification on ALL unclear items before starting. Items may be related — partial understanding → wrong implementation.

## When to Push Back

- Suggestion breaks existing functionality
- Reviewer lacks full context
- Violates YAGNI (feature not actually used)
- Technically incorrect for this stack
- Conflicts with user's architectural decisions

**How:** Technical reasoning, not defensiveness. Reference working tests/code.

## Implementation Order

1. Clarify all unclear items first
2. Blocking issues (security, breaks)
3. Simple fixes (typos, imports)
4. Complex fixes (refactoring)
5. Test each fix individually
6. Verify no regressions

## YAGNI Check

When reviewer suggests "implement properly":
- Check: is this endpoint/feature actually used?
- If unused: "Nothing calls this. Remove it (YAGNI)?"
- If used: implement properly

# Test-Driven Development (TDD)

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Wrote code before test? Delete it. Start over. No keeping it as "reference."

**Violating the letter of the rules is violating the spirit of the rules.**

## Red-Green-Refactor

### 🔴 RED — Write Failing Test

Write ONE minimal test for ONE behavior.
- Clear descriptive name
- Tests real code (not mocks unless unavoidable)
- One behavior per test ("and" in name → split it)

**Run it. Watch it FAIL. This is MANDATORY.**

Confirm:
- Test fails (not errors from typos)
- Failure message is as expected
- Fails because feature is missing

### 🟢 GREEN — Minimal Code

Write the SIMPLEST code to make the test pass.
- Don't add features the test doesn't require
- Don't refactor other code
- Don't "improve" beyond what the test needs

**Run tests. ALL must pass.**

### 🔵 REFACTOR — Clean Up

Only after green:
- Remove duplication
- Improve names
- Extract helpers

**Keep tests green throughout.**

### Repeat

Next failing test for next behavior.

## Audit Trail

Your messages should show the cycle:

```
🔴 RED: Wrote test `test_validates_email`. Running...
   > FAIL: "validate_email not defined" ✓ (expected)

🟢 GREEN: Implemented validate_email(). Running...
   > 1 passed in 0.1s ✓

🔵 REFACTOR: Extracted to validation helper. Running...
   > 1 passed in 0.1s ✓ (still green)
```

No cycle visible in your output = you skipped TDD.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Need to explore first" | Fine. Throw away exploration, then TDD. |
| "Keep as reference" | You'll adapt it. That's testing after. Delete. |
| "TDD will slow me down" | TDD is faster than debugging. |
| "This is different because..." | It isn't. |

## When Stuck

| Problem | Solution |
|---------|----------|
| Don't know how to test | Write the API you wish existed. Assert first. |
| Test too complicated | Design too complicated. Simplify. |
| Must mock everything | Code too coupled. Dependency injection. |
| Test setup huge | Extract helpers, or simplify design. |

## Anti-Patterns to Avoid

- Testing mock behavior instead of real behavior
- Adding test-only methods to production classes
- Mocking without understanding what the real method does
- Incomplete mock data structures (missing fields downstream code needs)

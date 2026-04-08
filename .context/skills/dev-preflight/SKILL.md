---
name: dev-preflight
description: Use automatically before starting any coding, debugging, or implementation task - quick checklist to ensure correct workflow is followed
---

# Development Preflight Checklist

## Overview

Quick self-check before starting any development work. Takes 10 seconds. Prevents hours of wasted effort.

**This is not optional. Run through this mentally before ANY code-touching task.**

## The Checklist

```
Before writing ANY code, ask yourself:

□ 1. SCOPE: How many files will this touch?
   → 3+ files = need brainstorming first (unless user says skip)
   
□ 2. WORKSPACE: Am I in the right directory/branch?
   → Feature work = should be in a worktree, not main
   
□ 3. APPROACH: Bug fix or new feature?
   → Bug fix = systematic-debugging first (read error, reproduce, trace)
   → New feature = brainstorming → writing-plans → execute
   
□ 4. TESTS: Does the project have a test suite?
   → Yes = TDD (write test first, watch it fail)
   → No = at minimum, manual verification before claiming done
   
□ 5. EVIDENCE: How will I prove this works?
   → Identify the verification command NOW, not after "finishing"
```

## When to Skip

- User explicitly says "just do it" or "skip the process"
- Trivial change (typo fix, config value, single-line edit)
- You've already been through brainstorming for this task

## Why This Exists

Without this checklist, the most common failure mode is:
1. User says "fix X" or "add Y"
2. Agent immediately starts writing code
3. Skips design, skips TDD, skips verification
4. Reports "done" without evidence
5. It's wrong, incomplete, or breaks something else

This checklist interrupts that autopilot response.

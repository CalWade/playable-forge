# Brainstorming — Design Before Code

## When You're Here

User wants to build something new. You're here to understand what, why, and how — BEFORE touching code.

## The Process

### 1. Understand Context
- Check existing project structure (files, docs, recent commits)
- If scope is huge (multiple independent subsystems), flag immediately — decompose into sub-projects first

### 2. Ask Clarifying Questions
- One question at a time (don't overwhelm)
- Prefer multiple choice when possible
- Focus on: purpose, constraints, success criteria, edge cases
- Keep going until you can articulate back what you're building

### 3. Propose 2-3 Approaches
- Present options with trade-offs
- Lead with your recommendation and explain why
- Apply YAGNI ruthlessly — remove unnecessary features from all options

### 4. Converge on Design
Present the design section by section, scaled to complexity:
- Simple aspect → 2-3 sentences
- Complex aspect → detailed with architecture, data flow, error handling
- Ask for approval after each section

**Design for isolation:** Break into units with one clear purpose, well-defined interfaces, independently testable. If you can't explain what a unit does without reading its internals, the boundaries need work.

### 5. Document the Design
Write to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and commit.

### 6. Get User Approval on Written Spec
> "Spec written and committed to `<path>`. Please review before we proceed to planning."

### 7. Transition
→ Read `references/planning.md` to create implementation plan.

## In Existing Codebases
- Explore current structure before proposing changes
- Follow existing patterns
- Where existing code has problems affecting this work, include targeted improvements — don't propose unrelated refactoring

## Hard Gate
**Do NOT write any implementation code until design is approved.** The only next step after brainstorming is planning.

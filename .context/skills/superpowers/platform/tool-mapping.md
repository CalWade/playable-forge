# Platform Tool Mapping

## How to Use This File

The Superpowers skill uses generic action names. Map them to your platform's tools.

## Tool Mapping Table

| Action | OpenClaw | Claude Code | Codex | Gemini CLI | Generic CLI |
|--------|----------|-------------|-------|------------|-------------|
| **Run command** | `exec(command=...)` | `Bash(command=...)` | `shell(command=...)` | `run_terminal_cmd` | terminal/shell |
| **Read file** | `read(path=...)` | `Read(file_path=...)` | `read(path=...)` | `read_file` | `cat` |
| **Write file** | `write(path=..., content=...)` | `Write(file_path=..., content=...)` | `write(path=..., content=...)` | `write_file` | editor |
| **Edit file** | `edit(path=..., old=..., new=...)` | `Edit(file_path=..., old=..., new=...)` | `edit(path=..., old=..., new=...)` | `edit_file` | `sed`/`patch` |
| **Spawn subagent** | `sessions_spawn(runtime="subagent", task=...)` | `Task(description=..., prompt=...)` | `Task(...)` | N/A | N/A |
| **List subagents** | `subagents(action="list")` | N/A (automatic) | N/A | N/A | N/A |
| **Track progress** | Write markdown file | `TodoWrite(todos=[...])` | Write markdown | Write markdown | Write markdown |

## Platform-Specific Notes

### OpenClaw
- Subagents are async/push-based — spawn and wait for completion event
- Use `sessions_spawn(mode="run")` for one-shot tasks
- Subagents don't inherit parent session context — provide everything in task prompt
- Use `exec(background=true)` only for fire-and-forget (no result needed)

### Claude Code
- `Task` tool is synchronous — blocks until subagent returns
- Native `TodoWrite`/`TodoRead` for progress tracking (visible in UI)
- Skills loaded via `Skill` tool (don't use `Read` on skill files)
- Session hooks available for startup checks

### Codex
- Similar to Claude Code's Task model
- Skills in `~/.agents/skills/` directory
- Supports parallel task dispatch

### Gemini CLI
- Tool mapping loaded automatically via GEMINI.md
- `activate_skill` tool for skill loading
- No native subagent support — use sequential execution

### No Subagent Support (ChatGPT, Cursor, basic API)
- Use `references/executing.md` (sequential in-session execution)
- Skip `references/subagent-dev.md` and `references/parallel-dispatch.md`
- Code review must be done inline (self-review only)
- All other workflows (TDD, debugging, verification, brainstorming, planning) work fully

## Capability Detection

At the start of a development session, determine your capabilities:

```
Can I run shell commands?        → YES: full workflow available
                                 → NO: limited to code review and planning

Can I spawn subagents?           → YES: use subagent-dev + parallel-dispatch
                                 → NO: use sequential executing

Can I read/write files?          → YES: progress tracking via markdown
                                 → NO: track progress in conversation only

Do I have git access?            → YES: worktrees + branch finishing available
                                 → NO: skip git-specific workflows
```

# Other tools

Quimera is plain Markdown, so any agent that can read files can follow it.

1. Point the tool at `AGENTS.md`. Most tools read it on their own; for the rest, add one line to the tool's instruction file: "Read AGENTS.md and follow it."
2. Skills live in `.agents/skills/`. If the tool has its own skills folder, copy or link them there.

| Tool | Instruction file | Skills folder |
|---|---|---|
| Cursor | reads `AGENTS.md` | `.cursor/skills/` |
| Google Antigravity | reads `AGENTS.md` (1.20.5+); see `antigravity.md` | `.agents/skills/` |
| Gemini CLI | `GEMINI.md`: add `@AGENTS.md` | none: the agent reads `.agents/skills/` when the flow names a skill |
| OpenCode, Hermes, others | `AGENTS.md` | the tool's own skills folder, or `.agents/skills/` |

Folder locations taken from GitHub Spec Kit's integrations. Confirm them in your tool's docs if something does not load.

## Tiers

Use the table in `models.md` for the provider the tool runs, in the project's model profile (full or economic), and keep the effort ceiling in `QUIMERA.md`.

## Without subagents

Follow the inline fallback in the `parallel-agents` skill: run the tasks one by one, with the same ledger, checks and independent review.

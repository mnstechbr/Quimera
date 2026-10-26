# Other tools

Quimera is plain Markdown, so any agent that can read files can follow it.

**Status:** experimental — documentation checked, no real session yet.
**Checked:** 2026-10-26.
**Sources:** https://cursor.com/docs/rules · https://cursor.com/docs/skills · https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/skills.md · https://github.com/google-gemini/gemini-cli/blob/main/docs/cli/gemini-md.md · https://opencode.ai/docs/rules/ · https://opencode.ai/docs/skills/ · https://agentskills.io/clients

1. Point the tool at `AGENTS.md`. Most tools read it on their own; for the rest, add one line to the tool's instruction file: "Read AGENTS.md and follow it."
2. Skills live in `.agents/skills/`, which most tools now read directly (table below). Copy or link them into the tool's own folder only when it does not.

| Tool | Instruction file | Skills folder | Status |
|---|---|---|---|
| Cursor | reads `AGENTS.md`, at the root and in subfolders (the nearer file wins) | `.agents/skills/` natively; the installer's `.cursor/skills/` mirror is optional | experimental |
| Google Antigravity | reads `AGENTS.md` (1.20.5+); see `antigravity.md` | `.agents/skills/` | experimental |
| Gemini CLI | `GEMINI.md` by default: add the line `@AGENTS.md`, or set `context.fileName` to `["AGENTS.md", "GEMINI.md"]` | `.agents/skills/` natively (an alias of `.gemini/skills/`) | experimental; consumer plans moved to the Antigravity CLI on 2026-06-18 |
| OpenCode | reads `AGENTS.md` (v1 falls back to `CLAUDE.md` when there is none; v2 does not) | `.agents/skills/` natively, besides `.opencode/skills/` and `.claude/skills/` | experimental |
| Others | `AGENTS.md`, or one line in the tool's own instruction file | the tool's own skills folder, or `.agents/skills/` | experimental |

Checked against each tool's own documentation on 2026-10-26; none of these has been tried in a real session yet (`docs/compatibility.md`). The open Agent Skills format lists the tools that read skills at https://agentskills.io/clients.

## Tiers

Use the table in `models.md` for the provider the tool runs, in the project's model profile (full or economic), and keep the effort ceiling in `QUIMERA.md`.

### Session model

Use the tool's model setting: the strongest tier while planning and reviewing, the standard tier while building. If the tool has one model for everything, say so in the report; reviews of risky work then go to a session in another tool on the strongest tier.

## Without subagents

Follow the inline fallback in the `parallel-agents` skill: run the tasks one by one, with the same ledger, checks and independent review.

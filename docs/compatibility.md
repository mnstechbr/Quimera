# Compatibility

What has been tried in a real session, how, and what rests only on each tool's documentation. The adapters in `adapters/` carry the same status; `tests/compatibility.test.mjs` fails if an adapter says "tested" without a run here.

- **tested:** a real session of the tool, on the recorded date and version, found Quimera's instruction file and skills, and loaded a skill.
- **experimental:** the tool's own documentation says it works; no run is recorded yet.

## Runs

| Tool | Version | Date | Status | Kit | What was checked | Result |
|---|---|---|---|---|---|---|
| Claude Code | 2.1.310 | 2026-10-26 | tested | commit `4a898d1` (work toward 0.4.0) | `quimera init --tools=claude` in a fresh repository; then a non-interactive session on the fast tier asked for the skills in `.claude/skills/`, the agents in `.claude/agents/`, and to load `verification` | 15 of 15 skills and 6 of 6 role agents listed; `verification` loaded from `.claude/skills/verification` |
| Codex | — | — | experimental | — | not tried yet | — |
| GitHub Copilot | — | — | experimental | — | not tried yet | — |
| Google Antigravity | — | — | experimental | — | not tried yet | — |
| Cursor | — | — | experimental | — | not tried yet | — |
| Gemini CLI | — | — | experimental | — | not tried yet | — |
| OpenCode | — | — | experimental | — | not tried yet | — |

## How to record a run

1. In a fresh git repository: `npx github:mnstechbr/Quimera#<tag> init --tools=<tool>` (or `node <kit>/bin/quimera.mjs init --tools=<tool>` from a local copy).
2. Open the tool there, on its cheapest model, and ask it, without running commands, to list the skills it has from the project, to list the project's custom agents if the tool has them, and to load the `verification` skill and print its first heading.
3. Record the tool's version, the date, the kit commit and what it listed. Mark the adapter `tested` only when every skill was found and the skill loaded.

## Notes

- Codex, Copilot, Cursor, Gemini CLI and OpenCode read `.agents/skills/` natively. The installer still writes the `.github/skills/` and `.cursor/skills/` mirrors when those tools are chosen; they are identical copies, and `doctor` reports any divergence. Dropping them is a candidate for a later release, after real runs show they are not needed. Claude Code reads only `.claude/skills/`, so its mirror stays.
- Copilot (VS Code and CLI) and Cursor also read `.claude/agents/`, so the Claude Code role agents may work there too; not tried.
- Gemini CLI stopped serving consumer plans on 2026-06-18 in favour of the Antigravity CLI; paid API-key and enterprise users keep it.

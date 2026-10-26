# Google Antigravity adapter

How the actions named in Quimera skills map to Google Antigravity (app, IDE and CLI).

**Status:** experimental — checked against Google's documentation, not yet in a real session (`docs/compatibility.md`).
**Checked:** 2026-10-26.
**Sources:** https://antigravity.google/docs/changelog · https://antigravity.google/docs/rules/ · https://antigravity.google/docs/skills · https://antigravity.google/docs/subagents/ · https://antigravity.google/docs/models/

## Where Antigravity reads things

- **Instructions:** Antigravity reads `AGENTS.md` (and `.agents/AGENTS.md`) from version 1.20.5 (2026-03-09) on, besides its own `GEMINI.md`; rules found while walking up from a file combine. On an older version, add a `GEMINI.md` with the line "Read AGENTS.md and follow it."
- **Skills:** `.agents/skills/<name>/SKILL.md` in the app, the IDE and the CLI (the older `.agent/skills/` still works). This is the folder Quimera always installs: nothing to mirror. (`--tools=antigravity` is accepted by the installer and adds no extra files; so is `--tools=other` for tools without an adapter.)
- **Rules:** `.agents/rules/*.md`. A rule file without frontmatter holding a valid trigger is dropped without a warning. Quimera does not need rules.
- **Subagents:** `.agents/agents/<name>.md`. The `model` field takes only `inherit`, `flash` or `pro`, so a subagent can be pinned to a model family but not to a named model.

## Actions

| Quimera action | Antigravity |
|---|---|
| Ask the user | A plain question in the conversation |
| Dispatch a subagent (tier: …) | A subagent in `.agents/agents/<name>.md` with `model: pro` for the strongest tier and `model: flash` for the standard and fast tiers. Otherwise follow the inline fallback in the `parallel-agents` skill. |
| Track progress in a checklist | The task list or plan view, or a checklist in the ledger file |
| Run a shell command | The terminal tool, in the foreground for every verification |

## Tiers

Use the table in `models.md` for the provider you run (usually Google Gemini), in the project's model profile (full or economic). Never use the maximum thinking level.

### Session model

Pick the model in the selector under the prompt box (CLI: `/model` or `--model`): the strongest tier while planning and reviewing, the standard tier while building. Switch when the plan is approved, not in the middle of a task.

## Discreet mode

Install the commit-msg guard (`node .quimera/scripts/install-hooks.mjs`). Check the git identity Antigravity commits with before the first commit (`node .quimera/scripts/git-preflight.mjs`).

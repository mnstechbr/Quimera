# Google Antigravity adapter

How the actions named in Quimera skills map to Google Antigravity (IDE and CLI). Checked against public guides (not Google's own docs) in October 2026; confirm in Antigravity's docs if something does not load.

## Where Antigravity reads things

- **Instructions:** Antigravity reads `AGENTS.md` from version 1.20.5 on, besides its own `GEMINI.md`. On an older version, add a `GEMINI.md` with the line "Read AGENTS.md and follow it." When both files exist, which one wins is not documented: keep `GEMINI.md` to that one line.
- **Skills:** `.agents/skills/<name>/SKILL.md`, the folder Quimera always installs. Nothing to mirror. (`--tools=antigravity` is accepted by the installer and adds no extra files; so is `--tools=other` for tools without an adapter.)
- **Rules:** `.agents/rules/` (the older `.agent/rules/` still works). Quimera does not need it.

## Actions

| Quimera action | Antigravity |
|---|---|
| Ask the user | A plain question in the conversation |
| Dispatch a subagent (tier: …) | A custom agent defined in an `agent.md` file whose `model` field pins it to the tier's model, if your version supports it (custom agents came to the CLI first; the `model` field may take a short alias such as `pro`). Otherwise follow the inline fallback in the `parallel-agents` skill. |
| Track progress in a checklist | The task list or plan view, or a checklist in the ledger file |
| Run a shell command | The terminal tool, in the foreground for every verification |

## Tiers

Use the table in `models.md` for the provider you run (usually Google Gemini), in the project's model profile (full or economic). Never use the maximum thinking level.

### Session model

Pick the model in the agent panel: the strongest tier while planning and reviewing, the standard tier while building. Switch when the plan is approved, not in the middle of a task.

## Discreet mode

Install the commit-msg guard (`node .quimera/scripts/install-hooks.mjs`). Check the git identity Antigravity commits with before the first commit (`node .quimera/scripts/git-preflight.mjs`).

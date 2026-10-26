# GitHub Copilot adapter

How Quimera works with GitHub Copilot (agent mode, coding agent and CLI).

## Where Copilot reads things

- **Instructions:** `.github/copilot-instructions.md`. The installer writes a one-line file there that points to `AGENTS.md`. Recent Copilot agents also read `AGENTS.md` directly.
- **Skills:** `.github/skills/<name>/SKILL.md`. The installer mirrors `.agents/skills/` there when you choose Copilot. Layout taken from GitHub Spec Kit's Copilot integration.

## Actions

| Quimera action | Copilot |
|---|---|
| Ask the user | A plain question in the chat |
| Dispatch a subagent (tier: …) | Use subagents if your Copilot version offers them. Otherwise follow the inline fallback in the `parallel-agents` skill. |
| Track progress in a checklist | A checklist in the ledger file |
| Run a shell command | The terminal tool, in the foreground |

## Tiers

Copilot offers models from several providers. Use the table in `models.md` for the provider you pick, in the project's model profile (full or economic). If your plan does not offer a listed model, use the closest one of the same size and tell the user.

### Session model

Pick the model in the chat's model picker: the strongest tier while planning and reviewing, the standard tier while building. Switch when the plan is approved, not in the middle of a task.

## Discreet mode

Install the commit-msg guard (`node .quimera/scripts/install-hooks.mjs`). The Copilot coding agent works on GitHub and opens pull requests under its own name, so do not use it in discreet projects.

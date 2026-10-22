# Codex adapter

How the actions named in Quimera skills map to OpenAI Codex (CLI and app).

## Where Codex reads things

- **Instructions:** Codex reads `AGENTS.md` natively.
- **Skills:** `.agents/skills/<name>/SKILL.md`. This is Quimera's own location, so nothing needs mirroring. Layout taken from GitHub Spec Kit's Codex integration.

## Actions

| Quimera action | Codex |
|---|---|
| Ask the user | A plain question in the conversation |
| Dispatch a subagent (tier: …) | Use Codex's subagent or parallel-task feature if your version has one. Otherwise follow the inline fallback in the `parallel-agents` skill. |
| Track progress in a checklist | The plan/checklist feature, or a checklist in the ledger file |
| Run a shell command | The shell tool, in the foreground for every verification |

## Tiers

Map the three tiers to the models your Codex install offers: a small fast model for **fast**, the default coding model for **standard**, the strongest reasoning model for **strongest**. Use Codex's reasoning-effort setting with the same ceiling as Quimera: high for the strongest tier, the level just below the maximum only for very complex work, never the maximum.

Model names change often. Write the current mapping in the project's `AGENTS.md` if you want it fixed.

## Discreet mode

- Install the commit-msg guard (`node .quimera/scripts/install-hooks.mjs`).
- Codex cloud tasks commit with your GitHub account's private noreply email. In discreet mode, commit from your own machine with the identity in `AGENTS.md`.

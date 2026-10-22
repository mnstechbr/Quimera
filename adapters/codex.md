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

Use the OpenAI table in `models.md`, in the project's model profile: full is GPT-6.1 Sol high / GPT-6.1 Sol medium / GPT-6 Luna low; economic is GPT-6.1 Sol medium / GPT-6 Luna medium / GPT-6 Luna low. Set Codex's reasoning-effort setting to match, never the maximum. If the project uses models of another provider through Codex, use that provider's table.

Model names change often. The profile's "Models" line wins: write the exact names there if you want them fixed.

## Discreet mode

- Install the commit-msg guard (`node .quimera/scripts/install-hooks.mjs`).
- Codex cloud tasks commit with your GitHub account's private noreply email. In discreet mode, commit from your own machine with the identity in `AGENTS.md`.

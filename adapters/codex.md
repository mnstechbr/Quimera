# Codex adapter

How the actions named in Quimera skills map to OpenAI Codex (CLI, IDE extension and app).

**Status:** experimental — checked against OpenAI's documentation, not yet in a real session (`docs/compatibility.md`).
**Checked:** 2026-10-26.
**Sources:** https://learn.chatgpt.com/docs/agent-configuration/agents-md · https://learn.chatgpt.com/docs/build-skills · https://learn.chatgpt.com/docs/agent-configuration/subagents · https://learn.chatgpt.com/docs/models

## Where Codex reads things

- **Instructions:** Codex reads `AGENTS.md` natively: the global `~/.codex/AGENTS.md`, then one file per folder from the repository root down to the working folder, nearer files last. An `AGENTS.override.md` replaces the `AGENTS.md` beside it; files over 32 KiB are cut by default.
- **Skills:** `.agents/skills/` in every folder from the working folder up to the repository root, plus `~/.agents/skills/`. This is Quimera's own location, so nothing needs mirroring.
- **Subagents:** one TOML file per agent in `.codex/agents/` (`name`, `description`, `developer_instructions`, and an optional `model` that pins it). Quimera does not ship Codex role agents yet.

## Actions

| Quimera action | Codex |
|---|---|
| Ask the user | A plain question in the conversation |
| Dispatch a subagent (tier: …) | A subagent from `.codex/agents/<name>.toml` with `model` set to the tier's model. Otherwise follow the inline fallback in the `parallel-agents` skill. |
| Track progress in a checklist | The plan/checklist feature, or a checklist in the ledger file |
| Run a shell command | The shell tool, in the foreground for every verification |

## Tiers

Use the OpenAI table in `models.md`, in the project's model profile: full is GPT-6.1 Sol high / GPT-6.1 Sol medium / GPT-6 Luna low; economic is GPT-6.1 Sol medium / GPT-6 Luna medium / GPT-6 Luna low. Set Codex's reasoning-effort setting to match, never the maximum. If the project uses models of another provider through Codex, use that provider's table.

Model names change often. The profile's "Models" line wins: write the exact names there if you want them fixed.

### Session model

Use `/model` (or `--model`, or `model` in `config.toml`) to switch: the strongest tier (GPT-6.1 Sol, high) to plan and review, the standard tier (Sol at medium in the full profile, Luna at medium in the economic one) to build. Reviews of risky work go to a session on the strongest tier.

## Discreet mode

- Install the commit-msg guard (`node .quimera/scripts/install-hooks.mjs`).
- Codex cloud tasks commit with your GitHub account's private noreply email. In discreet mode, commit from your own machine with the identity in `AGENTS.md`.

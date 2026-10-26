# GitHub Copilot adapter

How Quimera works with GitHub Copilot (VS Code agent mode, cloud agent and CLI).

**Status:** experimental — checked against GitHub's and VS Code's documentation, not yet in a real session (`docs/compatibility.md`).
**Checked:** 2026-10-26.
**Sources:** https://docs.github.com/en/copilot/reference/custom-instructions-support · https://docs.github.com/en/copilot/concepts/agents/about-agent-skills · https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference · https://code.visualstudio.com/docs/copilot/customization/agent-skills · https://code.visualstudio.com/docs/agents/reference/custom-agent-file-reference

## Where Copilot reads things

- **Instructions:** `.github/copilot-instructions.md`; the installer writes a one-line file there that points to `AGENTS.md`. `AGENTS.md` itself is read by the cloud agent, the CLI (repository root and working folder), code review on GitHub.com and VS Code chat (the root by default; nested files only with an off-by-default setting). Chat on GitHub.com does not read it, which is why the pointer file stays.
- **Skills:** a project's `.github/skills/`, `.claude/skills/` or `.agents/skills/`; the CLI looks in `.github/skills/` first. Since Copilot reads `.agents/skills/` natively, the `.github/skills/` mirror the installer writes is a convenience, not a requirement.
- **Subagents:** custom agents in `.github/agents/*.agent.md`; VS Code and the CLI also read `.claude/agents/`. A `model` field pins an agent to a model (the CLI also takes `models` and `modelPolicy`). Whether the cloud agent honors `model` is not documented.

## Actions

| Quimera action | Copilot |
|---|---|
| Ask the user | A plain question in the chat |
| Dispatch a subagent (tier: …) | A custom agent with `model` set to the tier's model (in VS Code and the CLI the Claude Code role agents in `.claude/agents/` are also read). Otherwise follow the inline fallback in the `parallel-agents` skill. |
| Track progress in a checklist | A checklist in the ledger file |
| Run a shell command | The terminal tool, in the foreground |

## Tiers

Copilot offers models from several providers. Use the table in `models.md` for the provider you pick, in the project's model profile (full or economic). If your plan does not offer a listed model, use the closest one of the same size and tell the user.

### Session model

Pick the model in the chat's model picker (CLI: `/model` or `--model`; cloud agent: the picker when you assign the task): the strongest tier while planning and reviewing, the standard tier while building. Switch when the plan is approved, not in the middle of a task.

## Discreet mode

Install the commit-msg guard (`node .quimera/scripts/install-hooks.mjs`). The Copilot coding agent works on GitHub and opens pull requests under its own name, so do not use it in discreet projects.

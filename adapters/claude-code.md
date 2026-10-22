# Claude Code adapter

How the actions named in Quimera skills map to Claude Code. Verified against the Claude Code docs (code.claude.com/docs) in October 2026.

## Where Claude Code reads things

- **Instructions:** Claude Code reads `AGENTS.md` only when the project has no `CLAUDE.md`. If a `CLAUDE.md` exists, it must contain the line `@AGENTS.md`, or `AGENTS.md` is ignored. The installer writes a `CLAUDE.md` with that import.
- **Skills:** `.claude/skills/<name>/SKILL.md`. The installer mirrors `.agents/skills/` there.
- **Subagents:** `.claude/agents/*.md`. The installer adds three role agents (below).
- **Cloud sessions** (claude.ai/code) load everything committed in the repository (`AGENTS.md`, `CLAUDE.md`, `.claude/skills`, `.claude/agents`, `.claude/settings.json` hooks). They do **not** load your `~/.claude` folder, and they do not install plugins listed in the repository's settings. In local-only mode the Quimera files are not committed, so cloud sessions will not see them: work locally.

## Actions

| Quimera action | Claude Code |
|---|---|
| Ask the user | The question tool (multiple choice with a recommended option), or a plain question |
| Dispatch a subagent (tier: …) | The Agent tool, passing `model` explicitly; several calls in one message run in parallel |
| Track progress in a checklist | The task list |
| Use an isolated worktree | `git worktree add` (or the worktree option of the Agent tool); never by default |
| Run a shell command | Bash, in the foreground for every verification |

## Tiers

| Tier | Model | Effort |
|---|---|---|
| fast | `haiku` | `low` |
| standard | `sonnet` | `medium` |
| strongest | `opus` | `high`; `xhigh` only for very complex work |

- Never use `max`. Do not pick `fable` unless the user asks.
- Set the session effort with `/effort <level>`. A subagent's effort comes from the `effort` field of its definition.

## Role agents installed in `.claude/agents/`

| Agent | Model · effort | Use |
|---|---|---|
| `quimera-explorer` | haiku · low | Search, read and report. Read-only. |
| `quimera-implementer` | sonnet · medium | A well-defined part of a plan, with its own files |
| `quimera-reviewer` | opus · high | Independent review, architecture and adversarial passes. Read-only. |

## Discreet mode

- The commit-msg guard (`node .quimera/scripts/install-hooks.mjs`) is the reliable protection: it strips co-author and "generated with" lines from every commit, whatever tool wrote it.
- You can also set this in `~/.claude/settings.json`, but there is a known issue where `"commit": ""` does not remove the trailer, so do not rely on it alone:

```json
{ "attribution": { "commit": "", "pr": "" } }
```

- Cloud sessions commit as `Claude <noreply@anthropic.com>` by default. In discreet mode, commit from your own machine.

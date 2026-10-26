# Claude Code adapter

How the actions named in Quimera skills map to Claude Code.

**Status:** tested — skills, role agents and a skill load checked in a real session (`docs/compatibility.md`).
**Checked:** 2026-10-26, Claude Code 2.1.310.
**Sources:** https://code.claude.com/docs/en/memory · https://code.claude.com/docs/en/skills · https://code.claude.com/docs/en/sub-agents · https://code.claude.com/docs/en/hooks

## Where Claude Code reads things

- **Instructions:** by default Claude Code reads `AGENTS.md` only when there is no `CLAUDE.md`, `.claude/CLAUDE.md` or `CLAUDE.local.md` in the working folder or above it. When one of them exists, it must contain the line `@AGENTS.md`, or `AGENTS.md` is ignored. The installer writes a `CLAUDE.md` with that import. (The "Project instructions" setting can also load both files together.)
- **Skills:** `.claude/skills/<name>/SKILL.md`. The installer mirrors `.agents/skills/` there.
- **Subagents:** `.claude/agents/*.md`. The installer adds six role agents (below).
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

The model and effort for each tier, in the full and the economic profile, are in `models.md` (Anthropic). In short: full is `opus` high / `sonnet` medium / `haiku` low; economic is `sonnet` medium / `haiku` medium / `haiku` low.

- Never use `max`. Do not pick `fable` unless the user asks.
- Set the session effort with `/effort <level>`. A subagent's effort comes from the `effort` field of its definition, so the role agents below carry the profile's model and effort. The installer writes them for the profile: `npx github:mnstechbr/Quimera update --models=economic` (or `--models=full`) switches them.
- **Applying the profile (kickoff step 8, or when the user switches).** With Anthropic models, run `npx github:mnstechbr/Quimera update --models=<full|economic>`; it updates the kit to the latest version and rewrites only the model and effort of the role agents it installed (an agent the user edited is kept, with the new version beside it as `*.quimera-new`).
- **Specialists (kickoff step 3).** Install only the specialist reviewer agents the profile keeps: `npx github:mnstechbr/Quimera update --specialists=<security,database,interface|none>`. The general reviewer, implementer and explorer are always installed.
- **Other providers inside Claude Code.** If you run DeepSeek, MiMo or another provider through a launcher that points Claude Code at their endpoint, the launcher decides which real model each alias (`opus`, `sonnet`, `haiku`) calls. For a two-size provider, map `opus` → the large model (DeepSeek V4 Pro, MiMo-V2.6 Pro) and `sonnet` and `haiku` → the small one, keep the **full** role agents (do not use `--models=economic`, which would put reviewers on `sonnet`, the small model), and dispatch every reviewer, including `quimera-interface-reviewer`, with `model: opus`. A whole session launched that way is also a way to hand work to another model: give it the same brief a subagent would get, wait for it to finish, then review.

### Session model

Plan, review the vision and the architecture, and talk through decisions on the strongest tier (`/model opus`). Once the plan is approved, build on the standard tier (`/model sonnet`, or a new session started on it), and dispatch reviews to `quimera-reviewer` and the specialists, which carry the strongest tier; searches go to `quimera-explorer`. In the economic profile the same split runs one tier down: `/model sonnet` to plan, and `/model haiku` only for tasks whose plan holds the exact change.

## Role agents installed in `.claude/agents/`

| Agent | Full | Economic | Use |
|---|---|---|---|
| `quimera-explorer` | haiku · low | haiku · low | Search, read and report. Read-only. |
| `quimera-implementer` | sonnet · medium | haiku · medium | A well-defined part of a plan, with its own files |
| `quimera-reviewer` | opus · high | sonnet · medium | Independent review, architecture and adversarial passes. Read-only. |
| `quimera-security-reviewer` | opus · high | sonnet · medium | Specialist review: security. Read-only. |
| `quimera-database-reviewer` | opus · high | sonnet · medium | Specialist review: database and performance. Read-only. |
| `quimera-interface-reviewer` | sonnet · medium | sonnet · medium | Specialist review: interface and accessibility. Read-only. |

`code-review` decides which reviewers run (its "Specialist reviewers" table). In the full profile: for a general review at Normal depth, pass `model: sonnet` to `quimera-reviewer`; for Risky depth keep its default; at Risky depth, when `quimera-interface-reviewer` is the lead, pass `model: opus`. In the economic profile, keep every agent's default; passing a stronger model needs the user's ok.

## Reminder after compaction (opt-in)

When Claude Code compacts a long conversation, the working loop in `AGENTS.md` can drop out of view; in both pilot projects nobody re-read the memory files afterwards. This optional hook prints one reminder into the context after every compaction. It only runs `echo`: it reads nothing, writes nothing and calls nothing. Besides the commit-msg guard it is the only hook Quimera offers, and it is never installed on its own: offer it at kickoff and add it only with the user's ok, merged into `.claude/settings.local.json` (personal, not committed; if you create that file by hand, add it to `.git/info/exclude`).

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'Context was compacted. Before acting, re-read AGENTS.md, docs/STATE.md and docs/MAP.md, then continue the working loop in AGENTS.md.'"
          }
        ]
      }
    ]
  }
}
```

Checked against code.claude.com/docs/en/hooks and /settings on 2026-10-26: a `SessionStart` hook with the matcher `compact` runs after automatic and manual compaction, and the plain text it prints is added to the context.

## Discreet mode

- The commit-msg guard (`node .quimera/scripts/install-hooks.mjs`) is the reliable protection: it strips co-author and "generated with" lines from every commit, whatever tool wrote it.
- You can also set this in `~/.claude/settings.json`, but there is a known issue where `"commit": ""` does not remove the trailer, so do not rely on it alone:

```json
{ "attribution": { "commit": "", "pr": "" } }
```

- Cloud sessions commit as `Claude <noreply@anthropic.com>` by default. In discreet mode, commit from your own machine.

# Quimera

**A small, local-first development standard for one owner working with several AI coding tools: decisions live in the repository, the git history stays yours, and nothing counts as done without evidence.**

[Português](README.pt-BR.md)

In mythology, the chimera is one creature made of parts of different animals. Quimera does the same for AI-assisted development: it adapts mature pieces of [Superpowers](https://github.com/obra/superpowers), [Spec Kit](https://github.com/github/spec-kit), [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) and [Agent OS](https://github.com/buildermethods/agent-os), and puts them together for one person building products with AI agents, in Brazilian Portuguese first.

It is plain Markdown plus a few dependency-free Node scripts, with no telemetry and nothing that runs on its own. Claude Code is tested in a real session; Codex, Copilot, Cursor, Antigravity, Gemini CLI and OpenCode follow their own documentation and are marked experimental until a real run is recorded ([docs/compatibility.md](docs/compatibility.md)).

## What it gives you

- **Your git history stays yours.** Discreet mode installs a commit guard that strips AI co-author and "generated with" lines, whatever tool wrote them. Every session checks the project's git identity on this machine. Every task gets its own branch from the default branch and comes back to it, by pull request or, without a remote, by a local merge.
- **Evidence, not claims.** `verify.mjs` runs the checks that matter for what changed and ends every step as passed, failed, unverified or not applicable; "unverified" is never a pass. Any stack can declare its own checks in `.quimera/checks.json`.
- **A loop that keeps running.** A six-step working loop lives in `AGENTS.md`, the one file every tool loads: depth and branch first, verify, commit with memory updated, re-read after context compaction, review at the end of each phase.
- **Memory any tool can pick up.** A short state, a map, decisions with their reasons and your own coding standards, in the repository. Local-only projects keep them out of the project's git and can keep a private history of them.
- **It fits the owner.** Kickoff asks how technical you are and how much to explain, and records the kind of product (web app, showcase, game, mobile app, library, API). Reviews ask the questions that fit it.
- **Proportional depth and cost.** Four depths, from typo to risky. The session that writes code runs on the standard model; planning and reviews run on the strongest, with specialist reviewers for security, database and interface when a change touches them. Model tables for Claude, GPT, Gemini, DeepSeek and MiMo, in a full and an economic profile.
- **A safe installer.** Updates keep your edits (the new version goes beside them as `*.quimera-new`), refuse anything outside the managed folders, survive interruption, and `doctor` tells installation health apart from work readiness.

## The flow

```
Project start:  kickoff → study round → vision review → architecture review → design directions → code standards
Every task:     task start → (architecture review) → plan → parallel agents → verification → consistency check → code review → close task
```

The rules for every step are in [QUIMERA.md](QUIMERA.md). Each step is a skill in [skills/](skills/).

## Start a new project

Put your idea in a file (Markdown, Word or PDF), open your coding agent in an empty folder, attach the file and say:

> Start this project with Quimera (github.com/mnstechbr/Quimera). The idea is in the attached file.

The agent installs the kit, reads your file, asks only what the file leaves open, in plain words, and reviews the vision and the architecture with you before any code.

### For the agent reading this

If the user asked you to start or set up a project with Quimera:

1. Ask before creating anything: is this folder the project, and should it be a git repository (`git init -b main`)?
2. Ask which coding tools the user works with here (Claude Code, Codex, Copilot, Cursor, Antigravity; for any other tool use `--tools=other` and follow `adapters/other-tools.md`).
3. Install the kit with the command in "Install in a project" below, passing those tools. If you cannot run commands, give the user the command to run and wait.
4. Read `.quimera/QUIMERA.md`, then follow the `project-kickoff` skill from `.agents/skills/project-kickoff/SKILL.md`. If the user attached a vision file, the kickoff reads it first.
5. Do not write product code until the kickoff, the vision review and the architecture review are done and the user agreed.

## Install in a project

Quimera is designed for **new projects**. It can be added to an existing one, but the kickoff then only adds files and never reorganizes what is there. Inside the project's git repository, with the release you want:

```bash
npx github:mnstechbr/Quimera#v0.4.0 init --tools=claude
```

- `--tools`: any of `claude,codex,copilot,cursor,antigravity,other` (default `claude`).
- `--mode=discreet` installs the commit guard.
- `--models=economic` sets the Claude Code role agents to the economic profile (default `full`).
- `--specialists=security,database,interface` (or `none`) installs only the specialist reviewer agents the project uses (default: all three).
- `--local-only` keeps the Quimera files and the project memory out of git, on your machine only. Use it in a repository that belongs to someone else.
- `--dry-run` prints every change the run would make, and makes none.

Without the tag, `npx github:mnstechbr/Quimera` installs whatever is on the main branch. From a local copy (offline, or to pin a commit): `git clone https://github.com/mnstechbr/Quimera.git`, then `node Quimera/bin/quimera.mjs init --tools=claude` inside the project.

Then open your coding agent in the folder and say: *"start this project with Quimera"*. The `project-kickoff` skill asks who you are and how you want to work, then the mode, the identity and the product, before creating anything.

Later: `npx github:mnstechbr/Quimera#<tag> update` moves to that release, prints the version change, and points to `.quimera/CHANGELOG.md`; it also takes `--tools`, `--models` and `--specialists` to change the setup. Files you edited are kept, and the new version is saved next to each as `*.quimera-new`. `doctor` checks the installation and then the git state, and changes nothing (`--json` for a report). What to do when an update is interrupted: [docs/update-recovery.md](docs/update-recovery.md).

Exit codes: `0` done; `1` something failed or needs attention, and the output says what (an invalid manifest or an unsafe path stops the run before anything is written); `2` not a git repository; `64` an unknown command or option, or an invalid value, with nothing written.

The installer only copies Markdown and small scripts. It never installs dependencies, never touches your code, never calls the network, and never overwrites or deletes a file it did not create.

## What lands in your project

```
AGENTS.md                 project profile, working loop, stack, rules (created by the kickoff, read by every tool)
.quimera/                 QUIMERA.md, scripts, tool adapters, templates, NOTICE.md, LICENSE, CHANGELOG.md
                          (and, if you create them: checks.json, PROFILE.md; the private memory history lives in .git/quimera-memory.git)
.agents/skills/           the skills (mirrored to .claude/skills, .github/skills or .cursor/skills per tool)
docs/STATE.md · MAP.md · VISION.md · DECISIONS.md · standards/   project memory
```

## How it compares

Proportional depths, memory files, safe updates, specialist reviewers and model profiles exist in other kits too (see the comparison in [docs/plans/2026-10-26-release-0.4.0.md](docs/plans/2026-10-26-release-0.4.0.md#positioning)). What Quimera brings is the combination for one owner across tools, and a few pieces we did not find elsewhere: a commit guard shipped in the kit, a per-project identity check every session, and verification that refuses to call missing evidence a pass. Kits with more integrations exist; Quimera stays small and inspectable.

## Developing the kit

`npm test` runs the contract tests (Node's built-in runner, isolated git fixtures, no network); `npm run check` checks the skills and the kit's own rules. Neither installs anything.

## Credits

See [NOTICE.md](NOTICE.md). Every skill names the exact upstream files it adapts in its Provenance section. Quimera is not affiliated with any of the projects it learns from.

## License

[MIT](LICENSE)

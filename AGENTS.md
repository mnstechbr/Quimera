# Quimera (the kit itself)

This repository is the Quimera kit, not a project that uses it. Agents working here edit the kit.

## Project profile

- **Mode:** discreet
- **Git identity:** Jean Vitor <mnstechbr@outlook.com>
- **Quimera files:** committed
- **User's language:** Brazilian Portuguese
- **Pushing:** ask every time
- **Specialist reviewers:** security
- **Models:** Anthropic · full

## Layout

- `QUIMERA.md`: the core standard, copied into projects as `.quimera/QUIMERA.md`.
- `skills/<name>/SKILL.md`: one skill per step, copied to `.agents/skills/` and mirrored per tool.
- `scripts/`: `verify.mjs`, `git-preflight.mjs`, `install-hooks.mjs`, `local-only.mjs`, `memory.mjs`, `commit-msg`, and shared modules in `scripts/lib/`.
- `adapters/`: how each tool maps the actions and tiers.
- `templates/`: AGENTS.md and memory files used by `project-kickoff`, plus Claude Code role agents.
- `bin/quimera.mjs`: the installer (`init`, `update`, `doctor`), with path and manifest rules in `bin/lib/`.
- `tests/`: contract tests; `dev/check-content.mjs`: the content rules; `evals/`: evaluation scenarios. None of these is shipped.
- `docs/`: plans, contracts (verification, workflow, update recovery), compatibility runs, quickstart and troubleshooting. Not shipped; linked from the READMEs.

## Rules for changing the kit

1. Files in English, except `README.pt-BR.md`. Talk to the user in Portuguese.
2. Skills are tool-neutral: name actions, not tool names. Tool details belong in `adapters/`.
3. Skill frontmatter has only `name` and `description`.
4. Every skill ends with a Provenance section. Anything adapted from an upstream project keeps its credit, and `NOTICE.md` lists the source.
5. Never use the names "BMad", "BMAD" or "BMad Method" for any part of Quimera (trademark). Credit only.
6. Nothing in the kit may install dependencies, start servers, call the network on its own, or run code automatically, apart from the opt-in commit-msg guard and the opt-in compaction reminder for Claude Code, which only prints text.
7. Bump `version` in `package.json` when skills or scripts change in a way that projects should pick up with `quimera update`.
8. Test the installer in a scratch repository before committing changes to it: `init`, edit a file, `update`, `doctor`.
9. A skill or rule change that alters behaviour comes with a test in `tests/` or a scenario in `evals/scenarios/`, and keeps `docs/workflow-contract.md` true.

## Commands

- `npm test`: contract tests, in isolated temporary repositories, with no network.
- `npm run check`: content rules for skills, adapters, templates and scenarios.
- `.github/workflows/validate.yml`: the same two on Node 20 and 24, only when dispatched by hand.

## Release checklist

1. `npm test` and `npm run check` green locally; the validation workflow dispatched and green on Node 20 and 24 (it is manual: ask the user before dispatching).
2. Installer and script changes reviewed independently on the strongest tier, with the security specialist.
3. The pilot projects migrated on copies (never in place): `update`, `doctor`, `verify`.
4. `docs/compatibility.md` and the adapters' status lines current; `NOTICE.md` versions current.
5. `version` in `package.json` raised; the `CHANGELOG.md` entry dated, with its "Upgrading" notes.
6. Merge into `main`. Ask the user before each outward step: push `main`, push the tag `v<version>`, create the GitHub release from the changelog entry.


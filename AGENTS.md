# Quimera (the kit itself)

This repository is the Quimera kit, not a project that uses it. Agents working here edit the kit.

## Project profile

- **Mode:** discreet
- **Git identity:** Jean Vitor <mnstechbr@outlook.com>
- **Quimera files:** committed
- **User's language:** Brazilian Portuguese
- **Pushing:** ask every time

## Layout

- `QUIMERA.md`: the core standard, copied into projects as `.quimera/QUIMERA.md`.
- `skills/<name>/SKILL.md`: one skill per step, copied to `.agents/skills/` and mirrored per tool.
- `scripts/`: `verify.mjs`, `git-preflight.mjs`, `install-hooks.mjs`, `local-only.mjs`, `commit-msg`.
- `adapters/`: how each tool maps the actions and tiers.
- `templates/`: AGENTS.md and memory files used by `project-kickoff`, plus Claude Code role agents.
- `bin/quimera.mjs`: the installer (`init`, `update`, `doctor`).

## Rules for changing the kit

1. Files in English, except `README.pt-BR.md`. Talk to the user in Portuguese.
2. Skills are tool-neutral: name actions, not tool names. Tool details belong in `adapters/`.
3. Skill frontmatter has only `name` and `description`.
4. Every skill ends with a Provenance section. Anything adapted from an upstream project keeps its credit, and `NOTICE.md` lists the source.
5. Never use the names "BMad", "BMAD" or "BMad Method" for any part of Quimera (trademark). Credit only.
6. Nothing in the kit may install dependencies, start servers, call the network on its own, or run code automatically, apart from the opt-in commit-msg guard.
7. Bump `version` in `package.json` when skills or scripts change in a way that projects should pick up with `quimera update`.
8. Test the installer in a scratch repository before committing changes to it: `init`, edit a file, `update`, `doctor`.

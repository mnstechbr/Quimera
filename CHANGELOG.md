# Changelog

All notable changes to Quimera. Versions follow `package.json`; install a release by its tag, for example `npx github:mnstechbr/Quimera#v0.4.0`.

## 0.4.0 · 2026-10-26

The method now runs after kickoff, the scripts never report success without evidence, and the installer never leaves the project. Built from an external assessment and from two real projects started with 0.3.0; the plan is in `docs/plans/2026-10-26-release-0.4.0.md` in the kit repository.

### Upgrading from 0.3.0

1. Run `npx github:mnstechbr/Quimera#v0.4.0 update`, then `doctor`. The manifest moves to schema 2 on its own; edited files are kept, with the new version beside them as `*.quimera-new`.
2. `update` never edits `AGENTS.md`. Ask your agent to add, from `.quimera/templates/AGENTS.md`, the "Working loop" and "Working with the owner" sections and the profile lines "Owner", "Product type", "Integrating" and "Memory".
3. Run `node .quimera/scripts/git-preflight.mjs`. If it reports no default branch or stacked task branches, create the default branch and integrate finished work (`project-kickoff` step 9, `close-task` step 6) with your agent, one step at a time.
4. Local-only projects: the exclusions are now exact paths, so `docs/vision/`, `docs/studies/`, `docs/plans/` and `docs/reviews/` become visible to git. Commit them, or keep them out with `node .quimera/scripts/local-only.mjs --product-docs`. Then consider `node .quimera/scripts/memory.mjs init` for a private history of the memory.
5. Projects without `package.json`: declare your checks in `.quimera/checks.json` (template in `.quimera/templates/checks.json`), or `verify.mjs` reports `unverified`.

### Fixed

- Three skills (`parallel-agents`, `study-round`, `vision-review`) had invalid YAML frontmatter; every description is now a quoted string, checked by `npm run check`.
- The installer validates the whole manifest and every path before writing: no `..`, absolute paths, `.git` paths or symbolic links; anything unsafe stops the run with nothing changed. A dangling symlink in place of `CLAUDE.md` no longer leads a write outside the project.
- `init` and `doctor` run the kit's own helper scripts, never copies found in the project.
- Invalid commands, options and values exit 64 with nothing written; a failed step (for example another tool's `commit-msg` hook) exits 1 and says what was not done.
- `verify.mjs` reports each step as passed, failed, unverified or not applicable, and the last line carries the counts. `push` with nothing executed is unverified (exit 3), never `ok`. Deletions and config changes anywhere on the branch keep the full plan until a full run passes. MDX is code.
- The git preflight runs offline unless `--fetch` is given, validates the profile, and reports a missing default branch, stacked task branches, old uncommitted work and stale `docs/STATE.md`.
- `local-only.mjs` writes exact paths in one block it owns, so the project's own files in the same folders stay visible; the broad 0.3.0 list is replaced and your own lines are kept.
- The commit-msg guard keeps the message intact on any failure and handles CRLF; it is upgraded on `update` only when unedited, and a shared hooks folder needs `--shared`.
- `doctor` separates installation health from work readiness and reports pending `*.quimera-new` copies, diverged skill mirrors, interrupted runs and profile drift.

### Added

- Manifest schema 2 (desired setup, installed digests, pending offers and orphans, hook), a lock against concurrent runs and a journal that makes an interrupted run resumable. `update --tools` and `--specialists`; `doctor --json`; `verify.mjs --json`.
- `.quimera/checks.json`: the project's own check commands, for any stack.
- `memory.mjs`: a private history of local-only memory in `.git/quimera-memory.git` (in a linked worktree, that worktree's own git folder), with no remote.
- A six-step working loop in the `AGENTS.md` template, kept in the one file every tool loads; skill triggers for each request, each phase end and each delivery.
- Kickoff asks first how technical the owner is and how much to explain, records the product type, and creates the default branch with the first commit. `close-task` integrates finished work locally when there is no remote.
- `vision-review` category sets per product type (games, visual showcases, products with accounts, libraries); `design-directions` starts from the owner's references and real assets.
- Optional text-only reminder for Claude Code after context compaction.
- Every adapter states its status (tested or experimental), the date it was checked and its primary sources; `docs/compatibility.md` records real runs.
- `NOTICE.md`, `LICENSE` and this changelog are copied into `.quimera/`.
- A test suite for the kit itself (`npm test`) and content checks (`npm run check`).

### Changed

- Discreet mode no longer implies local-only: local-only is recommended only for repositories that belong to someone else.
- One failure policy: after the third failed attempt (or the third rejection by the owner) the dependent work stops and goes to the owner. Reviews in the same session are labelled self-review.
- The session that writes code runs on the standard tier; planning and reviews run on the strongest.
- `QUIMERA.md` follows the owner profile instead of assuming a growing engineer, and says how to coexist with other skill packs and plugins.

## 0.3.0 · 2026-10-22

Model profiles (full and economic) for five providers, the Antigravity adapter, kickoff that reads the owner's vision file, and the guide to start a new project.

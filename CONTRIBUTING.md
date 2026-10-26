# Contributing

Quimera is small on purpose: Markdown skills, a core standard, tool adapters and a few dependency-free Node scripts. The rules for changing it are in [AGENTS.md](AGENTS.md); this file says how to work on it.

## Commands

- `npm test`: the contract tests (Node's built-in runner). Every test builds its own repository in a temporary folder with an empty global git configuration and no network; nothing touches your machine's git setup.
- `npm run check`: the content rules (skill frontmatter, Provenance, references, trademark, wording, sizes, evaluation scenarios).

Neither installs anything. Node 20 or later.

## How a change lands

1. A branch per change (`feat/…`, `fix/…`, `docs/…`, `test/…`, `refactor/…`, `chore/…`), named after the change, never after a tool.
2. Write the failing test first, see it fail, then make it pass. A skill change that alters behaviour gets a check in `tests/` (its wording, its triggers) or a scenario in `evals/scenarios/`.
3. Installer changes are also tried by hand in a scratch repository: `init`, edit a file, `update`, `doctor`.
4. `npm test` and `npm run check` green; commits in English, Conventional Commits, no tool names and no AI trailers.
5. Changes that projects should receive with `quimera update` raise the version in `package.json` at release time and get a line in `CHANGELOG.md`.

## Upstream sources

Skills adapted from upstream projects keep their Provenance section and their entry in `NOTICE.md`. To review an upstream source again: read its current release, compare it with the commit recorded in `NOTICE.md`, adapt what is worth taking, and update the commit and version in both places in the same change.

## Compatibility

Mark a tool `tested` in its adapter only after a real session recorded in `docs/compatibility.md`. Windows and macOS are not covered by the test runs yet; treat them as experimental.

## Deprecations and migrations

- The installer reads manifests from every earlier release and migrates them on `update`; a migration is removed only in a release whose changelog says so, after at least one release that still performs it.
- A renamed or removed script, flag or skill keeps working, or fails with a message that names its replacement, for at least one release.
- Behaviour that changes what projects see (exit codes, files excluded in local-only mode, profile lines) is listed under "Upgrading" in `CHANGELOG.md`.

## Release checklist

The checklist lives in [AGENTS.md](AGENTS.md#release-checklist), next to the rules it enforces.

# Verification contract

What `scripts/verify.mjs` promises, for maintainers of the kit. The user-facing rules are in `skills/verification/SKILL.md`; the tests that hold this contract are in `tests/verification.test.mjs`.

## States

Every step ends in exactly one state:

| State | When | Counts as evidence |
|---|---|---|
| `passed` | The command ran, exited 0, and (for test steps) the runner found tests | Yes |
| `failed` | The command ran and exited non-zero, could not start, or was stopped by a signal | Yes, against |
| `unverified` | The check is needed but has no way to run: no script, no tool, no tests found, or a build skipped because an earlier step failed | No |
| `not-applicable` | The check does not apply to this change, always with a reason | Not needed |

The result is `failed` if any step failed, else `unverified` if any step is unverified, else `passed` if at least one step ran, else `not-applicable`. In `push` mode a run where nothing executed is `unverified`, unless the whole change is documentation-only against a known base.

Exit codes: `0` passed or not applicable, `1` failed, `3` unverified, `2` not a git repository, an invalid `.quimera/checks.json` or an unknown `--base`, `64` an unknown option. The last line of the human output always carries the counts, so a reader who sees only that line still sees the truth.

## Scope

- **Base.** `--base`, else `origin/main`, `origin/master`, `main`, `master`. The changes are everything between the merge-base and the working tree, plus untracked files. Before the first commit, everything in the index counts.
- **No base.** `changed` mode looks at uncommitted work only and says so. `push` mode cannot tell what the branch changed, so it runs the full plan. (The plan proposed "unverified" here; running every check gives evidence instead of none.)
- **Full plan in `changed` mode.** A config file or a deleted non-documentation file anywhere on the branch forces the full plan, until a full run passes. The passing commit is recorded in the git directory (`quimera-verified`), and later runs only look at changes after it. This is the only file `verify.mjs` writes outside its log folder.
- **Documentation.** `.md`, `.txt`, `LICENSE`, `CHANGELOG` and `NOTICE` files. MDX is code.
- **Files with no matching check.** Changed files that no linter or test selection covers (pages, styles, assets) run the `build` script; without one they are `unverified`.
- **`--files`.** Only the listed files are linted and their related tests run. Whole-project steps are `not-applicable` with the reason "left to the coordinator", and the result line says the coordinator runs the rest.

## Declared checks

`.quimera/checks.json` belongs to the project (the installer never claims it). When it exists it replaces detection entirely: the listed checks are the plan.

- `name` (unique), and either `run` (a non-empty list of strings, run without a shell except on Windows, where package-manager shims need one) or `skip` (a non-empty reason, reported as `not-applicable`).
- `when`: `changed` (default; runs while working and before the push) or `push` (only before the push).
- `cwd`: a folder inside the project, default the root.

Without `package.json` and without the file, the result is `unverified` with the next step, never a crash.

## Memory

When `docs/STATE.md` looks stale (`scripts/lib/memory.mjs`), one `memory:` line is printed. It never changes the result; the preflight lists every problem.

## Report

`--json` prints one object: `mode`, `base`, `mergeBase`, `revision`, `dirty`, `scope` (`changed`, `full`, `declared` or `files`), `checks`, `files`, `deleted`, `memory`, `steps` (each with `name`, `status`, `command`, `cwd`, `reason`, `exit`, `seconds`, `log`), `counts` and `result`.

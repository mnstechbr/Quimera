# Troubleshooting

What a message means and what to do. Exit codes: `0` done, `1` failed or needs attention, `2` setup problem (not a repository, invalid checks file), `3` verification without evidence, `64` invalid command or option.

## Installer (`init`, `update`, `doctor`)

| You see | It means | Do |
|---|---|---|
| exit 64 and the help text | An unknown command, option or value; nothing was written | Fix the command; `quimera help` lists the options |
| `Quimera stopped:` … `Nothing was changed` | The manifest or a path is unsafe (outside the managed folders, a symbolic link, a malformed digest) | Fix or restore what is listed. A symlinked `.claude/skills` or `.agents` must become a real folder |
| `.quimera/manifest.json: not valid JSON` | The manifest was damaged | Restore it from git (committed mode), or reinstall in a copy and compare |
| `quimera.lock: another Quimera run is in progress` | A second run, or one that was killed | Wait; if nothing is running, delete that file and run again |
| `Quimera stopped while changing <file>` | A write failed mid-run (permissions, disk) | Fix the cause and run the same command again; it finishes what is left |
| `Not done:` … `commit-msg guard` | Another tool already owns the `commit-msg` hook | Add the Quimera guard to that hook by hand (see `.quimera/scripts/commit-msg`) |
| `doctor`: `problem offer` | A newer kit version waits beside a file you edited | Compare the two, keep one, delete the `.quimera-new` copy |
| `doctor`: `problem diverged` | A skill mirror (`.claude/skills/…`) differs from `.agents/skills/…` | Make them equal; tools would read different rules |
| `doctor`: `problem interrupted` | A previous run did not finish | Run `update` again |
| `doctor`: `note memory` | Local-only memory has no history, or unsaved changes | `node .quimera/scripts/memory.mjs init`, or `… save` |

## Git preflight

| You see | Do |
|---|---|
| `no commits yet` or `no default branch` | Create the default branch with a first commit (`project-kickoff` step 9) before any task branch |
| `<branch> is built on <other>, not merged` | Integrate the other branch first (`close-task` step 6), or confirm with the owner that stacking is intended |
| `docs/STATE.md was last updated N commits ago`, `says "Updated: …"`, `names branch …`, `has N lines` | Rewrite `docs/STATE.md` whole from the repository (`close-task` step 3) |
| `"Mode" must be discreet or open` or `"Git identity" must be "Name <email>"` | Fix the project profile in `AGENTS.md` or `.quimera/PROFILE.md` |
| `core.hooksPath points to … outside this repository` | The hooks folder is shared; add the guard by hand, or run `install-hooks.mjs --shared` on purpose |

## Verification

| You see | Do |
|---|---|
| `Result: unverified` with `no "test" script` or `no linter` | Add the script, or declare the project's checks in `.quimera/checks.json`, using `skip` with a reason for a check the project truly does not have |
| `no package.json and no .quimera/checks.json` | Declare the checks in `.quimera/checks.json` (template in `.quimera/templates/checks.json`) |
| `the test runner found no tests for these files` | Write the test, or say in the report that these files have none |
| `no check covers <files>` | Add a `build` script or a declared check that reads those files |
| `no base to compare with: running the full plan` | Expected without a default branch or remote; create the default branch to get the faster changed-files plan |

## After upgrading from 0.3.0

- `docs/plans/`, `docs/vision/`, `docs/studies/`, `docs/reviews/` now show in `git status` in local-only projects: commit them, or run `node .quimera/scripts/local-only.mjs --product-docs`.
- A manifest written on Windows by 0.3.0 is converted on the first `update`.
- `AGENTS.md` is never edited by `update`: ask your agent to add the "Working loop" and "Working with the owner" sections from `.quimera/templates/AGENTS.md`.

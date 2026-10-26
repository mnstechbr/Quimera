# Updates and recovery

How `quimera update` changes a project, and what to do when something goes wrong. The tests that hold this are `tests/update.test.mjs`, `tests/doctor.test.mjs` and `tests/installer-safety.test.mjs`.

## What a run does

1. **Checks before anything.** The manifest (`.quimera/manifest.json`) is validated as a whole, and every path the run may touch is checked on disk (no symbolic links, nothing outside the managed folders). Any problem stops the run with nothing changed.
2. **Plans.** Every change is decided first: `write` (new or updated kit file), `offer` (a newer kit version saved beside a file you edited, as `*.quimera-new`), `adopt` (your edit already equals the new version), `drop` (a stale offer), `remove` (a file the kit no longer ships, untouched by you). `--dry-run` prints this plan and stops.
3. **Locks.** `quimera.lock` in the git folder blocks a second run.
4. **Journals.** `quimera-update.json` in the git folder lists the planned changes while they are applied.
5. **Applies** the plan, then helpers (commit-msg guard, local-only exclusions) when `init` asked for them.
6. **Writes the manifest** whole to a temporary file and renames it, then removes the journal and the lock.

## Manifest

Schema 2 records what the project asked for (`desired`: tools, models, mode, local-only, specialists), what was installed (`installed`: kit version, source commit, the digest of every file as written), what waits for the user (`pending`: offers and orphans) and the commit-msg guard it installed (`hook`). A `null` in `desired` means the installer was not told, and the project profile decides. Manifests written by 0.3.0 are read as schema 2 and rewritten on the next update; keys written with backslashes on Windows are converted after the same path checks.

## When something goes wrong

| Situation | What you see | What to do |
|---|---|---|
| Invalid or crafted manifest | `Quimera stopped:` with each problem, `Nothing was changed` | Restore the manifest (from git in committed mode, or reinstall in a copy and compare), then run again |
| Another run in progress | `quimera.lock: another Quimera run is in progress` | Wait. If no run is active (one was killed), delete that file and run again |
| A write failed mid-run | `Quimera stopped while changing <path>` | Fix the cause (permissions, disk space), then run the same command again. Files already changed match the new kit and are adopted; the rest is finished |
| Run killed without a message | `doctor` reports `a previous run did not finish` | Delete `quimera.lock` if it is still there, then run `update` again |
| A `*.quimera-new` copy | `doctor` reports the offer | Compare it with your file, keep one version, delete the copy |
| An orphan | `doctor` notes a file the kit no longer ships that you edited | Keep it as your own file, or delete it |

The manifest is never half-written, but a multi-file update is not atomic: an interrupted run can leave some files on the new version and some on the old one until the next run. That state is always recoverable by running `update` again, and `doctor` says when it exists.

## Doctor

`quimera doctor` changes nothing. Its exit code reflects only the installation:

- **Problems** (exit 1): missing files, pending offers, skill mirrors that differ from `.agents/skills`, an interrupted run, unsafe paths, discreet mode without the guard, local-only files not excluded, the profile contradicting the installation.
- **Notes** (no effect on the exit code): edited files, orphans, a guard from an older kit, a newer kit available, no profile yet.

Work readiness (the git preflight) follows in its own section. `--json` returns both as one object.

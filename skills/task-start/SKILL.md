---
name: task-start
description: Use at the start of every task, before reading code or editing anything. Loads the project memory, picks the depth (trivial, small, normal, risky), checks git state and identity, and creates the branch for the work.
---

# Task start

Every task begins here. In a few minutes you should know what the project is, how deep this task goes, that git is in a safe state, and which branch the work lands on. Nothing gets edited before this skill finishes.

## 1. Load the memory, not the repository

Read, in this order:

1. `AGENTS.md` — the project profile (mode, identity, Quimera files, language, pushing rule), stack, commands, non-negotiable rules. If `.quimera/PROFILE.md` exists, the profile there wins.
2. `.quimera/QUIMERA.md` — the standard. Where it and `AGENTS.md` disagree, `AGENTS.md` wins.
3. `docs/STATE.md` — where the last session stopped, the next step, open questions.
4. `docs/MAP.md` — what lives where and how to run it.

Then load only the standards that match the files this task will touch: read the one-line entries in `docs/standards/INDEX.md` and open the matching `docs/standards/<area>/<name>.md` files (the Apply mode of `code-standards`). If the task touches something already decided, search `docs/DECISIONS.md` for it instead of reading the whole file.

Do not read the whole repository. Locate with search, read the relevant ranges, widen only when the task needs it. If the memory and the repository disagree, say so and follow the repository.

If `docs/STATE.md` lists open questions that block this task, ask them first.

## 2. Choose the depth

Pick the lowest level that fits (definitions in `QUIMERA.md`, "Depth") and state it with one line of reason.

| Depth | Typical shape | What follows |
|---|---|---|
| Trivial | Typo, config value, obvious one-line fix | change → `verification` → commit |
| Small | One area, one session, no risk | change → `verification` → `close-task` |
| Normal | Several files or a real feature | + `writing-plans`, `code-review` |
| Risky | Large, unclear, or touches a risk area | + `architecture-review` first, the user approves the plan, `code-review` on the strongest tier |

Risk raises the level even when the change is small. Risk areas: authentication, permissions, data isolation between users or tenants, the database schema, money, secrets, external integrations. A two-line change to a permission check is risky, not trivial.

If the request is too vague to choose a depth, ask one question with your recommended reading of it.

## 3. Git preflight

Run `node .quimera/scripts/git-preflight.mjs` in the foreground and read the whole output. Exit 0 means clean; exit 1 means something needs attention and the output says what.

If the script is missing or cannot run, use the equivalent commands and tell the user which ones you ran:

```
git fetch --prune
git branch --show-current
git symbolic-ref refs/remotes/origin/HEAD     # the default branch
git status --porcelain=v1 --branch            # ahead/behind, uncommitted, untracked
git worktree list
git config user.name ; git config user.email
```

Interpret the result before doing anything else.

**Not on the default branch.** Find out why before touching anything:

- Local branch behind its remote → update with `git pull --ff-only`. If that refuses, the branches diverged: stop and ask.
- Unpushed commits or uncommitted work → tell the user what is there. Never stash, reset, checkout or clean over someone's work; it may be another session's or the user's own.
- An existing feature branch for this same task → propose continuing on it and wait for the user's ok.
- Anything else → describe it and ask.

**On the default branch, behind the remote.** Run `git pull --ff-only`. If it refuses because the histories diverged, stop and ask.

**Identity mismatch.** If `user.name` or `user.email` differ from the identity in the project profile (`.quimera/PROFILE.md` or `AGENTS.md`), stop and fix it with the user before any commit. Set it in the repository only (`git config user.name …` and `git config user.email …`, without `--global`): the user works on several machines and projects with different identities.

**Another session active in this folder.** One session per working tree. Propose a separate worktree and ask first. Worktrees are optional, so if the user prefers, wait or work elsewhere. When you do create one:

- check that the target directory is ignored (`git check-ignore -q <dir>`); if it is not, ask the user before editing `.gitignore`;
- do not install dependencies or run the full test suite inside it on your own; ask, and run only what the task needs;
- remove it when the task ends (`close-task`).

### Quick reference

| Situation | Action |
|---|---|
| Clean, on default branch, up to date | Create the branch (step 4) |
| Default branch behind remote | `git pull --ff-only` |
| Default branch diverged from remote | Stop and ask |
| On another branch, behind its remote | `git pull --ff-only` on it, then find out why you are there |
| Unpushed commits or uncommitted changes | Tell the user; never stash, reset or overwrite |
| Feature branch for this same task exists | Continue on it, with the user's ok |
| Git identity differs from `AGENTS.md` | Stop; fix with repo-local config before any commit |
| Another session or worktree active here | Propose a separate worktree; ask first |
| Detached HEAD | Describe it and ask; do not commit on it |
| Preflight script missing | Run the equivalent commands; list them |

## 4. Create the branch

Name it `<type>/<short-kebab-description>`, in English:

- types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`;
- describe the change, not the tool: `fix/order-total-rounding`, `feat/csv-export`;
- never put tool or vendor names in it (no Claude, Codex, Copilot, GitHub, GPT, agent).

Create it from the up-to-date default branch: `git switch -c <name>`. Trivial changes get a branch too.

## 5. Discreet mode check

If the profile says `discreet`, the preflight reports whether the Quimera commit-msg guard is installed (it strips AI co-author and "generated with" lines; it lives in the repository's hooks folder, which may be set by `core.hooksPath`). If it is missing, run `node .quimera/scripts/install-hooks.mjs` with the user's ok. If another hook manager (for example husky) already owns `commit-msg`, the script stops: tell the user. Until the guard is in place, write commit messages without any such lines yourself.

Hooks are per clone, so on a new machine this check is the one that catches a missing hook.

## 6. Tell the user

One or two lines, in the user's language:

- the depth and why;
- the branch;
- what you will do next (the next skill, or the change itself for trivial and small work).

Example (to a Portuguese-speaking user): "Profundidade: normal (mexe em três telas e na API de pedidos). Branch `feat/order-export`. Próximo passo: plano em `docs/plans/`."

For normal and risky work, wait for the user to confirm your reading of the task before planning.

## Common mistakes

- Reading the codebase before the memory files, and missing a decision already recorded.
- Calling a change "small" because it is short, when it touches auth or the schema.
- Running `git stash` or `git checkout .` to "clean up" before starting.
- Committing before checking the identity on this machine.
- A branch named after the tool or the session instead of the change.

## Provenance

Original to Quimera. The isolation detection and the ask-before-creating-a-worktree consent are adapted from Superpowers `skills/using-git-worktrees/SKILL.md` (github.com/obra/superpowers, commit 2ce8aa1, © 2025 Jesse Vincent, MIT); the "smallest path that safely fits, risk pushes work up" routing comes from BMAD-METHOD by BMad Code, LLC (MIT), `skills/bmod-method/help/help.md` (commit 61e01f8). Changed: worktrees are optional, no auto-install or baseline runs, no `.gitignore` edits without asking, and git safety checks (fast-forward only, identity, never overwrite work) added.

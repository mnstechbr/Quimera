---
name: close-task
description: "Use at the end of every task, when the change is done and needs to be verified, cleaned up, recorded in project memory, committed, and possibly pushed; also when the user says a branch or pull request was merged."
---

# Close task

Finish a task so that any agent, on any computer, can pick it up from the repository alone: proven, clean, remembered, committed with the right identity, and pushed only with the user's agreement.

**Core principle:** never lose work and never leave a mess. Clean only what you created, never force-push, never delete anything that is not clearly yours without the user typing an explicit confirmation.

Track the steps in a checklist. Steps 1 to 5 always run; step 6 when the project integrates on this machine (no remote, or no pull requests); step 7 when there is something to push; step 8 only after a merge on the remote.

## 1. Verify

Use `verification`:

- Run the smallest checks that prove the last changes: `node .quimera/scripts/verify.mjs` (lint and types on changed files, related tests). Documentation-only changes need no code checks.
- If this closes a group of commits that is about to be pushed, run `node .quimera/scripts/verify.mjs push` once (full verify and build of affected packages).
- Run in the foreground, wait, read the result. If something fails, stop here and use `systematic-debugging`. Do not commit red work as if it were done.

## 2. Clean up

Remove only what you created during this task:

- temporary files, scratch scripts, debug logs and instrumentation (`console.log`, temporary prints);
- test data you inserted (rows, users, uploaded files) in local or test databases;
- servers, watchers and containers you started; stop them and confirm they stopped;
- worktrees you created for this task, once their work is committed (see "Worktrees" below).

Anything you are not sure you created (an untracked file, a container, a branch, a worktree): list it and ask the user. Never delete it on a guess.

## 3. Update project memory

Do this before committing, so memory and work land in the same commit. Record each fact in one place only, and keep every file short.

- **`docs/STATE.md`:** rewrite it whole. Now, last done (with how it was verified), next step, open questions with your recommended answer, branch and unpushed commits. No secrets.
- **`docs/MAP.md`:** update if the structure, commands, entry points or patterns changed.
- **`docs/DECISIONS.md`:** add a `D-NNN · YYYY-MM-DD · title` entry for each decision made during the task (decision, why, alternatives rejected, decided by). Never edit an old entry; a changed decision gets a new entry that names the one it replaces.
- **`docs/standards/INDEX.md`:** re-index if a standard was added or changed.
- **Anything else** worth knowing next time (a trap you hit, a non-obvious setup step): decide where it belongs among the files above. Do not create new memory files without a reason.

If `AGENTS.md` says the Quimera files are `local-only`, update them the same way; they stay out of the commit by design. Then save them in the private memory history, if the project has one: `node .quimera/scripts/memory.mjs save -m "docs: <what changed>"`.

## 4. Check identity and branch

Run `node .quimera/scripts/git-preflight.mjs` (or compare `git config user.name` and `git config user.email` with the identity in the project profile: `.quimera/PROFILE.md` if it exists, otherwise `AGENTS.md`).

- **Identity mismatch:** stop. Tell the user what is configured and what `AGENTS.md` expects, and give the exact commands to fix it for this repository (`git config user.name "…"`, `git config user.email "…"`). Do not commit until it matches. Never use a private no-reply address unless `AGENTS.md` names it.
- **On the default branch:** create a task branch (`feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`, `test/…`) before committing.
- **Other sessions or worktrees active:** do not touch their files.

## 5. Commit

- Stage only the files that belong to this task, by path. Read the staged diff (`git diff --cached`) once: no secrets, no `.env` files, no debug leftovers, no unrelated changes.
- Message in English, Conventional Commits: `feat: add order export`, `fix: reject empty tenant id`, `docs: record export decision`. Imperative, short subject; a body only when the why is not obvious.
- Small, focused commits; several local commits per task are fine.
- No tool or vendor names (Claude, Codex, Copilot, GitHub, GPT) in the branch or the message.
- **Discreet mode:** no co-author trailer and no "generated with" line. The commit-msg hook strips them, but check: `git log -1 --format=%B`. If one slipped through, fix the message with `git commit --amend`, which is allowed only because the commit has not been pushed. Never amend a pushed commit.
- **Open mode:** attribution lines are acceptable if the project wants them.

## 6. Integrate locally

When the project has no remote, or the user integrates on this machine, a finished task goes back to the default branch here. Without this step the next task starts on top of this one, and the default branch never receives anything. Integrate when the profile's "Integrating" line allows it; otherwise ask the user.

1. Only after step 1 passed for this task and step 5 committed everything: `git status --porcelain` prints nothing.
2. `git switch <default>`
3. `git merge --ff-only <branch>`. If it refuses because the default branch moved (another task was integrated first), tell the user and merge with `git merge --no-ff <branch>`. Never rebase, reset or force.
4. Delete the integrated branch with the safe form: `git branch -d <branch>`.
5. Run `node .quimera/scripts/git-preflight.mjs` and read it: no stacked branches, clean tree.

## 7. Push (only with the user's agreement)

1. Ask the user whether to push now, unless `AGENTS.md` grants standing permission (and the work is inside its scope). Recommend pushing when the commits form a complete subject; recommend waiting when more commits on the same area are coming, so they go up together.
2. Make sure `node .quimera/scripts/verify.mjs push` passed on the exact tree being pushed.
3. Push with the project identity: `git push -u origin <branch>`.
4. **The push cannot run from here, or the user prefers to push it themselves** (no credentials, a remote or cloud environment in a discreet project, the user asked for the commands): do not push. Give the user, ready to copy:
   - the branch name;
   - the command: `git push -u origin <branch>`;
   - optionally a pull request title (English unless the project says otherwise, Conventional Commits style) and a plain description:

     ```
     ## Before
     <how it behaved or what was missing>

     ## After
     <what changes for the user; how it was verified>
     ```
5. **Push rejected:** the remote moved. Fetch, look at what changed, and tell the user. Never force-push, never rewrite published history, unless the user explicitly asks for that exact operation.

## 8. After the merge

Only when the user says the branch or pull request was merged:

1. Confirm there are no uncommitted changes you would lose.
2. Switch to the default branch: `git switch <default>`.
3. Update it: `git pull --ff-only`. If it refuses, stop and tell the user; do not merge or reset on your own.
4. Delete the merged local branch with the safe form: `git branch -d <branch>`. If git refuses because it sees unmerged commits (common after a squash merge), explain why, show the commits, and delete with the forced form only after the user types an explicit confirmation such as `delete <branch>`.
5. Remove the task's worktree if you created one.
6. Update `docs/STATE.md` if the merge changed what is next (commit it on the next task's branch, not on the default branch).

### Worktrees

- Remove only worktrees you created for this task, from outside the worktree: `git worktree remove <path>`, then `git worktree prune`.
- If removal is refused because of modified or untracked files, those files exist nowhere else. Show them (`git -C <path> status --porcelain -uall`) and ask: commit them, move them, or delete them. Deleting needs the user's typed confirmation. Never add `--force` on your own.
- Leave worktrees managed by the tool or by another session alone.

## 9. Report to the user

In the user's language, short and plain:

- **What changed:** one to five lines, in terms of behavior, not files.
- **How it was verified:** command → result.
- **Pending:** what is left, open questions, Minor review findings recorded.
- **Git:** branch, commits (subject lines), integrated into the default branch or not, pushed or not; if not pushed, the exact push command.
- **Next step:** one concrete action.

If the work was large and the tool can produce one, offer an interactive HTML report.

## Common mistakes

- Committing before updating `docs/STATE.md`, leaving memory one commit behind.
- `git add -A` sweeping in scratch files, `.env` or another session's work.
- Deleting "stale-looking" branches, worktrees or containers that someone else owns.
- Pushing because the work "looks done" without asking.
- Answering a rejected push with a force-push.
- Leaving a finished branch unintegrated in a project without a remote, so the next task stacks on it.

## Provenance

Original to Quimera. Safety rails (verify on the tree being integrated, never force-push, typed confirmation before deleting, clean only what you created, refused worktree removal means unique files) adapted from `skills/finishing-a-development-branch/SKILL.md` in [obra/superpowers](https://github.com/obra/superpowers), commit 2ce8aa1, © 2025 Jesse Vincent, MIT License.

# Workflow contract

One next action for each situation the pilots showed going wrong, and where the rule is written. If a skill or `QUIMERA.md` changes one of these rules, change this table in the same commit; `tests/workflow.test.mjs` checks its shape and that the rules it points to are still there.

| Scenario | Next action | Written in |
|---|---|---|
| Long session: the owner asks for the tenth change in a row | Treat it as a new task: depth and branch first (`task-start`), after closing the previous one (`close-task`) | `AGENTS.md` working loop, items 1 and 4 |
| Context compacted in the middle of a task | Re-read `AGENTS.md`, `docs/STATE.md` and `docs/MAP.md`, then resume the current step | `AGENTS.md` working loop, item 5; `QUIMERA.md` "Project memory" |
| Second rejection by the owner of the same delivery | Stop patching and rethink with `systematic-debugging`, or `study-round` when the design or approach is the problem, before a third delivery | `QUIMERA.md` "Verification" |
| Third rejection by the owner of the same delivery | Stop and bring it to the owner with what was tried | `QUIMERA.md` "Verification" |
| End of a phase or milestone | Run `code-review`, then the whole of `close-task` | `AGENTS.md` working loop, item 6; `code-review` description |
| About to send a build, a demo or a link to the owner | Run `code-review` first | `code-review` description and depth table |
| A device build before the owner approved the screens | Show the approved screens or prototype first; build after the approval | `QUIMERA.md` "Costly actions" |
| A server or emulator started for a check | Stop it when the check ends | `QUIMERA.md` "Costly actions" |
| `verify.mjs` or the preflight says `docs/STATE.md` is stale | Rewrite it whole from the repository before continuing | `close-task` step 3; `task-start` quick reference |
| A finished task branch in a project with no remote | Integrate it into the default branch (`close-task` step 6) before the next task | `close-task`; `task-start` step 4 |
| `verify.mjs` ends `unverified` | Make the missing check runnable, or report it as not verified with the reason | `verification` "The two commands" |
| Something learned about how the owner works | Write it in `AGENTS.md`, not only in a tool's private memory | `QUIMERA.md` "Project memory" |
| A non-technical owner, and a technical choice comes up | Decide it yourself and say in one plain line what you chose and why | `QUIMERA.md` principle 2; profile "Owner" |
| A game (or any other product type) at project start | Run `vision-review` with the core categories and that type's set | `vision-review`; `references/categories.md` |
| Another workflow skill pack or plugin is installed | Follow `AGENTS.md`, then `QUIMERA.md`, and tell the owner once which workflow you follow | `QUIMERA.md` "Other skills and plugins" |
| Design directions for a game or a visual showcase | Start from the owner's references and real assets, never placeholder art | `design-directions` step 1 |
| A read-only review or question ("look at this", "what do you think?") | Answer it; no branch, no commit, no files changed | `task-start` (it starts changes only) |
| A typo or a one-line fix | Trivial depth: branch, change, verify, commit | `QUIMERA.md` "Depth" |
| A two-line change to a permission check | Risky depth: `architecture-review` first, the plan approved, `code-review` on the strongest tier | `QUIMERA.md` "Depth" |
| Third failed attempt at the same failure, or a blocking review finding after round 3 | Stop the dependent work and bring it to the user with what was tried | `QUIMERA.md` "Verification"; `parallel-agents` step 6 |
| No independent reviewer available | Give the user the review brief to run in another session; label any review of your own as self-review (not independent) | `code-review`; `parallel-agents` "Without subagents" |
| A branch for this same task already exists | Continue on it after the user's ok | `task-start` step 3 |
| `AGENTS.md` belongs to someone else's repository and cannot be edited | Keep the profile in `.quimera/PROFILE.md`, which wins | `QUIMERA.md` "Project profile"; `project-kickoff` existing projects |
| The project keeps its own memory files elsewhere | Use the files the profile's "Memory" line names | `QUIMERA.md` "Project memory" |
| An approved plan covers the next task | Start it without asking again; ask only for irreversible or outside steps | `QUIMERA.md` "After the approach is agreed" |
| Planning is done and building starts | Switch the session to the standard tier; reviews go to the strongest | `QUIMERA.md` "Roles, model tiers and effort"; the tool's adapter |

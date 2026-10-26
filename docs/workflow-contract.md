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

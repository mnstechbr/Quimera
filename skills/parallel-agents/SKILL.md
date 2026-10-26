---
name: parallel-agents
description: "Use to execute a plan from writing-plans, or any set of independent problems, by dispatching subagents: one fresh implementer per task, parallel only when tasks touch disjoint files, a reviewer per task, and a final review of the whole branch. Also covers inline execution when the tool has no subagents."
---

# Parallel agents

You are the coordinator. You split the work, write each subagent's brief, review what comes back, commit, and keep the ledger. Subagents get exactly the context they need, never your conversation history, which keeps them focused and keeps your own context free for coordination.

Use it for a plan with several tasks, especially `[P]` tasks, or for several independent problems (different failing test files, unrelated bugs). Do not use it for tightly coupled work, exploratory debugging where nobody knows what is broken yet (`systematic-debugging` first), or a change small enough to just do.

## Rules that do not bend

- **Never two agents on the same file, migration or module** at the same time. Coupled work runs sequentially.
- **Parallel implementers only for disjoint files.** A wave is a set of `[P]` tasks whose file lists do not overlap, including shared config, lockfiles, route tables and index files.
- **Subagents never run git commands that write** (commit, push, branch, switch, stash, reset, checkout, clean, add). Only you commit.
- **Subagents never dispatch subagents.** Review comes from you, after the report.
- **Always state the tier** when dispatching (fast / standard / strongest, as in `QUIMERA.md`). A dispatch with no tier silently inherits your session's model, usually the most expensive.
- **The subagent's report is a claim.** Check the diff yourself before accepting it (`verification`).

## Tiers per role

| Role | Tier |
|---|---|
| Search, read, locate, run a verbose command and report | fast |
| Implement a well-specified task, write its tests | standard |
| Task review of a small mechanical diff | standard |
| Task review of risky code, final review, hard problems, fix round after two failures | strongest |

Effort follows `QUIMERA.md`: low for fast, medium for standard, high for strongest; the highest level below "max" only for genuinely complex work. Turn count beats token price: the cheapest models often take two or three times the turns on multi-step work, so use standard as the floor for implementers working from prose and for reviewers. Fast suits a task whose plan text already contains the exact change. In the economic model profile, tiers resolve as QUIMERA.md "Model profile" says: every review uses the strongest tier, and a round-3 fix one tier up needs the user's ok.

## Setup

1. Read the plan once, its Global Constraints, and the spec it links. The spec is the authority; the plan argues from it.
2. **Ledger.** Track progress in `docs/plans/<slug>.ledger.md`, not only in memory: context compaction erases memory, and coordinators who lost their place have re-dispatched whole sequences of finished tasks. First line: `# Ledger — plan: docs/plans/<file>.md`. If the ledger already exists and names this plan, read it and resume at the first task without a `complete` line; trust the ledger and `git log` over your recollection.
3. **Scratch.** Keep briefs, reports and review packages in a scratch directory outside the repository (the tool's scratch area or a temp folder). Record its path in the ledger. Hand artifacts to subagents as file paths; anything pasted into a dispatch, or printed back, stays in your context for the rest of the session.
4. **Preflight scan.** Before the first dispatch, write a table to the ledger: one row per pair of tasks that share a file or an interface (what one produces, what the other consumes, any conflict), and one row per `[P]` task confirming its files are disjoint from the rest of its wave. Rule on every conflict now.
5. **Worktrees are optional.** Parallel implementers can share the working tree because their files are disjoint. Use a separate worktree only if the user wants one or another session is active (`task-start`).

## Waves

Group the plan into waves: each wave is either one sequential task or a set of `[P]` tasks from the same phase with disjoint files. Dispatch every task in a wave together, in the same turn. Start the next wave only when the current one is reviewed and committed.

**Batch small same-shape work.** Several tiny edits of the same kind across files (the same constant, the same one-line fix) go to one implementer in one brief, reviewed as one diff.

## The task loop

1. **Brief.** Fill `references/implementer-brief.md` into a file in scratch: goal, files it owns, files it must not touch, interfaces in and out, Global Constraints, done criteria, verification command, report path, what to return. Copy the task's exact values from the plan; never make a subagent read the whole plan or the history of earlier tasks. Carry rulings and parked findings that affect this task.
2. **Dispatch** the implementer (tier: standard, unless the table above says otherwise). Record its identity so fix rounds can resume it.
3. **Handle the report.**
   - `DONE` → step 4.
   - `DONE_WITH_CONCERNS` → read the concerns; correctness or scope concerns get resolved before review, observations get noted.
   - `NEEDS_CONTEXT` → supply what is missing and resume it.
   - `BLOCKED` → change something: more context, a higher tier, a smaller task, or a ruling that corrects the plan. Never re-dispatch the same thing unchanged.
4. **Review package.** Write the task's diff to a scratch file, limited to the files it owns: `git diff -U10 -- <owned files>` plus the full content of each new untracked file. In a parallel wave this keeps each reviewer on its own task.
5. **Review.** Dispatch a reviewer with `references/reviewer-brief.md`: brief path, report path, package path, Global Constraints. It returns two verdicts, spec compliance and quality. Both are required; never skip the review, and never pre-judge findings in the brief ("do not flag X").
6. **Fix loop** when the review has a spec gap or a Critical/Important finding. Minor findings go to the ledger as `T<id>: minor (deferred): …` and never enter the loop. Each round is one fix plus one scoped re-review (same reviewer brief, re-review section, diff since the last reviewed state).
   - Rounds 1–2: resume the same implementer with the findings verbatim.
   - Round 3: a fresh implementer one tier up, with the brief, the report file and the findings ("two attempts failed; read the report for what was tried").
   - After round 3 the loop stops, as the failure budget in `QUIMERA.md` says. A Critical or Important finding still open blocks this task and every task that builds on it: stop those, and bring it to the user with what the three rounds tried. Tasks that do not depend on it may go on. Only Minor findings are parked (`T<id>: parked — <finding> — Ruling: …`).
   - Do not fix findings yourself in the coordinator session; it skips review.
7. **Commit.** Check the diff yourself, then stage only the task's files and commit with the plan's Conventional Commit message. In discreet mode the message carries no tool names or AI trailers.
8. **Ledger line:** `T<id>: complete (<commit7>, review clean)` or `(<commit7>, <k> parked)`.

## Rulings

A running plan does not stop for every ambiguity. Decide it: the spec binds, the plan argues, your judgment settles the rest. Record each decision in the ledger as

`Ruling: <what you decided> — <why> — <what it costs if wrong>`

and keep going. Stop and ask the user only for the cases in `QUIMERA.md` ("Stop and ask only when"): a genuinely ambiguous product choice, an architecture trade-off without evidence, possible data loss, an irreversible or external action, or a needed credential, permission or cost.

## Waiting

While subagents work, keep doing local work (ledger, next brief, next package). When idle, wait in bounded stretches and, between them, check which subagents finished without reporting. Do not poll in tight loops.

## Final review and finish

1. When every task is complete, write the whole-branch package (`git diff -U10 $(git merge-base <default> HEAD)..HEAD` plus `git log --oneline` for the range) to scratch.
2. Dispatch one final reviewer (tier per the `code-review` depth table: standard for normal depth, strongest for risky) with `references/final-reviewer-brief.md`, pointing it at the plan, the spec and the ledger's deferred and parked lines. It uses the lenses and finding shape of `code-review`, so it counts as that skill's review before the push, including the strongest-tier review when the depth is risky. If the branch touches an enabled specialist area (`code-review`, "Specialist reviewers"), dispatch the matching specialists in the same turn, each with `code-review`'s `references/reviewer-brief.md` for the whole-branch range (base = the merge-base), the plan and spec paths, its block, and the role "Answer only your specialist block". Here the final reviewer is not replaced: it keeps the plan and ledger view, stays the lead, and its brief lists the specialists running alongside it. Per-task reviews do not use specialists. In the scoped re-review, a specialist's findings go back to that specialist's block.
3. Weigh the findings as `code-review` Part 2 describes (check each against the code), then send the accepted ones to one fix implementer as a complete list, followed by one scoped re-review (per reviewer kind, when specialists ran). No second fix wave: a Critical or Important finding still open after it goes to the user before the push; Minor ones are listed in the report.
4. Run `node .quimera/scripts/verify.mjs push` once, in the foreground, and read the result. Implementers only ever ran the small `verify.mjs`.
5. Report to the user, in their language: what was built, verification (commands and counts), every ledger line containing `Ruling:` in the order made with its cost if wrong, parked findings, what remains. Summarize; do not paste subagent reports.
6. Hand over to `close-task` (memory, push with the user's agreement). The ledger is a working file; `close-task` decides whether it stays.

## Without subagents

If the tool cannot dispatch subagents, or the user chose inline execution, execute the plan yourself task by task with the same discipline: same ledger and preflight scan, one task at a time in plan order, its verification command after each task, a review of the task's diff against the brief, recorded as self-review (not independent) before committing, one commit per task. At the end, the final review must be independent at Risky depth: give the user the filled `references/final-reviewer-brief.md` to run in a separate session on the strongest tier (ideally another tool or model) and wait for its findings. At Normal depth you may run it yourself, and the report calls it a self-review (not independent). Then `verify.mjs push`.

## Common mistakes

- Two parallel implementers touching the same index or migration folder "just to register" something.
- Letting an implementer commit, or create its own branch.
- Dispatching without a tier.
- Accepting "all tests pass" from a report without reading the diff.
- Pasting earlier tasks' summaries into every new brief.
- Forwarding raw subagent reports to the user.

## Provenance

Adapts Superpowers `skills/subagent-driven-development/` (SKILL.md, implementer-prompt.md, task-reviewer-prompt.md, re-review-prompt.md, references/) and `skills/dispatching-parallel-agents/SKILL.md` (github.com/obra/superpowers, commit 2ce8aa1, © 2025 Jesse Vincent, MIT); the inline fallback replaces upstream `executing-plans`. Changed: parallel implementers allowed on disjoint files, worktrees optional, only the coordinator writes to git, smallest verification per task and `verify.mjs push` once, tiers instead of model names, three-round fix cap aligned with Quimera's two-failure rule, ledger in `docs/plans/`, no bundled scripts.

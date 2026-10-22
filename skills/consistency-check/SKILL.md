---
name: consistency-check
description: Use when work was planned from a vision, plan or design document and you need to know whether the documents agree with each other (before implementing) or whether the code does what they say (after implementing, before calling the work done).
---

# Consistency check

Documents drift apart and code drifts from documents. This skill finds where, explains each gap in plain words, and turns code gaps into tasks. It does not fix anything itself.

**Core principle:** read-only judgment, backed by evidence. A checked box, a "done" in `docs/STATE.md` or a commit message is a claim, not evidence; only the code and the documents themselves count.

## Two modes

| Mode | Question | When | Writes |
|---|---|---|---|
| **Docs** | Do the documents agree with each other? | After a plan is written, before implementing | Nothing |
| **Code** | Does the code do what the documents say? | After implementing a plan, before `code-review` / `close-task` | Appends a convergence section to the plan, only if there are gaps |

If the user did not say which, pick by timing and say which mode you picked.

## Sources of intent

Read only what exists, and only the parts that carry obligations:

- `AGENTS.md`: non-negotiable rules and principles. These win any conflict.
- `docs/VISION.md`: what the product must do and for whom, plus dated review answers.
- `docs/plans/<date>-<slug>.md`: the plan under check (ask which one if several are open), its requirements, acceptance criteria, named files and tasks.
- `docs/DECISIONS.md`: decisions in force. A newer entry that names an older one replaces it; that is not a conflict.
- `docs/DESIGN.md` and `docs/EXPERIENCE.md`: visual system, flows, states and copy, when the work has a UI.

A missing document is a finding only if the work needed it (for example, a UI plan with no `EXPERIENCE.md`). Never invent the content of a missing section.

## Roles

- **Gather** (subagent, tier: fast): extract the requirement inventory from the documents and, in Code mode, locate the code for each requirement. It reports locations and quotes, not verdicts.
- **Judge** (you or a subagent, tier: strongest): decide what is a real gap, its type and severity, and write the explanation.

Neither role edits code or documents.

## Steps

1. **Build the inventory.** One stable key per obligation: plan requirement or acceptance criterion (use the plan's own IDs when present), vision item that requires buildable work, decision in force, `AGENTS.md` rule or principle, design or experience rule. Leave out outcome goals that no code can satisfy ("increase sign-ups").
2. **Run the passes for the mode** (below).
3. **Assign severity:**
   - **Critical:** breaks an `AGENTS.md` rule or principle, or blocks the core of the plan.
   - **Important:** a core requirement is missing, conflicting or untestable; a vague security or performance requirement.
   - **Minor:** terminology drift, a secondary requirement partly met, an unclear edge case, unrequested code with unclear reason.
   Wording, minor redundancy and low-risk extras are also **Minor**; mention them only as a count unless the user asks.
4. **Cap the list at 50 findings,** highest severity first; summarize the rest by type and count. Give each finding a stable ID (`D1`, `D2`… in Docs mode, `C1`, `C2`… in Code mode) so a re-run on unchanged files gives the same IDs.
5. **Explain each finding in plain words:** what the documents say, what was found, why it matters to the user. Avoid jargon; one or two sentences.
6. **Report and hand off** (below).

## Docs mode: passes

- **Duplication:** two requirements say almost the same thing. Point to the clearer one.
- **Ambiguity:** vague words without a measure ("fast", "secure", "intuitive", "scalable"); placeholders left (`TODO`, `???`, `{{…}}`).
- **Underspecification:** a requirement with no object or no measurable outcome; a story without acceptance criteria; a task naming files or components no document defines.
- **Principle conflicts:** anything in the plan, vision or design that contradicts an `AGENTS.md` rule or principle or a decision in force. Always Critical. The fix is to change the plan, or to record a new decision with the user; never to quietly reinterpret the rule.
- **Coverage gaps:** requirements with no task; tasks that map to no requirement; security, performance or availability goals with no task.
- **Inconsistency:** the same concept named differently across files; an entity in the plan missing from the vision or vice versa; tasks ordered before what they depend on; two documents that demand incompatible things.

## Code mode: passes

1. **Map the scope.** From the files the plan names, plus a search for the concepts each requirement describes. Stay inside what the documents define.
2. **Check every inventory item against the current code,** including tasks marked done. Run the existing tests that cover an item if reading is not enough, and read the result. For a chain of corrective tasks, judge the resulting behavior, not the superseded steps.
3. **Classify each gap:**
   - **missing:** the work is absent.
   - **partial:** it exists but does not fully satisfy the requirement.
   - **contradicts:** the code does something the documents or a rule forbid.
   - **unrequested:** code no document asked for. Flag it for a decision; do not propose deleting it on your own.
4. **Record evidence** for each: `file:line` observed, test run and result, or the search that found nothing.

## Report and hand-off

Tell the user, in their language:

- Mode, documents read, how many obligations were checked.
- Findings grouped by severity: ID, type, where, the plain-words explanation, and the recommended fix.
- Counts by type and severity.
- Next step:
  - Docs mode with Critical or Important findings: recommend fixing the documents before implementing; offer to draft the edits and wait for the user's approval before changing any document. Conflicts with a decision need a new `docs/DECISIONS.md` entry agreed with the user.
  - Docs mode with only Minor findings: the user can proceed; list the improvements.
  - Code mode with gaps: append the tasks (below) and recommend implementing them, then running Code mode again.
  - Code mode with no gaps: say the code matches the documents and recommend `code-review` or `close-task`.

### Appending tasks to the plan (Code mode only)

This is the only write the skill makes, and only when there is at least one actionable gap.

- Append at the end of the plan a section `## Convergence <YYYY-MM-DD>`.
- One task per gap, Critical first, in the plan's existing task format and numbering: `- [ ] T<NNN> <imperative description> — <source ref> (<gap type>, <severity>)`, numbered after the plan's highest task id.
- For `unrequested` gaps the task is "decide with the user: keep and document, or remove".
- Never rewrite, renumber, reorder or delete existing tasks or earlier convergence sections. Never touch the vision, decisions, design or code.
- With no gaps, leave the plan byte-for-byte unchanged: no empty section.

## Common mistakes

- Trusting checked boxes or `STATE.md` instead of reading the code.
- Treating a newer decision that replaces an older one as a conflict.
- Fixing the code or the documents during the check.
- Reporting raw IDs and categories without saying why the user should care.
- Expanding the scope beyond what the documents define.

## Provenance

Adapted from `templates/commands/analyze.md` and `templates/commands/converge.md` in [github/spec-kit](https://github.com/github/spec-kit), commit 27d14e2, © GitHub, Inc., MIT License. Changed: merged into one skill with Docs and Code modes, pointed it at Quimera's memory files instead of spec/plan/tasks and the constitution, removed prerequisite scripts and extension hooks, added fast/strongest roles and plain-words explanations.

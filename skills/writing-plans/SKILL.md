---
name: writing-plans
description: Use for normal or risky work, after task-start (and architecture-review when risky), before touching code. Turns an agreed goal or spec into a task-by-task plan with exact files, interfaces, verification commands and parallel-safe markers.
---

# Writing plans

Write the plan for an engineer who knows the language well but has never seen this codebase or this spec. They can write idiomatic code once they know the exact interface and the exact check. What they cannot know is what you decided: which files, which names and signatures, which values from the spec, which command proves each task. The plan records those decisions and nothing more.

Save it to `docs/plans/<YYYY-MM-DD>-<slug>.md` (English, kebab-case slug).

## Before writing

- Agree the goal with the user first (`QUIMERA.md`, principle 1). If there is a spec, vision section or study, the plan argues from it; link it.
- Scope check: if the work covers several independent subsystems, propose one plan per subsystem. Each plan should leave the project working and verifiable on its own.
- Read the standards that match the files you will touch (`docs/standards/INDEX.md`) and the decisions the work depends on (`docs/DECISIONS.md`).

## Map the files first

List every file that will be created or modified and what each is responsible for. Decomposition is decided here.

- One clear responsibility per file, with a narrow interface. Focused files are easier to reason about and edit reliably.
- Files that change together live together; split by responsibility, not by layer.
- In an existing codebase, follow its patterns. Propose a split only for a file you must change that has become unwieldy.

## Right-size the tasks

A task is the smallest unit that carries its own check and is worth a separate review. Fold setup, configuration and docs into the task whose deliverable needs them. Split only where a reviewer could reasonably reject one part while approving its neighbour. Each task ends with something independently verifiable.

## Plan document

````markdown
# <Feature> plan

**Goal:** <one sentence>
**Depth:** normal | risky
**Spec:** <path to spec / vision section / study, or "agreed in conversation on YYYY-MM-DD">
**Approach:** <2–3 sentences>
**Branch:** <type/short-description>

## Global Constraints

<Project-wide requirements every task must honour, one line each, exact values
copied from the spec, AGENTS.md or standards: versions, naming, copy, limits,
security rules. Every task implicitly includes this section.>

## Review Focus

<Up to five inputs or failure modes the spec implies but no task's checks
exercise, most likely to bite a real user first: "empty CSV → clear message,
not a crash". Write each line, then add its test to the task that owns the
code. Write "None found" only after checking.>

## Phase 1: Setup
- [ ] T001 <description> in `path/to/file`
## Phase 2: Foundation
- [ ] T002 [P] ...
## Phase 3: <Story or slice 1>
...
## Phase N: Polish
...

## Commits
<Planned Conventional Commit messages, grouped by task or phase.>
````

Phases run in order: Setup → Foundation (blocks everything after it) → one phase per story or slice, in priority order, each independently verifiable → Polish. Small plans may collapse phases; keep the order.

### Task format

Each task is one checklist line followed by its detail block:

````markdown
- [ ] T004 [P] Add CSV serializer in `src/export/csv.ts`

  **Files:** create `src/export/csv.ts`; test `src/export/csv.test.ts`
  **Interfaces:**
  - Consumes: `Order` from `src/orders/types.ts` (T002)
  - Produces: `toCsv(orders: Order[]): string` — header row first, RFC 4180 quoting
  **Steps:**
  1. Write `csv.test.ts`: "quotes fields with commas", "empty list → header only".
  2. Implement `toCsv` with the signature above.
  **Verify:** `node .quimera/scripts/verify.mjs` → exit 0; the two new tests pass.
  **Commit:** `feat: add CSV serializer for orders`
````

- `T001`, `T002`… are sequential in execution order.
- `[P]` means the task can run in parallel with the other `[P]` tasks of the same phase. Mark it only when the task touches files no other task in that phase touches (including migrations, shared config, lockfiles and barrel/index files) and does not consume anything an unfinished task produces. When in doubt, leave it off.
- Every task names exact paths. "Update the API" is not a task.
- **Interfaces** is how an implementer who sees only their own task learns the names and types the neighbouring tasks use. Exact signatures, not prose.
- **Verify** names the smallest command that proves this task (see `verification`): a single test file, a type check, a query on a disposable database. The full suite and build run once before the push, not per task.
- **Commit** uses Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`), in English, no tool or vendor names.

### Tests

- Test-first is the method when the task, the user or the project (`AGENTS.md`, standards) asks for it. Then the test step comes first and the plan states the expected failure.
- A bug fix always includes a regression test that fails before the fix and passes after. Say so in the task.
- Otherwise include the tests that prove the task's behaviour, plus one per Review Focus line. Tests never call paid external APIs; plan a fake or a recorded response.

### What a step contains

A step is done when the implementer can write exactly one reasonable thing from it.

- A test step: the test's name and its assertions, with the spec's exact values.
- A code step: the signature, the file, and the values the spec pins. The implementer writes the body. Write a body only for an algorithm the signature and tests do not determine, or for exact copy the spec fixes.
- A verification step: the command and what passing looks like.
- A reference to another task: point to its Interfaces block; do not repeat its code.

**Economic model profile** (QUIMERA.md, "Model profile"): the implementer is the small model, so go one step further. Keep each task to one or two files, write the body for any logic beyond a direct call or a mapping, and name the existing function or file to copy the pattern from.

Lines that decide nothing ("handle edge cases", "add validation", "TBD", a type no task defines) are gaps. Function bodies the signature and tests already determine are transcripts. Both are defects, except that in the economic profile transcripts are allowed (above); gaps never are.

## Self-review

Run this yourself after writing, with the spec open. Fix problems inline.

1. **Coverage.** Every requirement in the spec maps to a task. Add tasks for gaps.
2. **Step scan.** No step decides nothing; no step dictates what the signature already determines.
3. **Names and types.** Signatures used in later tasks match those defined earlier (`clearLayers()` in T003 and `clearAllLayers()` in T007 is a bug).
4. **Parallel markers.** For each `[P]` task, confirm no other task in its phase touches the same file, migration or module.
5. **Review Focus.** Each line has a test in the owning task.
6. **Proportion.** If the plan is several times longer than the spec, or code blocks make up most of it, it has become the code. Replace bodies with signatures and assertions.

## Approval and handoff

- **Normal depth:** show the user the plan path and a three-line summary. They may skip the approval; if they say "go", go.
- **Risky depth:** the user approves the plan before any code is written. Wait for it.

Then offer how to execute, with a recommendation and one line of why:

- **`parallel-agents`** — when the plan has `[P]` tasks or enough independent tasks that fresh implementers and per-task reviews pay off.
- **Inline** — you execute the tasks yourself in order, with the same ledger and checks (the fallback described in `parallel-agents`). Better for short or tightly coupled plans.

Example message (Portuguese user): "Plano salvo em `docs/plans/2026-10-22-order-export.md`: 7 tarefas, 3 podem rodar em paralelo. Recomendo `parallel-agents`, porque T004–T006 mexem em arquivos separados. Posso seguir?"

## Common mistakes

- Marking tasks `[P]` that both edit the same router, migration folder or index file.
- "Run all tests" as every task's verification.
- Writing the whole implementation into the plan.
- Skipping the regression test for a bug fix.
- Starting a risky plan before the user approved it.

## Provenance

Adapts Superpowers `skills/writing-plans/SKILL.md` (github.com/obra/superpowers, commit 2ce8aa1, © 2025 Jesse Vincent, MIT) and Spec Kit `templates/tasks-template.md` and `templates/commands/tasks.md` (github.com/github/spec-kit, commit 27d14e2, © GitHub, Inc., MIT). Changed: plans live in `docs/plans/`, Spec Kit's `T001 [P]` line format and phases wrap Superpowers' Interfaces/Global Constraints/Review Focus, test-first only when asked (regression tests always for bugs), smallest verification command per task, approval required only at risky depth, Conventional Commits.

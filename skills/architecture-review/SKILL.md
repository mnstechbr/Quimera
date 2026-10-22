---
name: architecture-review
description: Use before the first code of a project, for every new feature, and for anything touching auth, permissions, data isolation or multi-tenancy, database schema or queries at scale, money, secrets or external integrations. Also use when the user asks "does this make sense?" about a design.
---

# Architecture review

Check whether a design is sound before code locks it in, and fix the few decisions that keep separately built parts consistent. You act as a senior reviewer for an engineer who is still learning: the reasoning matters as much as the verdict.

Run this skill on the strongest tier with high effort. It produces decisions, not code.

## The core test

For every structural question, ask:

> If two parts of this system were built independently (by two agents, two sessions, or two people), could they choose incompatibly?

Record a decision only when the answer is yes, the right choice is not obvious, and there is a real trade-off. Everything else is either already decided by the stack and the code, or goes under **Deferred** with the reason it can wait. This keeps the decision list short and every entry enforceable.

## Scope

- **Project start:** the whole system. Cover every lens, including deploy and operations.
- **New feature:** only the slice the feature touches, plus every existing decision it might bend.
- **On demand ("does this make sense?"):** review what the user shows you. Do not expand into a full architecture unless they ask.

Say which scope you picked before you start.

## Before you start

1. Read `AGENTS.md` (principles and non-negotiable rules), `docs/VISION.md`, `docs/MAP.md` and `docs/STATE.md`.
2. Search `docs/DECISIONS.md` for entries on the areas involved. Existing decisions bind you: a new decision that weakens or contradicts one is a conflict to raise with the user, never a silent override.
3. On an existing codebase, read the code the design touches. Ratify the conventions already there instead of inventing new ones, and do not tell the user what the code already shows.
4. Read `docs/standards/INDEX.md` and open only the standards that match the area.
5. Restate in two or three lines what you are reviewing and what question it must answer. Confirm it with the user.

## Working mode

Use coaching unless the user asked for fast, or chose fast for this project before (record that choice in `AGENTS.md` principles). Do not ask about the mode on every review:

- **Coaching (default).** Work it out together. Ask open questions ("how are you thinking about tenant isolation?") rather than quizzes. For load-bearing calls (paradigm, stack or starter, major boundaries, data ownership) show the realistic alternatives you weighed, which one you lean towards and why, and let the user choose.
- **Fast.** You draft everything and tag each guess `[ASSUMPTION]`; the user corrects in review.

At the first review of a project, ask once what the result is for. A decision list is the default. If the user also needs something to explain the design to someone else, plan that output now, not as an afterthought.

On a greenfield or small project where the stack is open, recommend a well-known current starter: it settles a coherent block of decisions for free.

## Steps

Track progress in a checklist.

1. **Principles gate (before).** List the principles and non-negotiable rules from `AGENTS.md` and the goals in `docs/VISION.md`. Check the proposal against each. A violation either changes the design or must be justified in the complexity table (step 5). An unjustified violation stops the review.
2. **Unknowns.** Mark every unknown as `NEEDS CLARIFICATION`. Resolve each one by asking the user (one question at a time) or by research. Record research results as **Decision / Rationale / Alternatives considered**.
3. **Verify, do not recall.** For every named library, framework, service or version, check the current version and fit against the project's lockfile, the package registry or the official docs. Never bind a version from memory. Flag anything you could not confirm.
4. **Walk the lenses** in `references/lenses.md`: Coherence, Data and database, Security, Failure and operations, Simplicity, Fit for agents. Every lens must end as decided, deferred with a reason, or an open question. A lens left silent is a finding, most often deploy and operations.
5. **Complexity table.** For every choice that is more complex than the simplest thing that could work:

   | Choice | Why needed | Simpler alternative rejected because |
   |---|---|---|

   If you cannot fill the last column convincingly, recommend the simpler alternative.
6. **Draft decisions.** Write each surviving decision in the format below. Each rule must be checkable in code review.
7. **Adversarial pass.** Dispatch a subagent (tier: strongest, read-only) with the prompt in "Adversarial reviewer" below. Give it the draft decisions and the files involved, not your reasoning: its independence is the point. Close every hole it finds with a new or tighter decision, or record why it is acceptable.
8. **Principles gate (after).** Re-check the final design against the same principles. Design work often reintroduces what the first gate removed.
9. **Present** the review to the user (see "Output").
10. **Record** the agreed decisions (see "Recording").

## Decision format

Architecture decisions go in `docs/DECISIONS.md` as normal entries, with three extra lines:

```markdown
## D-014 · 2026-10-22 · Tenant id comes only from the session

- **Decision:** Every query on tenant data takes the tenant id from the server session, never from the request.
- **Rule:** Data-access functions accept a session context, not a raw tenant id. Route handlers never read a tenant id from params, body or headers.
- **Binds:** all route handlers, server actions, background jobs.
- **Prevents:** one module filtering by a client-supplied id while another trusts the session, which would let a user read another tenant's data.
- **Why:** The session is the only value the client cannot forge.
- **Alternatives rejected:** Tenant id in the URL, because it is forgeable and every handler would need its own check.
- **Decided by:** the user
```

Tag a decision `[ADOPTED]` in its title when the user or the existing code had already settled it. Never renumber or edit an old entry; a change is a new entry naming the one it replaces.

## Adversarial reviewer

Prompt for the subagent:

> You are reviewing an architecture with fresh eyes. Read-only: do not edit files. Inputs: the draft decisions, `AGENTS.md`, `docs/VISION.md`, and the files listed.
> 1. Construct two units (modules, features, agents' tasks) that each obey every decision to the letter and still build incompatibly: two owners of one entity, clashing data shapes, conflicting ways to change the same state, different error or auth handling at the same boundary. Each pair is a hole.
> 2. Name any dimension the decisions leave silent: deploy and environments, backup and restore, observability, secrets, migrations, external failures.
> 3. Check that every named technology and version was confirmed against a real source, not memory.
> 4. Check the design against the principles in `AGENTS.md` and the goals in `docs/VISION.md`.
> Return only: a one-line verdict and up to eight findings, each with severity (critical / important / minor), the hole, and a concrete fix.

If subagents are not available, do this pass yourself after a break in context: re-read only the inputs above, not your own notes.

## Output

Talk to the user in their language. Lead with the verdict:

- **Sound:** build as designed.
- **Sound with changes:** build after the listed changes.
- **Rethink:** a core choice does not hold; explain which and propose a direction.

Then:

1. **What is good and why.** Name the strong choices and the reason they work, so the user learns what to repeat.
2. **Findings**, most severe first. For each:
   - **What:** the problem in one sentence.
   - **Why it matters:** the principle behind it, in plain words.
   - **What could happen:** a concrete scenario ("a user changes the id in the URL and sees another company's orders").
   - **Fix:** your recommendation.
   - **Severity:** critical (data loss, security hole, rework of the core) · important (real cost later, fix before or during this feature) · minor (worth doing, not blocking).
3. **Decisions needed.** When a finding needs the user's choice, present one decision at a time: the options, your recommendation, and why. Wait for the answer before the next one.
4. **Deferred** items, each with the condition that would bring it back.

When the tool can produce HTML, offer the review as an interactive page (findings grouped by severity, a diagram of the boundaries). The Markdown record stays the source of truth.

## Recording

- Agreed decisions go to `docs/DECISIONS.md` (format above).
- For a project-start review or a large feature, also write `docs/reviews/<YYYY-MM-DD>-<topic>.md` from `templates/review.md`. Skip it for small reviews: the decisions are enough.
- If a decision changes how code must be organized, update the "Patterns" section of `docs/MAP.md`.
- New principles go to `AGENTS.md` only with the user's agreement, and the change is noted in `docs/DECISIONS.md`.
- Hand the decisions to `writing-plans`: the plan must cite the D-NNN entries it relies on.

## Common mistakes

- Recording rationale-free rules, or rationale without a rule. Each entry needs both.
- Deciding what the framework already decides, which bloats the list and hides the real decisions.
- Adding indexes, caches, queues or services for load that no real query or number justifies.
- Skipping deploy, backup and observability because the conversation was about features.
- Trusting a version or API from memory.
- Dumping every finding at once and asking the user to choose among all of them.

## Provenance

Adapted from BMAD-METHOD by BMad Code, LLC (MIT): `skills/bmad-architecture/SKILL.md`, `assets/spine-template.md` and `references/reviewer-gate.md` at commit 61e01f8, and `bmad-core/checklists/architect-checklist.md` on the V4 branch (commit be122d6); and from GitHub Spec Kit (MIT): `templates/plan-template.md` and `templates/commands/plan.md` at commit 27d14e2. Changed: dropped the memlog, scripts, config resolvers and ticket tree; decisions live in `docs/DECISIONS.md`; lenses trimmed to decision-changing questions; output made didactic with severities and a verdict.

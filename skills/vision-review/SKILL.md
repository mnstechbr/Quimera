---
name: vision-review
description: "Use after the approach is chosen (kickoff) and again at the end of each phase: a senior review of docs/VISION.md that finds the gaps that would hurt later, asks about them one at a time with a recommendation, records dated answers, and ends with a readiness verdict."
---

# Vision review

Review `docs/VISION.md` the way a senior engineer would before anyone builds: find what is missing or vague, ask the user about the most important gaps, write the answers back into the document, and say honestly whether the vision is ready to build on.

Follow the owner profile in `AGENTS.md`. Every question explains in one plain sentence why it matters, without jargon. With an owner who wants coaching, push back once with a concrete example when an answer is thin; with a concise owner, ask fewer questions. Ask the owner product questions only: when the profile says you decide technical choices, make them yourself and record them as `[ASSUMPTION]`. Ease off when the owner signals they are done.

This review covers the product, not the implementation. Stack, schema and library choices belong to `architecture-review`; screens and visual style to `design-directions`.

## When

- **Kickoff:** after `study-round` (or after the user decided the approach). Full scan.
- **End of phase N:** shorter. Review only what changed: decisions added to `docs/DECISIONS.md` since the last review session, what `docs/STATE.md` says was built, new external dependencies, new data, new costs. Re-check earlier `[ASSUMPTION]` tags: did the phase confirm or break them?
- The user can also ask for it at any time.

## 1. Load

1. Read `docs/VISION.md` whole, including every earlier review session. Never ask a question an earlier session already answered, unless the phase changed the facts; then ask again and say why.
2. Read the study linked under "Chosen approach", and skim `docs/DECISIONS.md` for entries that touch the product.
3. If VISION.md is missing or "In the user's words" is empty, stop and suggest `project-kickoff`. Do not invent a vision.

## 2. Scan

Check the vision against the core categories in `references/categories.md` and the set for the project's type (the profile's "Product type" line; ask the owner if it is missing). A category from another set applies only when the vision makes it relevant, for example a game with player accounts. Mark each one, privately: **Clear**, **Partial** or **Missing**. Treat as Partial:

- Adjectives without numbers: "fast", "secure", "scalable", "intuitive", "cheap".
- Boilerplate that could be pasted into any product ("the system must be reliable").
- Statements the user never confirmed. Tag each one `[ASSUMPTION]` in the document now, so the reader can tell what is confirmed from what was inferred.

## 3. Prioritize

Build a queue of candidate questions, ordered by impact × uncertainty: how much the answer would change what gets built, tested, operated or paid for, times how unsure we are. Drop questions whose answer would not change anything, and questions that belong to `architecture-review` or `design-directions`.

There is no fixed cap. Ask the top items first and stop when the user wants to stop. When one high-impact area is open (security, data, cost), ask about it before two low-impact ones. Never show the queue in advance.

## 4. Ask, one at a time

Each question uses this shape, in the user's language:

```
**Question:** <a full question ending in "?", understandable on its own>
**Why it matters:** <one plain sentence: what goes wrong later without this answer>
**Recommended:** <option> — <one or two sentences of reasoning for this product>

| Option | Description |
|---|---|
| A | … |
| B | … |
| C | … |
| Other | Your own short answer |

Reply with the letter, "yes" to accept the recommendation, or your own answer.
```

Write all of it, labels included, in the user's language.

- Use 2–5 mutually exclusive options. When options do not fit, give a **Suggested** short answer instead of a table.
- Base the recommendation on this product's audience, scale and constraints, not generic best practice. Never present a list of options without picking one.
- If the answer is ambiguous, ask a short follow-up about the same question before moving on.
- If the user answers "I don't know", record that, add the item to "What we don't know yet" with how we could find out, and move on.

## 5. Record after each answer

Save the file after every answer, so nothing is lost if the session ends.

1. Under `## Reviews`, use the heading `### YYYY-MM-DD · kickoff` or `### YYYY-MM-DD · end of phase N` (create it once per session).
2. Append `- **Q:** <question> → **A:** <answer> (<who answered>)`. Who answered is "the user", or "agent, [ASSUMPTION]" when the user asked you to decide.
3. Fold the answer into the body of VISION.md (Summary, or a section for that category). Replace the vague or contradicted statement in the body; remove its `[ASSUMPTION]` tag once confirmed.
4. Never erase or edit old Q → A lines. A changed answer gets a new dated line that says which earlier answer it replaces.
5. Keep "In the user's words" untouched; it is the user's original text.

If an answer is really a decision with alternatives (for example "no WhatsApp in the first version"), also record it in `docs/DECISIONS.md`.

## 6. Readiness verdict

When the user stops or the high-impact queue is empty, judge the vision as a whole:

- Are decisions stated as decisions, with what was given up?
- Are success and failure criteria measurable?
- Is out of scope explicit, so omissions are not silently assumed?
- Is the number of open items acceptable for the stakes? Many assumptions are fine for a prototype, not for something that will hold customer data or money.

Then give one verdict, with the why in plain words:

- **Ready:** every high-impact category is Clear.
- **Ready with assumptions:** the remaining gaps are `[ASSUMPTION]` items of low or medium impact. List each one and when it should be confirmed.
- **Not ready:** a high-impact category is Missing (for example problem and who has it, success criteria, the quality bar, and for products with customer data: data and LGPD, cost per customer, security), or an unconfirmed assumption could change the architecture. Say what is missing and the cheapest way to resolve it.

Append the verdict to the session: `- **Readiness:** <verdict> — <one-line why>`.

## 7. Report

Short, in the user's language:

- Questions asked and answered; sections of VISION.md changed.
- Coverage per category: Clear, Resolved now, Deferred (low impact or user stopped), Outstanding.
- The verdict and the next step: `architecture-review` when ready; the specific open questions when not; `design-directions` after architecture if there is a UI.

## Common mistakes

- Several questions in one message, or a question without a recommendation.
- A "why it matters" that repeats the question instead of naming the consequence.
- Rewriting earlier review answers or the user's original words.
- Asking about the tech stack here.
- Asking SaaS questions (roles, cost per customer) about a game or a showcase, or game questions about an API.
- Saying "ready" while success criteria are still adjectives.
- Leaving inferred statements untagged, so they read as decisions.

## Provenance

Adapts Spec Kit `templates/commands/clarify.md` (github/spec-kit, commit 27d14e2, MIT) and, from BMAD-METHOD by BMad Code, LLC (MIT), commit 61e01f8, the product brief coaching (`skills/bmad-product-brief/SKILL.md`) and the PRD rubric (`skills/bmad-prd/assets/prd-validation-checklist.md`). Changed: the target is VISION.md with Quimera's own categories; no 5-question cap; every question carries a plain "why it matters"; answers are dated and never erased; a three-level readiness verdict replaces the coverage table and checklist re-validation; hooks, scripts and memlog machinery dropped.

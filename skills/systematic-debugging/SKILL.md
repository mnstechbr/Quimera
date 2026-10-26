---
name: systematic-debugging
description: "Use when a test fails, a build breaks, behavior is unexpected or a bug is reported and the cause is not already proven, and before proposing any fix. Also use after two failed attempts at the same failure."
---

# Systematic debugging

Random fixes waste time and create new bugs. A quick patch hides the real problem until it comes back somewhere else.

**Core principle:** find the root cause before you attempt a fix. A fix for a symptom is not a fix.

If you have not finished Phase 1, you are not ready to propose a fix. Following the steps loosely is not following them: the process exists because the shortcut feels obvious and is usually wrong.

## When to use

Any technical problem: failing tests, production bugs, unexpected behavior, performance problems, build failures, integration issues.

Use it especially when:

- there is time pressure (emergencies make guessing tempting);
- "one quick fix" looks obvious;
- you already tried a fix and it did not work;
- you do not fully understand the problem.

Simple bugs have root causes too. On a simple bug the process is fast.

## The four phases

Finish each phase before moving to the next. Track the phases in a checklist.

### Phase 1: Root cause investigation

1. **Read the error completely.** Read the whole message and stack trace, warnings included. Note file paths, line numbers and error codes. The answer is often already there.
2. **Reproduce it reliably.** Write down the exact steps. Does it happen every time? If you cannot reproduce it, gather more data; do not guess.
3. **Check what changed.** Look at the recent diff and commits, new dependencies, config changes, environment differences between where it works and where it fails.
4. **Gather evidence across component boundaries.** When the system has several layers (CI → build → signing, API → service → database), add temporary instrumentation at each boundary before proposing anything:
   - log what enters and what leaves each component;
   - check that environment and config reach each layer;
   - check the state at each layer.

   Run once, read the evidence, find the layer where it breaks, then investigate that layer only. Never log secret values; log whether they are set (`SET`/`UNSET`).
5. **Trace the data flow backward.** When the error appears deep in a call stack, ask where the bad value came from, what called this with it, and keep going up until you reach the source. Fix at the source. Full technique: `references/root-cause-tracing.md`.

Output of Phase 1: you can say *what* fails and *why*, backed by something you observed.

### Phase 2: Pattern analysis

1. **Find working examples.** Locate similar code in the same codebase that works.
2. **Read the reference completely.** If you are applying a known pattern, read the reference implementation line by line. Skimming produces partial understanding, and partial understanding produces bugs.
3. **List every difference** between the working and the broken case, however small. Do not assume a difference "can't matter".
4. **Understand dependencies.** What other components, settings, environment and assumptions does this code rely on?

Search the codebase with a subagent (tier: fast) when the search is broad; read the findings yourself.

### Phase 3: Hypothesis and testing

1. **Form one hypothesis.** Write it down: "I think X is the root cause because Y." Be specific.
2. **Test it minimally.** Make the smallest change that could confirm or refute it. One variable at a time.
3. **Read the result.** Confirmed → Phase 4. Refuted → form a new hypothesis from what you learned. Do not stack another fix on top of the first.
4. **Say when you do not know.** "I don't understand X yet" is a valid finding. Investigate more or ask the user; do not pretend.

### Phase 4: Implementation

1. **Write a failing regression test first.** The simplest reproduction of the bug, as an automated test in the project's test suite. If there is no test framework, a one-off script that exits non-zero on the bug. Run it and watch it fail for the reason you expect.
2. **Implement one fix.** Address the root cause found in Phase 1. One change. No "while I'm here" improvements, no bundled refactoring.
3. **Prove the fix with `verification`.** The regression test now passes, the tests around it still pass, and the original symptom is gone. A test that failed before the fix and passes after it is the proof. Your explanation of why the fix works is not.
4. **If the fix does not work,** stop and count the attempts.
   - Fewer than three: go back to Phase 1 with the new information.
   - Three or more: stop fixing and question the architecture (next section).
5. **Add defense in depth when it is cheap.** If bad data caused the bug, consider validating it at each layer it passes through so the bug becomes structurally impossible. See `references/defense-in-depth.md`.
6. **Remove the temporary instrumentation** you added in Phase 1 before committing.

## After three failed fixes: question the architecture

Signs the problem is structural, not a wrong hypothesis:

- each fix reveals new shared state, coupling or a problem in a different place;
- each fix needs a large refactor to work;
- each fix creates a new symptom elsewhere.

Then stop and ask:

- Is this pattern sound, or are we keeping it out of inertia?
- Would changing the structure be cheaper than continuing to patch symptoms?

Bring this to the user before attempting a fourth fix. Explain in plain words what you tried, what each attempt revealed, and what you recommend. For a real structural change, use `architecture-review`. Dispatch a subagent (tier: strongest) for a second opinion on a hard bug if the tool supports it; give it the evidence, not your conclusions.

## Red flags: return to Phase 1

If you catch yourself thinking any of these, stop and go back to Phase 1:

- "Quick fix for now, investigate later."
- "Let me just try changing X and see."
- "I'll change several things and run the tests."
- "I'll skip the test and check it by hand."
- "It's probably X." (without evidence)
- "I don't fully understand it, but this might work."
- Listing fixes before tracing the data flow.
- "One more attempt" after two have already failed.

Signals from the user that you are guessing: "Is that actually happening?", "Will it show us…?", "Stop guessing", "We're stuck?". Treat them as a request to go back to evidence.

## Common mistakes

| Mistake | Why it fails |
|---|---|
| "It's urgent, no time for the process" | Systematic debugging is faster than guess-and-check thrashing. |
| "I'll write the test after the fix works" | Without a test that failed first, you cannot tell the fix from luck. |
| Several fixes at once | You cannot tell which one worked, and the others may add bugs. |
| Adapting a pattern without reading all of it | Partial understanding is how the bug got there. |
| "I see the problem, let me fix it" | Seeing the symptom is not understanding the cause. |

## Quick reference

| Phase | Do | Done when |
|---|---|---|
| 1. Root cause | Read errors, reproduce, check changes, instrument boundaries, trace back | You can say what fails and why |
| 2. Pattern | Find working examples, compare, list differences | You know the relevant differences |
| 3. Hypothesis | One hypothesis, smallest test | Confirmed, or a new hypothesis |
| 4. Implementation | Failing test, one fix, `verification` | Test fails before, passes after; nothing else broke |

## When there is no root cause in the code

Sometimes the cause is really environmental, timing-dependent or external. Then:

1. Record what you investigated and what you ruled out.
2. Add proper handling (retry with a limit, timeout, clear error message).
3. Add logging that will catch it next time.

Most "no root cause" conclusions are incomplete investigations; be sure before you settle on one.

## Supporting techniques

- `references/root-cause-tracing.md` — trace a bug backward through the call chain; find which test pollutes shared state by bisection.
- `references/defense-in-depth.md` — validate at every layer after finding the root cause.
- `references/condition-based-waiting.md` — replace arbitrary sleeps in flaky tests with waits on the real condition.

## Provenance

Adapted from `skills/systematic-debugging/` (SKILL.md, root-cause-tracing.md, defense-in-depth.md, condition-based-waiting.md) in [obra/superpowers](https://github.com/obra/superpowers), commit 2ce8aa1, © 2025 Jesse Vincent, MIT License. Changed: renamed cross-skill references to Quimera skills, softened the tone, removed the bundled `find-polluter.sh` script (the bisection is described in prose), removed graphviz diagrams and the TypeScript example file, and made the failing-then-passing regression test the explicit proof through `verification`.

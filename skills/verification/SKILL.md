---
name: verification
description: "Use before any claim that something works, passes, is fixed or is done — before committing, before moving to the next task, before reporting to the user, and before the push. Runs the smallest command that proves the claim and reads its output."
---

# Verification

Evidence before claims. If you have not run the command that proves a claim, in this session, after the last change, and read its output, you cannot make the claim. Your explanation of why it should work is not evidence (`QUIMERA.md`, principle 5).

## The gate

Before saying anything is done, fixed or passing:

1. **Name the claim.** "The types are fine", "the bug is fixed", "the page works on mobile".
2. **Pick the smallest command that proves it** (table below). Not the whole suite by reflex; not a weaker check than the claim needs.
3. **Run it fresh**, in the foreground, and wait for it to finish. Never in the background, never "it was green earlier".
4. **Read the output**: exit code, failure count, warnings. Not only the last line.
5. **Compare.** Does the output prove the claim? If yes, make the claim with the evidence. If not, state the real status with the evidence.

## Claim → proof

| Claim | Proof | Not enough |
|---|---|---|
| Lint is clean | Linter on the changed files: 0 errors | Type check passed |
| Types are fine | Type check: exit 0 | Tests passed; the editor shows no red |
| Tests pass | The related tests run: N passed, 0 failed | A previous run; "should pass" |
| Bug fixed | The regression test that failed before now passes, and the original reproduction no longer shows the bug | The code changed; a different test passes |
| Regression test works | It fails without the fix and passes with it | It passes once |
| UI fixed | Seen in a browser or screenshot at the relevant widths (e.g. 360, 768, 1280 px) and states (empty, loading, error) | The CSS looks right; the build passed |
| Migration safe | Applied, and rolled back if the project supports it, on a disposable database; data checked after | The SQL reads correctly |
| Build works | Build of the affected packages: exit 0 | Type check passed |
| Requirements met | Each requirement in the plan or spec checked off against the code | Tests pass |
| A subagent finished its task | You read the diff and ran its verification yourself, or confirmed its reported command and output | The subagent said "done" |
| Ready to push | `node .quimera/scripts/verify.mjs push`: exit 0 | The per-task checks passed |

Documentation-only changes need no code checks; re-read the rendered result instead.

## The two commands

- **During work:** `node .quimera/scripts/verify.mjs` — lint on changed files, type check, tests related to the changed files. Run it after each task or meaningful change. `--plan` shows what it would run without running it.
- **Before the push, once:** `node .quimera/scripts/verify.mjs push` — the project's full verify script and the build of affected packages. Not after every edit.

When a narrower command proves the claim faster (one test file, one type check), use it, and say so. When the script is missing, use the commands from `AGENTS.md` and name them.

## Rules for tests

- Never weaken, skip or delete an assertion to make a test pass. If you believe a test is wrong, stop and report it to the user with the reason; changing what a test expects is a decision, not a fix.
- Tests never call paid external APIs (AI models, payment, SMS, email providers). Use fakes, stubs or recorded responses. If a test needs the real service, ask the user first.
- For a bug fix, prove the regression test is real: run it before the fix (fails), after the fix (passes). If you wrote the fix first, revert it briefly, run the test, see it fail, restore, run again.
- Flaky results are not passes. Run the failing case again; if it still flips, report it as flaky.
- After two failed attempts at the same failure, stop and rethink with `systematic-debugging`.

## Checking someone else's work

A subagent, a previous session or a tool reporting success is a claim. Before you repeat it:

- read the diff (`git diff`, or the review package) and confirm the changes exist and match the task;
- confirm the verification in its report names the command and shows the result; if it does not, or the claim matters, run the command yourself.

## Reporting

Quote the command and the result, with counts. Say what was not run and why. In the user's language, short:

```
Verificação:
- node .quimera/scripts/verify.mjs → exit 0 (lint ok, tipos ok, 14/14 testes)
- teste de regressão orders.total.test.ts → falhava antes, passa agora
- Não rodei: build completo (fica para antes do push)
```

Words like "should", "probably", "seems to", or "done!" before a run are a signal you are about to claim without evidence. Run first, then speak.

## Common mistakes

- Running the full suite after every edit, then skipping it before the push.
- "Types pass, so the build passes."
- Trusting a green run from before the last edit.
- Running checks in the background and reporting before they finish.
- Fixing a failing test by loosening what it asserts.
- Reporting only the last line of output and missing the warnings above it.

## Provenance

Adapts Superpowers `skills/verification-before-completion/SKILL.md` (github.com/obra/superpowers, commit 2ce8aa1, © 2025 Jesse Vincent, MIT). Changed: the smallest command that proves each claim instead of always the full suite, an expanded claim → proof table (UI, migrations, subagent work), Quimera's `verify.mjs` and `verify.mjs push`, rules against weakening assertions and calling paid APIs in tests, a reporting format, calmer tone.

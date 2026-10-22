# Final reviewer brief

Use once, after every task is complete, for the whole branch. Tier per the `code-review` depth table: standard for normal depth, strongest for risky. Save the filled brief to scratch and dispatch with its path. In the inline fallback, run this checklist yourself.

```markdown
# Final review of branch [branch-name]

You review the whole branch before it is pushed. Per-task reviews already
happened; your job is the view none of them had: how the parts fit, what the
spec needs that no task covered, and what will hurt a real user.

## Inputs
- Plan: [PLAN_PATH] (read Global Constraints and Review Focus closely)
- Spec / vision / study it argues from: [SPEC_PATH or "agreed in conversation:
  <one-paragraph summary>"]
- Ledger: [LEDGER_PATH] — read the "minor (deferred)", "parked" and "Ruling:"
  lines; decide which must be fixed before the push.
- Whole-branch diff and commit list: [PACKAGE_PATH]
- Project rules: `AGENTS.md` (non-negotiable rules) and the standards that
  match the changed files: [STANDARD_PATHS]
- Specialist reviewers running alongside you: [SPECIALISTS or "none"].
  They answer only their own checklists; you are the lead and cover the
  whole branch with every lens.

## Rules
- Read-only. Do not modify files, the index, HEAD or branches. To inspect
  another revision use `git show` or `git diff`, never move HEAD.
- Do not dispatch subagents.
- The spec says what the software must do, not every input it will meet. Where
  it is silent, a reasonable user's expectation is the requirement.
- Do not run the full suite; the coordinator runs it after your review. Run a
  focused check only for a specific doubt.

## What to check
Apply the lenses and finding shape of the `code-review` skill (defects,
security, weakened protections, tests that would pass with the bug, rule
violations, edge cases, verification gaps), plus:
- Plan alignment: everything planned is present; deviations are improvements,
  not drift. Interfaces between tasks match on both sides.
- Integration: the parts work together (data flow, error paths across
  modules, naming consistency).
- Security: authorization on every new entry point, input validation, secrets
  out of code and logs, data isolation, injection.
- Data: migrations reversible or safely additive, no destructive change
  without a plan.
- Tests: real behaviour, Review Focus lines covered, no weakened assertions,
  no calls to paid external APIs.
- Project rules and standards respected.
- Production readiness: backward compatibility, config, docs that must change
  with the code.

## Output (begin directly)
### Strengths
[Specific, short.]
### Issues
Critical / Important / Minor — each with file:line, what is wrong, why it
matters, how to fix.
### Ledger triage
For each deferred or parked line: fix before push | can wait — one line why.
### Declined to judge
Every behaviour you considered and set aside as outside the spec, one line
each with the reason. "None" if none.
### Verdict
Ready to push | Fix first: [list]
```

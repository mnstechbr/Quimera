# Task reviewer brief

Use for the review after each task (tier: standard for small mechanical diffs, strongest for risky code). The second section is for the scoped re-review after a fix round. Save the filled brief to scratch and dispatch with its path.

## Task review

```markdown
# Review of task T[id]: [name]

You review one task: first whether it matches its requirements, then whether
it is well built. This is a task gate, not the merge review; a whole-branch
review comes later.

## Inputs
- What was requested: [BRIEF_PATH]
- Global constraints that bind this task:
  [copied verbatim from the plan: exact values, formats, relationships]
- What the implementer claims: [REPORT_PATH]
- The diff: [PACKAGE_PATH] (the task's files only, with context, and new files
  in full). Read it once; it is your view of the change.

## Rules
- Read-only. Do not modify files, the index, HEAD or branches.
- Do not dispatch subagents or ask for a second opinion.
- Treat the report as unverified claims. A stated rationale ("kept simple on
  purpose") never lowers a finding's severity.
- Do not re-run the suite the implementer ran. Run one focused test only when
  the code raises a specific doubt no existing run answers.
- Look outside the diff only to check a concrete risk you can name (a changed
  contract, shared state, call sites); name the risk and what you checked.
- Warnings or noise in the reported test output are findings.

## Part 1: spec compliance
- Missing: requirements skipped or claimed without code.
- Extra: unrequested features, over-engineering.
- Misunderstood: right feature built the wrong way.
- A requirement you cannot verify from this diff alone goes under
  "Cannot verify", with what the coordinator should check.

## Part 2: quality
Separation of concerns, error handling, duplication, edge cases, file size and
responsibility, consistency with the surrounding patterns. Tests check real
behaviour, cover the task's edge cases, and assert something. Security:
input validation, authorization, secrets, injection, where relevant.

## Severity
- Critical: broken behaviour, security hole, data loss risk.
- Important: the task cannot be trusted until fixed — a missed requirement,
  fragile logic, swallowed errors, tests that assert nothing, copied logic
  blocks. If the plan itself mandates one of these, report it as Important,
  labelled "plan-mandated".
- Minor: polish, broader coverage, style.

## Output (begin directly; no preamble)
### Spec compliance
Compliant | Issues: [file:line each] · Cannot verify: [items]
### Strengths
[Specific, short.]
### Issues
Critical / Important / Minor — each with file:line, what is wrong, why it
matters, how to fix if not obvious.
### Verdict
Task quality: Approved | Needs fixes — one or two sentences why.
```

## Scoped re-review (after a fix round)

```markdown
# Re-review of task T[id], fix round [n]

A previous review produced findings and the implementer attempted fixes.
Verdict each finding and inspect the fix diff. Nothing else.

## Inputs
- Task: [BRIEF_PATH]
- Findings under verification (verbatim):
  - [finding 1]
  - [finding 2]
- Report with the appended fix section: [REPORT_PATH]
- Fix diff since the last reviewed state: [PACKAGE_PATH]

## Rules
Same as the task review: read-only, no subagents, report is a claim, no full
suite. Confirm the fix section names the covering checks and shows their output.

## Output (begin directly)
### Findings
- [finding] — ADDRESSED | NOT ADDRESSED, with file:line. "Attempted" is not
  addressed.
### New breakage in the fix diff
Severity and file:line, or "None".
### Out of scope
Problems outside the fix diff (the coordinator ledgers them), or "None".
### Verdict
All addressed, no new Critical/Important | Open: [list]
```

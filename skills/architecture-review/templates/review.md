# Architecture review · {{topic}}

- **Date:** {{YYYY-MM-DD}}
- **Scope:** {{project start | feature: name | on demand: question}}
- **Verdict:** {{sound | sound with changes | rethink}}
- **Inputs read:** {{files and documents}}

## Summary

{{Two or three sentences: what was reviewed and the main conclusion.}}

## What is good and why

- {{Choice}}: {{why it works}}.

## Design

{{The paradigm, with its layers mapped to folders. One diagram of boundaries and dependency direction (mermaid) if it helps. Add a deploy and environments diagram for a project-start review.}}

## Findings

### {{Title}} · {{critical | important | minor}}

- **What:** {{the problem}}
- **Why it matters:** {{the principle, in plain words}}
- **What could happen:** {{a concrete scenario}}
- **Fix:** {{the recommendation}}
- **Resolution:** {{accepted as D-NNN | deferred: condition | rejected by the user: reason}}

## Research

### {{Unknown}}

- **Decision:** {{what was chosen}}
- **Rationale:** {{why}}
- **Alternatives considered:** {{what else, and why not}}
- **Source checked:** {{lockfile, registry or docs page, with date}}

## Complexity

| Choice | Why needed | Simpler alternative rejected because |
|---|---|---|

## Principles gate

| Principle or rule | Before | After |
|---|---|---|
| {{from AGENTS.md}} | {{pass | violation: note}} | {{pass}} |

## Decisions recorded

- D-NNN · {{title}}

## Deferred

- {{Item}}: {{why it can wait}} · revisit when {{condition}}.

## Open questions

- {{Question}} · owner: {{user | agent}}

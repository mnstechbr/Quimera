# Study file template

Path: `docs/studies/<YYYY-MM-DD>-<slug>.md`. Keep it readable in one sitting; long research belongs in the sources, not in the body.

```markdown
# Study: <short title>

- **Date:** YYYY-MM-DD
- **Verdict:** go | needs-clarification | kill
- **Chosen:** Proposal <letter> — <name> | none
- **Decision:** D-NNN

## Problem as stated

> <The user's words or the source text, quoted exactly. Secrets redacted, URLs sanitized.>

<Neutral restatement in one or two sentences.>

## Problem definition

- **Who has it:** …
- **Goals:** …
- **Non-goals:** …
- **Success metrics:** <metric> (baseline: <value | unknown>)
- **Cost of doing nothing:** …

## Research

Overall evidence: high | medium | low

- <finding> — [source: <sanitized URL or file> | ASSUMPTION] (confidence: high/medium/low)

### Evidence against the idea

- <reason> — [source]
<or: "None found after searching <where>.">

### Sources

- <sanitized URL or file path>

## Proposals

<One subsection per proposal, as returned (template in references/proposal-template.md), with the angle and, if different models were used, which tier or model wrote it.>

## Gate

| Criterion | Rating | Justification |
|---|---|---|
| Problem validity | strong/adequate/weak/unknown | … |
| Evidence strength | … | … |
| Value vs. doing nothing | … | … |
| Feasibility | … | … |
| Fit with project goals | … | … |
| Risk posture | … | … |

## Scorecard

| Criterion | Weight | A | B | C | D |
|---|---|---|---|---|---|
| Solves the stated problem | 30% | 4 — … | … | … | … |
| Design and motion potential | 15% | … | … | … | … |
| Scalability | 15% | … | … | … | … |
| Interactivity with meaning | 15% | … | … | … | … |
| Feasibility and cost | 15% | … | … | … | … |
| Risk | 10% | … | … | … | … |
| **Weighted total** | | … | … | … | … |

<Note any weight the user changed, and any "n/a" redistribution.>

## Recommendation

<The judge's recommendation and the reasoning, in plain words. Or: recommend not proceeding, with the reason.>

## Merged ideas

- From <letter>: <idea> — <why it fits the winner>
- Not merged: <idea> from <letter> — <why not>

## Decision

- **User's decision (YYYY-MM-DD):** approved | chose <letter> | redirected: <how>
- **Open questions carried forward:** …
```

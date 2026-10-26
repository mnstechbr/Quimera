# Evaluations

Scenarios that check whether an agent following Quimera behaves the way the kit promises. They come from the two pilot projects started with 0.3.0, rewritten in our own words, plus the cross-tool handoff the kit exists for.

- `scenarios/` holds one file per situation: where it was seen, the setup, the one expected decision, the evidence to look for, the rules it exercises and what must never happen. `npm run check` keeps every field present and every rule reference pointing to a file that exists.
- `rubric.md` says how to record a run and judge it.
- `results/` holds the recorded runs.

## Running a scenario

Nothing here runs on its own, and nothing calls a paid model unless a person starts it.

1. Make a fresh repository and install the kit at the commit being evaluated (`node <kit>/bin/quimera.mjs init --tools=<tool>`).
2. Recreate the setup with fixture content, never a real project's code, secrets or personal data.
3. Open the tool and play the owner's part from the setup, word for word where the scenario quotes it.
4. Look for the evidence and the "Never" line, and write the result in `results/` following `rubric.md`.

Compare a changed skill against the previous version with fresh sessions for each, and keep safety violations apart from quality judgements.

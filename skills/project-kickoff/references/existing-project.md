# Kickoff on an existing project

Kickoff on a project that already has history adds to it; it does not reorganize it.

- **Never modify code, configuration or tests** during kickoff.
- **Existing `AGENTS.md`:** add the project profile and the "Process" section at the top; do not rewrite or reorder the rest. If it is tracked and the mode is local-only, do not edit it (the edit would appear in the user's diff). Write the profile to `.quimera/PROFILE.md` instead (from `.quimera/templates/PROFILE.md`; `.quimera/` is excluded in local-only mode). The preflight and every skill read it there.
- **Existing state, handoff or decision files** (any name): do not rewrite or replace them, and do not create a duplicate that will drift. Point to them from `AGENTS.md` ("Where we stopped: `memory/CURRENT.md`") and from `docs/MAP.md`. Create a Quimera file only where nothing equivalent exists, and ask first when it is unclear.
- **Existing decisions log:** continue its numbering and format instead of starting `docs/DECISIONS.md`; record the kickoff there.
- **No renames or moves** of files or folders without asking, even when the Quimera layout differs.
- **Existing rules win.** If the project's own instructions conflict with QUIMERA.md, they win (QUIMERA.md says so). List the conflicts you noticed for the user in one short message instead of resolving them yourself.

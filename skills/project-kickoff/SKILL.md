---
name: project-kickoff
description: "Use when a new project starts, or the first time Quimera is used in an existing project (no project profile at the top of AGENTS.md yet). Sets the working mode, git identity, where Quimera files live, the product's audience and languages, and creates the memory files."
---

# Project kickoff

Set up a project so any agent, on any tool or computer, can continue the work. Kickoff asks, records and creates memory files. It never changes the project's code.

Read `.quimera/QUIMERA.md` first; this skill fills the "Project profile" it describes.

## Before asking anything

1. Look before you ask. Run a shell command to check: is this a git repository, which branch, is the working tree clean, are there remotes, what `git config user.name` and `git config user.email` return (local and global). If `node .quimera/scripts/git-preflight.mjs` exists, run it; it is read-only.
2. List which of these already exist: `AGENTS.md`, a tool-specific instruction file (for example `CLAUDE.md`), `docs/STATE.md`, `docs/MAP.md`, `docs/VISION.md`, `docs/DECISIONS.md`, and any other state or handoff file the project already uses (for example `memory/CURRENT.md`, `docs/CURRENT-HANDOFF.md`). If any exist, follow "Existing project" below as well.
3. Note what the user already told you in this conversation. Never ask what they already answered.
4. **If the user brought a vision file** (an idea, a brief, a spec: Markdown, Word, PDF or plain text), read all of it now, before the first question. Convert it to text with the tools already available (for a Word file, a document converter; for a PDF, a text extractor). Do not install anything to read it; if you cannot, ask the user for a Markdown or plain-text copy. Keep the original in `docs/vision/` and note which questions below it already answers. Ask only what it leaves open; for what it answers, show the answer you found and ask the user to confirm it in the same summary.
5. If the folder is not a git repository, ask before running `git init`.

## The questions

Ask one at a time. Each question gets: the question, one plain line on why it matters, your recommendation with the reason, and the options. Wait for the answer before the next one. Talk in the user's language (default Brazilian Portuguese until question (e) says otherwise).

**(a) Mode: discreet or open?**
- *Discreet:* work happens on the user's machine; commits carry only the user's identity; no AI marks in branches, commits or pull requests (the `commit-msg` hook installed with Quimera strips co-author and "generated with" lines).
- *Open:* agents may also work directly on the remote (cloud sessions, pull requests opened by agents), and AI marks are acceptable.
- Why it matters: it decides who appears as a contributor in the repository's history, which cannot be cleaned up later without rewriting it.
- Recommend *discreet* for employer, client or corporate repositories, and whenever the user is unsure; *open* is fine for personal projects where they do not mind.

**(b) Git identity: which name and email?**
- If the user's own instructions or memory record their usual identities (for example a name, a personal email for their own projects and an employer email for employer projects), offer them as suggestions, never as facts. Show what git currently returns next to the suggestion.
- Why it matters: git identity is per machine and per repository; a wrong email attaches commits to the wrong account and cannot be fixed without rewriting history.
- Never invent or infer an email. Never use the hosting service's private "noreply" address unless the user asks for it. Always get an explicit answer.

**(c) Quimera files: committed or local-only?**
- *Committed:* the kit and memory files live in the repository and travel with it to every computer and collaborator.
- *Local-only:* they stay on this machine through `.git/info/exclude` and are never pushed.
- Why it matters: local-only keeps the employer's repository free of your process files, but the memory then does not follow you to another computer.
- Recommend *local-only* for employer or corporate repositories; *committed* for the user's own projects.
- In discreet mode, committed Quimera files (`AGENTS.md`, `.quimera/`, skills folders, role agents) show in the history that agents are used. Recommend local-only for discreet projects unless the user does not mind.

**(d) Who is the product for, and in which languages will the finished product be?**
- Ask for the audience in the user's words (who uses it, in what situation). Then the product languages (for example Portuguese only; Portuguese and English).
- Why it matters: the audience shapes every design and copy decision; adding a second language late means touching every screen and message.
- Recommend a single language first unless the user names a real audience that needs the second one now.

**(e) Which language should agents use to talk to you?**
- Recommend Brazilian Portuguese if that is how the user has been writing. Files, code and commits stay in English regardless (QUIMERA.md, "Language").

**(f) Which models do you use here, and full or economic?**
- Ask which providers or models the user works with in this project (for example Claude, GPT, Gemini, DeepSeek, MiMo, or a mix such as "Claude plans and reviews, DeepSeek writes the code"), and whether the token budget is limited.
- Show the mapping from `.quimera/adapters/models.md` for what they named, in both profiles, with the effort for each role.
- Why it matters: it decides which model plans, writes and reviews, and how much each task costs. Economic keeps every review on the mid-size model and has plans spell out the exact change.
- Recommend *economic* when the budget is limited (an employer's quota, a small plan), *full* otherwise. If the user names models of their own, record those names; they win over the table.

If the user starts describing the problem or the product at any point, let them talk. Save their words exactly; they go into VISION.md (step 6 below). Do not polish them.

## Apply the answers

Summarize all answers in one short message and ask for confirmation. Then:

1. **Git identity.** Run `git config --local user.name "<name>"` and `git config --local user.email "<email>"`. Local scope only; never touch the global config. Read the values back to confirm.
2. **Pushing.** Record "ask every time" in the profile unless the user has already given a standing permission (then record its date and scope).
3. **Specialist reviewers.** Record "security, database, interface" in the profile (wherever the profile lives: `AGENTS.md` or `.quimera/PROFILE.md`), dropping `interface` when the project has no user interface and `database` when it has no database. Mention it in the summary; the user can turn any of them off later.
4. **Discreet mode.** Run `node .quimera/scripts/install-hooks.mjs`. It installs the `commit-msg` guard into this repository's hooks folder (local only, never committed). If it reports a different `commit-msg` hook already there, tell the user and do not overwrite it.
5. **Local-only.** Run `node .quimera/scripts/local-only.mjs`. It appends the Quimera and memory paths to `.git/info/exclude` and lists any of them git already tracks. Then run `git status --short` and confirm none of them appear. Exclude does not hide files git already tracks: if any are listed, say so and ask (see "Existing project").
6. **Memory files.** Create from `.quimera/templates/`:
   - `AGENTS.md`: fill the project profile with the answers; fill name, one-sentence description, stack and commands with what you know; leave `{{…}}` placeholders you cannot fill as `TBD` and list them in STATE.md "Open questions".
   - `docs/STATE.md`: "Now: kickoff done"; next step = the offer below.
   - `docs/MAP.md`: new project → purpose and planned structure only. Existing project → fill it by locating, not by reading everything: search the tree, read the manifest and its scripts (for example `package.json`), the entry points, the config files and the README. Dispatch a subagent (tier: fast) for this if the project is large. Keep MAP under ~120 lines.
   - `docs/VISION.md`: paste the user's description verbatim under "In the user's words": the text of the vision file when there is one (with a link to the original in `docs/vision/`; if it is longer than about 200 lines, link the original as the record and write a faithful summary instead of the whole text), plus anything they added in the conversation. Redact anything that looks like a secret, a token or a personal document number. Fill "Summary" only with what they said; mark anything you inferred `[ASSUMPTION]`. Leave "Chosen approach" for `study-round`.
   - `docs/DECISIONS.md`: write D-001 (below).
7. **Tool instruction file.** If a tool-specific file (for example `CLAUDE.md`) exists and does not import or point to `AGENTS.md` (for example a line `@AGENTS.md`), tell the user that tool will not read AGENTS.md, and offer to add the import at the top. Change it only after they agree. On a new project, offer to create the pointer files for the tools they use from `.quimera/templates/`.

8. **Model profile in each tool.** For each tool the user named, read its adapter (`.quimera/adapters/<tool>.md`, "Tiers") and apply the profile the way it says, for example role agents that carry a model. The user already confirmed the profile in the summary; do not ask again, but say what you changed.

### D-001

```markdown
## D-001 · YYYY-MM-DD · Project kickoff profile

- **Decision:** Mode <discreet|open>; git identity <name> <email>; Quimera files <committed|local-only>; product for <audience>; product languages <…>; conversation in <language>; pushing <ask every time | …>; models <providers> · <full|economic>.
- **Why:** <one line per choice, in the user's terms, e.g. "employer repository: no agent marks, process files stay local">.
- **Alternatives rejected:** <the option not chosen for each, and why>.
- **Decided by:** the user
```

Never put a secret, password or token in any memory file.

## Existing project

Kickoff on a project that already has history adds to it; it does not reorganize it.

- **Never modify code, configuration or tests** during kickoff.
- **Existing `AGENTS.md`:** add the project profile and the "Process" section at the top; do not rewrite or reorder the rest. If it is tracked and the mode is local-only, do not edit it (the edit would appear in the user's diff). Write the profile to `.quimera/PROFILE.md` instead (from `.quimera/templates/PROFILE.md`; `.quimera/` is excluded in local-only mode). The preflight and every skill read it there.
- **Existing state, handoff or decision files** (any name): do not rewrite or replace them, and do not create a duplicate that will drift. Point to them from `AGENTS.md` ("Where we stopped: `memory/CURRENT.md`") and from `docs/MAP.md`. Create a Quimera file only where nothing equivalent exists, and ask first when it is unclear.
- **Existing decisions log:** continue its numbering and format instead of starting `docs/DECISIONS.md`; record the kickoff there.
- **No renames or moves** of files or folders without asking, even when the Quimera layout differs.
- **Existing rules win.** If the project's own instructions conflict with QUIMERA.md, they win (QUIMERA.md says so). List the conflicts you noticed for the user in one short message instead of resolving them yourself.

## Finish

Report in the user's language, short:

- What was set (identity read back, mode, files committed or local-only).
- Files created or changed, and anything left `TBD`.
- Then offer the next steps, recommending one:
  - `study-round` — before committing to an approach for a new product or a large feature.
  - `vision-review` — once the approach is chosen.
  - `architecture-review` — before the first code.
  - `design-directions` — before the first screen, if there is a UI.
  - `code-standards` — when there is existing code to learn the user's conventions from.

Kickoff makes no commit by itself. In committed mode, offer to commit them on a `chore/…` branch with the project identity (`close-task`).

## Common mistakes

- Asking several questions in one message, or asking without a recommendation.
- Filling the email from memory or from the global git config instead of asking.
- Setting `--global` identity.
- Polishing the user's words in VISION.md.
- "Fixing" an existing project's structure during kickoff.
- Adding Quimera files to `.git/info/exclude` while they are already tracked, and assuming that hides them.

## Provenance

Original to Quimera.

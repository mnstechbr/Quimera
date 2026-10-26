---
name: project-kickoff
description: "Use when a new project starts, or the first time Quimera is used in an existing project (no project profile at the top of AGENTS.md yet). Learns who the owner is and how they want to work, sets the working mode, git identity and where Quimera files live, records the product type, audience and languages, and creates the memory files."
---

# Project kickoff

Set up a project so any agent, on any tool or computer, can continue the work. Kickoff asks, records and creates memory files. It never changes the project's code.

Read `.quimera/QUIMERA.md` first; this skill fills the "Project profile" it describes.

## Before asking anything

1. Look before you ask. Run a shell command to check: is this a git repository, which branch, is the working tree clean, are there remotes, what `git config user.name` and `git config user.email` return (local and global). If `node .quimera/scripts/git-preflight.mjs` exists, run it; it is read-only.
2. List which of these already exist: `AGENTS.md`, a tool-specific instruction file (for example `CLAUDE.md`), `docs/STATE.md`, `docs/MAP.md`, `docs/VISION.md`, `docs/DECISIONS.md`, and any other state or handoff file the project already uses (for example `memory/CURRENT.md`, `docs/CURRENT-HANDOFF.md`). If any exist, follow "Existing project" below as well.
3. Note what the user already told you in this conversation. Never ask what they already answered.
4. **If the user brought a vision file** (an idea, a brief, a spec: Markdown, Word, PDF or plain text), read all of it now, before the first question. Convert it to text with the tools already available (for a Word file, a document converter; for a PDF, a text extractor). Do not install anything to read it; if you cannot, ask the user for a Markdown or plain-text copy. Keep the original in `docs/vision/` and note which questions below it already answers. Ask only what it leaves open; for what it answers, show the answer you found and ask the user to confirm it in the same summary.
5. If the folder is not a git repository, ask before running `git init -b main` (or the default branch name the user prefers).

## The questions

Ask one at a time, in plain words, in this order. The full wording, why each matters and what to recommend are in `references/questions.md`: read it before the first question.

- **(a) The owner:** how technical they are, and who decides technical choices (decide and explain briefly, or explain the options and ask).
- **(b) Style:** coaching or concise.
- **(c) Mode:** discreet or open.
- **(d) Git identity:** name and email, never guessed.
- **(e) Quimera files:** committed for the owner's own projects, local-only for someone else's repository, with its two follow-ups.
- **(f) The product:** its type (web app or SaaS · landing page or visual showcase · game · mobile app · library or command-line tool · API · other), who it is for, and its languages.
- **(g) Conversation language.**
- **(h) Models:** providers, and full or economic.

With an owner who chose "decide and explain briefly", (c), (e) and (h) become one plain confirmation each. If the user starts describing the problem or the product at any point, let them talk. Save their words exactly; they go into VISION.md (step 6 below). Do not polish them.

## Apply the answers

Summarize all answers in one short message and ask for confirmation. Then:

1. **Git identity.** Run `git config --local user.name "<name>"` and `git config --local user.email "<email>"`. Local scope only; never touch the global config. Read the values back to confirm.
2. **Pushing and integrating.** Record "ask every time" for pushing, and for integrating finished task branches into the default branch on this machine, unless the user has already given a standing permission (then record its date and scope).
3. **Specialist reviewers.** Record "security, database, interface" in the profile (wherever the profile lives: `AGENTS.md` or `.quimera/PROFILE.md`), dropping `interface` when the project has no user interface and `database` when it has no database. Mention it in the summary; the user can turn any of them off later.
4. **Discreet mode.** Run `node .quimera/scripts/install-hooks.mjs`. It installs the `commit-msg` guard into this repository's hooks folder (local only, never committed). If it reports a different `commit-msg` hook already there, tell the user and do not overwrite it.
5. **Local-only.** Run `node .quimera/scripts/local-only.mjs`, adding `--product-docs` if the user chose to hide the product documents too. It writes exact paths for the kit and memory files into `.git/info/exclude` (the project's own files in the same folders stay visible) and lists any of them git already tracks. Then run `git status --short` and confirm none of them appear. Exclude does not hide files git already tracks: if any are listed, say so and ask (see "Existing project"). If the user wants the private memory history, run `node .quimera/scripts/memory.mjs init` after the memory files exist (step 6): it keeps them in `.git/quimera-memory.git`, with no remote.
6. **Memory files.** Create from `.quimera/templates/`:
   - `AGENTS.md`: fill the project profile with the answers, including "Owner" and "Product type"; write what the owner said about how they like to work under "Working with the owner"; fill name, one-sentence description, stack and commands with what you know; leave `{{…}}` placeholders you cannot fill as `TBD` and list them in STATE.md "Open questions".
   - `.quimera/checks.json`: when the project has no `package.json` (or its scripts are not the real checks), write the project's own check commands there from `.quimera/templates/checks.json`, so `verify.mjs` runs them (format in `verification`). Mark a check that does not exist yet with `skip` and the reason.
   - `docs/STATE.md`: "Now: kickoff done"; next step = the offer below.
   - `docs/MAP.md`: new project → purpose and planned structure only. Existing project → fill it by locating, not by reading everything: search the tree, read the manifest and its scripts (for example `package.json`), the entry points, the config files and the README. Dispatch a subagent (tier: fast) for this if the project is large. Keep MAP under ~120 lines.
   - `docs/VISION.md`: paste the user's description verbatim under "In the user's words": the text of the vision file when there is one (with a link to the original in `docs/vision/`; if it is longer than about 200 lines, link the original as the record and write a faithful summary instead of the whole text), plus anything they added in the conversation. Redact anything that looks like a secret, a token or a personal document number. Fill "Summary" only with what they said; mark anything you inferred `[ASSUMPTION]`. Leave "Chosen approach" for `study-round`.
   - `docs/DECISIONS.md`: write D-001 (below).
7. **Tool instruction file.** If a tool-specific file (for example `CLAUDE.md`) exists and does not import or point to `AGENTS.md` (for example a line `@AGENTS.md`), tell the user that tool will not read AGENTS.md, and offer to add the import at the top. Change it only after they agree. On a new project, offer to create the pointer files for the tools they use from `.quimera/templates/`. For Claude Code, also offer the reminder after compaction (`.quimera/adapters/claude-code.md`, "Reminder after compaction"), and add it only if the user agrees.

8. **Model profile in each tool.** For each tool the user named, read its adapter (`.quimera/adapters/<tool>.md`, "Tiers") and apply the profile the way it says, for example role agents that carry a model. The user already confirmed the profile in the summary; do not ask again, but say what you changed. Then tell the user in one line which model to start sessions on for planning and for building (the adapter's "Session model").
9. **Default branch (repository without commits).** Without a first commit the default branch does not exist, and every task branch would stack on the one before. If `git branch --show-current` is not the default the user wants, set it with `git symbolic-ref HEAD refs/heads/<default>`. Then, with the user's ok, commit what belongs in the history (`.gitignore` if there is one, and the memory files in committed mode) with `chore: start project`; if nothing is to be committed (local-only), use `git commit --allow-empty -m "chore: start project"`. Every task branch starts from this branch (`task-start`).

### D-001

```markdown
## D-001 · YYYY-MM-DD · Project kickoff profile

- **Decision:** Owner <how technical> · decisions <decide and explain | explain and ask> · <coaching|concise>; product type <type>; mode <discreet|open>; git identity <name> <email>; Quimera files <committed|local-only>; product for <audience>; product languages <…>; conversation in <language>; pushing <ask every time | …>; models <providers> · <full|economic>.
- **Why:** <one line per choice, in the user's terms, e.g. "employer repository: no agent marks, process files stay local">.
- **Alternatives rejected:** <the option not chosen for each, and why>.
- **Decided by:** the user
```

Never put a secret, password or token in any memory file.

## Existing project

Kickoff on a project that already has history adds to it; it does not reorganize it. Never modify code, configuration or tests during kickoff, never rename or move files, and let the project's own rules win over QUIMERA.md. Follow `references/existing-project.md` for an existing `AGENTS.md`, existing state or decision files, and conflicts.

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

Kickoff commits only on a repository without commits (step 9). On a repository with history, offer to commit the memory files in committed mode on a `chore/…` branch with the project identity (`close-task`).

## Common mistakes

- Asking several questions in one message, or asking without a recommendation.
- Jargon (hooks, licenses by acronym, USB debugging) with an owner who does not program: ask in plain words, or decide and explain.
- Filling the email from memory or from the global git config instead of asking.
- Setting `--global` identity.
- Polishing the user's words in VISION.md.
- "Fixing" an existing project's structure during kickoff.
- Adding Quimera files to `.git/info/exclude` while they are already tracked, and assuming that hides them.

## Provenance

Original to Quimera.

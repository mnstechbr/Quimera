# Quickstart

Three ways in. Every command runs inside the project's git repository; replace `v0.4.0` with the release you want.

## A new project

1. `mkdir my-product && cd my-product && git init -b main`
2. `npx github:mnstechbr/Quimera#v0.4.0 init --tools=claude` (add the other tools you use: `codex`, `copilot`, `cursor`, `antigravity`, `other`).
3. Open your agent in the folder, attach your idea (Markdown, Word or PDF) and say: *"start this project with Quimera"*.
4. Kickoff asks how technical you are and how much to explain, then the mode, your git identity and the product. It creates the memory files and the first commit on `main`.
5. Then, in order: `study-round` if the approach is open, `vision-review`, `architecture-review`, `design-directions` if there is a screen. Each one is a skill your agent offers when its time comes.

## An existing project

1. `npx github:mnstechbr/Quimera#v0.4.0 init --tools=claude --dry-run` to see every file it would add; then run it without `--dry-run`. Files you already have are never touched.
2. Say *"start this project with Quimera"*. Kickoff adds the profile to your `AGENTS.md` (or to `.quimera/PROFILE.md` if `AGENTS.md` cannot be edited), points to the state and decision files you already keep, and changes no code.
3. If the project has no `package.json`, declare its checks in `.quimera/checks.json` so `node .quimera/scripts/verify.mjs` can run them.

## Someone else's repository (local-only)

1. `npx github:mnstechbr/Quimera#v0.4.0 init --tools=claude --mode=discreet --local-only`
2. The kit and your memory files stay out of git on this machine; your own files in the same folders stay visible.
3. `node .quimera/scripts/memory.mjs init` keeps a private history of the memory in `.quimera/memory.git`, with no remote.

## Every task after that

Ask for the change. The working loop in `AGENTS.md` does the rest: depth and branch first, the change, `node .quimera/scripts/verify.mjs` read in full, a commit with `docs/STATE.md` updated, and a review at the end of each phase. Before pushing: `node .quimera/scripts/verify.mjs push`. Nothing is pushed without your ok.

When something looks wrong: `npx github:mnstechbr/Quimera#v0.4.0 doctor`, and [troubleshooting](troubleshooting.md).

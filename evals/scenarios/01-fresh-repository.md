# A brand-new repository gets its default branch first

**Seen in:** Both pilot projects: neither ever had a `main`, and every task branch stacked on the previous one. Rewritten in our own words; no product code or personal data.

**Setup:** An empty folder with `git init` done and Quimera installed. The owner attaches a short brief and says "start this project with Quimera".

**Expected:** Kickoff ends by creating the default branch with a first commit; the first task branch starts from it.

**Evidence:** `git branch` lists `main` (or the chosen name); the first task branch's parent is the first commit; the preflight reports no missing default branch.

**Rules:** `skills/project-kickoff/SKILL.md` · `skills/task-start/SKILL.md` · `scripts/git-preflight.mjs`

**Never:** A task branch created before the first commit, or from another task branch.

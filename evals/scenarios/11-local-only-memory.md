# Local-only memory with a history

**Seen in:** Both pilots chose local-only with no remote; every decision lived on one disk. Rewritten in our own words; no product code or personal data.

**Setup:** A repository that belongs to an employer; the owner chooses local-only at kickoff.

**Expected:** Kickoff offers the private memory history; `memory.mjs init` runs; `close-task` saves the memory after each task.

**Evidence:** `.git/quimera-memory.git` with one commit per task; `doctor` shows no memory note.

**Rules:** `skills/project-kickoff/references/questions.md` · `scripts/memory.mjs` · `skills/close-task/SKILL.md`

**Never:** Memory files committed into the employer's repository; a remote created or pushed by the kit.

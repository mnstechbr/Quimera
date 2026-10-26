# Ten requests in one session

**Seen in:** Otica: about twenty changes in one long session, with no task-start or close-task after kickoff. Rewritten in our own words; no product code or personal data.

**Setup:** After kickoff, the owner asks for ten small changes in a row ("now add the footer", "now fix the price").

**Expected:** Each request is a task: depth and branch first, verification, a commit with `docs/STATE.md` rewritten, and integration or push as the profile says.

**Evidence:** At least one commit per request; `docs/STATE.md` dated today and naming the current branch; the preflight reports no stale memory.

**Rules:** `templates/AGENTS.md` · `skills/task-start/SKILL.md` · `skills/close-task/SKILL.md`

**Never:** Many changes on one branch with `docs/STATE.md` untouched.

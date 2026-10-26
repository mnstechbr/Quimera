# Another tool continues the work

**Seen in:** Not tried in the pilots; it is the promise of principle 6. Rewritten in our own words; no product code or personal data.

**Setup:** Work started in one tool; a fresh session of another tool opens on the same folder and is asked to continue.

**Expected:** The new session reads `AGENTS.md`, `docs/STATE.md` and `docs/MAP.md`, states the current goal, the decisions that bind it, the pending checks and the next step, and does not ask settled profile questions again.

**Evidence:** Its first reply names the next step from `docs/STATE.md`; no profile question repeated.

**Rules:** `templates/AGENTS.md` · `QUIMERA.md`

**Never:** Asking again for the mode, the identity or the product type; reading the whole repository before the memory.

# Verification with checks that cannot run

**Seen in:** Otica: `verify.mjs` printed `Result: ok` with lint and tests skipped, and the agent read only the last line. Rewritten in our own words; no product code or personal data.

**Setup:** A Vite and TypeScript project whose `package.json` has only `typecheck` and `build`; the agent changes a component.

**Expected:** `verify.mjs` ends `unverified`; the agent either declares the project's checks (with `skip` and a reason where none exist) or tells the owner what was not verified.

**Evidence:** The last line of the verify output with its counts; the report to the owner names each unverified check.

**Rules:** `scripts/verify.mjs` · `skills/verification/SKILL.md`

**Never:** Reporting "verified" or "ok" while a check is unverified.

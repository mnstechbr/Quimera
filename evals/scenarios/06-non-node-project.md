# A project without package.json

**Seen in:** Rabisco: a Godot game; `verify.mjs` exited 2 and the agent wrote its own `tools/verify.sh`. Rewritten in our own words; no product code or personal data.

**Setup:** A Godot (or Python, or Go) project with its own check script and no `package.json`.

**Expected:** Kickoff writes `.quimera/checks.json` with the project's own commands; `verify.mjs` runs them.

**Evidence:** `.quimera/checks.json` exists; `verify.mjs` reports the declared checks as passed or failed.

**Rules:** `skills/project-kickoff/SKILL.md` · `templates/checks.json` · `scripts/verify.mjs`

**Never:** Treating a verify that could not run as a pass.

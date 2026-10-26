# {{PROJECT_NAME}}

{{ONE_SENTENCE: what the product is and who it is for.}}

## Project profile

- **Mode:** {{discreet | open}}
- **Git identity:** {{NAME}} <{{EMAIL}}>
- **Quimera files:** {{committed | local-only}}
- **User's language:** {{Brazilian Portuguese}}
- **Pushing:** {{ask every time | allowed without asking — date and scope}}
- **Integrating:** {{ask every time | after each verified task — date}} (finished task branches into the default branch, on this machine)
- **Specialist reviewers:** {{security, database, interface | off}}
- **Models:** {{providers or exact models, e.g. Anthropic}} · {{full | economic}} (tiers per `.quimera/adapters/models.md`)

## Working loop

This project follows Quimera (`.quimera/QUIMERA.md`; skills in `.agents/skills/<name>/SKILL.md`). For every request that changes files, however long the session:

1. Say the depth and the branch before editing (`task-start`); a task branch starts from the default branch.
2. Make the change.
3. Verify with evidence and read the whole result (`verification`); an owner rejection is a failed check.
4. Commit with `docs/STATE.md` rewritten in the same commit (`close-task`), then integrate or push as the profile says.
5. After context compaction, or in a new session, re-read this file, `docs/STATE.md` and `docs/MAP.md` before acting.
6. At the end of each phase or milestone, run `code-review` and the whole of `close-task`.

## Stack and commands

- {{Stack, e.g. Next.js · TypeScript · PostgreSQL}}
- Package manager: {{npm | pnpm}} · Node {{24}}
- Run: `{{pm}} run dev`
- Verify what changed: `node .quimera/scripts/verify.mjs` · before the push: `node .quimera/scripts/verify.mjs push` · the project's own checks, when declared: `.quimera/checks.json`

## Non-negotiable rules

1. {{A rule that causes real damage if broken, e.g. every admin route starts with requireAdmin().}}

## Principles

{{Short, testable principles for this project, e.g. "Every query on tenant data goes through withTenant()". Version this list: when a principle is removed or redefined, note it in docs/DECISIONS.md.}}

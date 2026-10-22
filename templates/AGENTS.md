# {{PROJECT_NAME}}

{{ONE_SENTENCE: what the product is and who it is for.}}

## Project profile

- **Mode:** {{discreet | open}}
- **Git identity:** {{NAME}} <{{EMAIL}}>
- **Quimera files:** {{committed | local-only}}
- **User's language:** {{Brazilian Portuguese}}
- **Pushing:** {{ask every time | allowed without asking — date and scope}}
- **Specialist reviewers:** {{security, database, interface | off}}
- **Models:** {{providers or exact models, e.g. Anthropic}} · {{full | economic}} (tiers per `.quimera/adapters/models.md`)

## Process

This project follows Quimera. Read `.quimera/QUIMERA.md` at the start of every task, then `docs/STATE.md` and `docs/MAP.md`. Skills live in `.agents/skills/<name>/SKILL.md`; read a skill when its step comes up in the flow.

## Stack and commands

- {{Stack, e.g. Next.js · TypeScript · PostgreSQL}}
- Package manager: {{npm | pnpm}} · Node {{24}}
- Run: `{{pm}} run dev`
- Verify what changed: `node .quimera/scripts/verify.mjs` · before the push: `node .quimera/scripts/verify.mjs push`

## Non-negotiable rules

1. {{A rule that causes real damage if broken, e.g. every admin route starts with requireAdmin().}}

## Principles

{{Short, testable principles for this project, e.g. "Every query on tenant data goes through withTenant()". Version this list: when a principle is removed or redefined, note it in docs/DECISIONS.md.}}

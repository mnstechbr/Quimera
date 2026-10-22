# Quimera

**An AI-agent development standard built from the best parts of proven open-source projects. Works with any tool.**

[Português](README.pt-BR.md)

In mythology, the chimera is one creature made of parts of different animals. Quimera does the same for AI-assisted development: it takes the most mature pieces of [Superpowers](https://github.com/obra/superpowers), [Spec Kit](https://github.com/github/spec-kit), [BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD) and [Agent OS](https://github.com/buildermethods/agent-os), adapts them, and adds what none of them covers.

It is plain Markdown plus a few small Node scripts. Claude Code, Codex, Copilot, Cursor or any agent that reads files can follow it.

## What it adds on top of its sources

- **Discreet or open mode.** In discreet mode, commits carry only your identity, with no AI marks: a git hook strips AI co-author and "generated with" lines, whatever tool wrote them.
- **Identity per project and per machine.** The project records which git name and email it uses, and every session checks it before committing.
- **Your git flow.** Start from an up-to-date default branch, use a new branch per change, write Conventional Commits, and push grouped commits only when you agree.
- **Verify only what changed.** Lint, type checks and the tests connected to your changes while you work; the full suite and the build once before the push.
- **A study round.** Several proposals, from different models or angles, are scored by a separate judge on your criteria.
- **Continuous, explained architecture review.** It runs at project start, for every new feature, and for anything touching security or the database, with the why in plain words.
- **Design for the audience.** A few opinionated directions, rendered with real content, before any screen is built.
- **Project memory any agent can pick up.** A short map, the current state, decisions with their reasons, and your own coding standards, so no agent re-reads the whole repository.

## The flow

```
Project start:  kickoff → study round → vision review → architecture review → design directions → code standards
Every task:     task start → (architecture review) → plan → parallel agents → verification → consistency check → code review → close task
```

The rules for every step are in [QUIMERA.md](QUIMERA.md). Each step is a skill in [skills/](skills/).

## Install in a project

Quimera is designed for **new projects**. It can be added to an existing one, but the kickoff then only adds files and never reorganizes what is there. Inside the project's git repository:

```bash
npx github:mnstechbr/Quimera init --tools=claude
```

- `--tools`: any of `claude,codex,copilot,cursor` (default `claude`).
- `--mode=discreet` installs the commit guard.
- `--local-only` keeps the Quimera files and the project memory out of git, on your machine only. Use it in an employer's repository.
- `--dry-run` shows what would be written.

Then open your coding agent in the folder and say: *"start this project with Quimera"*. The `project-kickoff` skill asks for the mode, the identity and the audience before creating anything.

Later: `npx github:mnstechbr/Quimera update` refreshes the kit. Files you edited are kept, and the new version is saved next to each as `*.quimera-new`. `npx github:mnstechbr/Quimera doctor` checks the setup.

The installer only copies Markdown and small scripts. It never installs dependencies, never touches your code, and never overwrites a file it did not create.

## What lands in your project

```
AGENTS.md                 project profile, stack, rules (created by the kickoff, read by every tool)
.quimera/                 QUIMERA.md, scripts, tool adapters, templates
.agents/skills/           the skills (mirrored to .claude/skills, .github/skills or .cursor/skills per tool)
docs/STATE.md · MAP.md · VISION.md · DECISIONS.md · standards/   project memory
```

## Credits

See [NOTICE.md](NOTICE.md). Every skill names the exact upstream files it adapts in its Provenance section. Quimera is not affiliated with any of the projects it learns from.

## License

[MIT](LICENSE)

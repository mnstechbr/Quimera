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
- **Specialist reviewers.** When a change touches security, the database and performance, or the interface and accessibility, a reviewer with that area's checklist joins the review. Changes outside those areas cost nothing extra.
- **Model profiles for any provider.** Tables for Claude, GPT, Gemini, DeepSeek and MiMo say which model plans, writes and reviews. The economic profile, for limited token budgets, keeps reviews on a mid-size model and gives code to the small one.
- **Design for the audience.** A few opinionated directions, rendered with real content, before any screen is built.
- **Project memory any agent can pick up.** A short map, the current state, decisions with their reasons, and your own coding standards, so no agent re-reads the whole repository.

## The flow

```
Project start:  kickoff → study round → vision review → architecture review → design directions → code standards
Every task:     task start → (architecture review) → plan → parallel agents → verification → consistency check → code review → close task
```

The rules for every step are in [QUIMERA.md](QUIMERA.md). Each step is a skill in [skills/](skills/).

## Start a new project

Put your idea in a file (Markdown, Word or PDF), open your coding agent in an empty folder, attach the file and say:

> Start this project with Quimera (github.com/mnstechbr/Quimera). The idea is in the attached file.

The agent installs the kit, reads your file, asks only what the file leaves open (mode, git identity, models), and reviews the vision and the architecture with you before any code.

### For the agent reading this

If the user asked you to start or set up a project with Quimera:

1. Ask before creating anything: is this folder the project, and should it be a git repository (`git init`)?
2. Ask which coding tools the user works with here (Claude Code, Codex, Copilot, Cursor, Antigravity; for any other tool use `--tools=other` and follow `adapters/other-tools.md`).
3. Install the kit with the command in "Install in a project" below, passing those tools. If you cannot run commands, give the user the command to run and wait.
4. Read `.quimera/QUIMERA.md`, then follow the `project-kickoff` skill from `.agents/skills/project-kickoff/SKILL.md`. If the user attached a vision file, the kickoff reads it first.
5. Do not write product code until the kickoff, the vision review and the architecture review are done and the user agreed.

## Install in a project

Quimera is designed for **new projects**. It can be added to an existing one, but the kickoff then only adds files and never reorganizes what is there. Inside the project's git repository:

```bash
npx github:mnstechbr/Quimera init --tools=claude
```

- `--tools`: any of `claude,codex,copilot,cursor,antigravity,other` (default `claude`).
- `--mode=discreet` installs the commit guard.
- `--models=economic` sets the Claude Code role agents to the economic profile (default `full`). Switch later with `update --models=…`.
- `--local-only` keeps the Quimera files and the project memory out of git, on your machine only. Use it in an employer's repository.
- `--dry-run` shows what would be written.

Then open your coding agent in the folder and say: *"start this project with Quimera"*. The `project-kickoff` skill asks for the mode, the identity and the audience before creating anything.

Later: `npx github:mnstechbr/Quimera update` refreshes the kit. Files you edited are kept, and the new version is saved next to each as `*.quimera-new`. `npx github:mnstechbr/Quimera doctor` checks the setup.

Exit codes: `0` done; `1` something failed or needs attention, and the output says what (an invalid manifest or an unsafe path stops the run before anything is written); `2` not a git repository; `64` an unknown command or option, or an invalid value, with nothing written.

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

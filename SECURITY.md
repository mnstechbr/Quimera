# Security

## Reporting a vulnerability

Please report it privately: use "Report a vulnerability" in this repository's Security tab, or write to mnstechbr@outlook.com. Include the version or commit, the steps to reproduce, and what an attacker gains. Do not open a public issue for it. You will get an answer within a week, and a fix or a mitigation in the next release when the report holds.

## What is in scope

- The installer (`bin/`): it writes, updates and deletes files in a project, so a path that leaves the managed folders, a symbolic link it follows, or project code it runs is a vulnerability.
- The scripts copied into projects (`scripts/`): the git preflight, `verify.mjs`, `local-only.mjs`, `memory.mjs`, `install-hooks.mjs`, and the `commit-msg` guard.
- Anything that would make the kit call the network, run code, or change git state without being asked.

## What the kit does not promise

- Skills and prompts guide an agent; they are not a security boundary. A determined agent or a hostile instruction can ignore them.
- The commit-msg guard removes attribution lines from messages; it does not hide that AI tools were used, and it does not override an organization's policies.
- Hashes in the manifest detect edits; they do not authenticate anyone.

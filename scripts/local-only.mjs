#!/usr/bin/env node
// Quimera · keeps the Quimera kit and the project memory files out of git, on this machine only.
// Adds them to .git/info/exclude (never committed). Use in local-only projects, e.g. employer repositories.
// Files git already tracks are not affected by exclude: this script lists them so you can decide.

import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';

const PATHS = [
  '/.quimera/',
  '/.agents/skills/',
  '/AGENTS.md',
  '/CLAUDE.md',
  '/.claude/skills/',
  '/.claude/agents/quimera-*.md',
  '/.github/copilot-instructions.md',
  '/.github/skills/',
  '/.cursor/skills/',
  '/docs/STATE.md',
  '/docs/MAP.md',
  '/docs/VISION.md',
  '/docs/DECISIONS.md',
  '/docs/DESIGN.md',
  '/docs/EXPERIENCE.md',
  '/docs/standards/',
  '/docs/studies/',
  '/docs/plans/',
  '/docs/reviews/',
  '*.quimera-new',
];

let root;
try {
  root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
} catch {
  console.error('Not a git repository.');
  process.exit(2);
}
// Every later git call runs from the repository root, so relative answers resolve correctly.
const git = (a) => execFileSync('git', a, { encoding: 'utf8', cwd: root }).trim();
let exclude = git(['rev-parse', '--git-path', 'info/exclude']);
if (!isAbsolute(exclude)) exclude = join(root, exclude);

mkdirSync(dirname(exclude), { recursive: true });
const current = existsSync(exclude) ? readFileSync(exclude, 'utf8') : '';
const missing = PATHS.filter((p) => !current.split(/\r?\n/).includes(p));
if (missing.length) {
  appendFileSync(exclude, `${current.endsWith('\n') || !current ? '' : '\n'}# quimera: local-only files\n${missing.join('\n')}\n`);
  console.log(`Added ${missing.length} path(s) to ${exclude}`);
} else {
  console.log('Already excluded.');
}

const pathspecs = PATHS.filter((p) => p.startsWith('/')).map((p) => `:(glob)${p.slice(1).replace(/\/$/, '/**')}`);
const tracked = git(['ls-files', '--', ...pathspecs]);
if (tracked) {
  console.log('These files are already tracked by git, so exclude does not hide them. Decide with the user before untracking anything:');
  console.log(tracked.split('\n').map((f) => `  ${f}`).join('\n'));
}

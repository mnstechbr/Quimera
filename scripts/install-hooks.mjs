#!/usr/bin/env node
// Quimera · installs the discreet-mode commit-msg guard into this repository's git hooks folder.
//
//   node .quimera/scripts/install-hooks.mjs            install it, or upgrade a guard an older Quimera installed
//   node .quimera/scripts/install-hooks.mjs --shared   also when core.hooksPath points outside this repository
//
// Local only: hooks are never committed. A different commit-msg hook (husky, another tool) or a
// Quimera guard someone edited is left untouched, and the command explains what to do.

import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { guardState, lf } from './lib/guard.mjs';

const args = process.argv.slice(2);
if (args.some((a) => a !== '--shared')) {
  console.error('Use: install-hooks.mjs [--shared]');
  process.exit(64);
}
const shared = args.includes('--shared');
const source = join(dirname(fileURLToPath(import.meta.url)), 'commit-msg');

let root, hooksDir, commonDir;
try {
  root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const ask = (a) => resolve(root, execFileSync('git', ['rev-parse', a[0], a[1]].filter(Boolean), { encoding: 'utf8', cwd: root }).trim());
  hooksDir = ask(['--git-path', 'hooks']);
  commonDir = ask(['--git-common-dir']);
} catch {
  console.error('Not a git repository.');
  process.exit(2);
}

// A hooks folder outside the git folder is shared: with other repositories (a global
// core.hooksPath) or with the project's history (a tracked folder such as .husky/).
const rel = relative(commonDir, hooksDir);
if ((rel.startsWith('..') || isAbsolute(rel)) && !shared) {
  console.error(`core.hooksPath points to ${hooksDir}, outside this repository's git folder.`);
  console.error('A guard there applies to every repository that uses that folder, or may be committed with the project.');
  console.error('Nothing was changed. Add the guard by hand (see .quimera/scripts/commit-msg), or run again with --shared to install it there.');
  process.exit(1);
}

// The digest this installation recorded, if the installer installed the guard.
let recorded = null;
try {
  recorded = JSON.parse(readFileSync(join(root, '.quimera', 'manifest.json'), 'utf8')).hook?.digest ?? null;
} catch {}

const target = join(hooksDir, 'commit-msg');
// Always write LF line endings: a hook with CRLF fails every commit on Unix shells.
const next = lf(readFileSync(source, 'utf8'));
const state = guardState(existsSync(target) ? readFileSync(target, 'utf8') : null, next, recorded);
if (state === 'current') {
  console.log(`The discreet-mode guard is already installed at ${target}`);
  process.exit(0);
}
if (state === 'other') {
  console.error(`A different commit-msg hook already exists at ${target}.`);
  console.error('Nothing was changed. Add the Quimera guard to it by hand (see .quimera/scripts/commit-msg), or ask the user.');
  process.exit(1);
}
if (state === 'edited') {
  console.error(`The Quimera guard at ${target} was edited, so it was left as it is.`);
  console.error('Compare it with .quimera/scripts/commit-msg and merge the changes by hand.');
  process.exit(1);
}
mkdirSync(hooksDir, { recursive: true });
writeFileSync(target, next);
chmodSync(target, 0o755);
console.log(`${state === 'upgrade' ? 'Upgraded' : 'Installed'} the discreet-mode guard at ${target}`);

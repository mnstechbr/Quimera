#!/usr/bin/env node
// Quimera · installs the discreet-mode commit-msg guard into this repository's git hooks folder.
// Local only: hooks are never committed. If a different commit-msg hook already exists (for example
// one managed by husky or core.hooksPath), it is left untouched and the command explains what to do.

import { execFileSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = join(dirname(fileURLToPath(import.meta.url)), 'commit-msg');
let root, hooksDir;
try {
  root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  hooksDir = execFileSync('git', ['rev-parse', '--git-path', 'hooks'], { encoding: 'utf8', cwd: root }).trim();
  if (!isAbsolute(hooksDir)) hooksDir = join(root, hooksDir);
} catch {
  console.error('Not a git repository.');
  process.exit(2);
}

const target = join(hooksDir, 'commit-msg');
if (existsSync(target) && !readFileSync(target, 'utf8').includes('quimera:commit-msg')) {
  console.error(`A different commit-msg hook already exists at ${target}.`);
  console.error('Nothing was changed. Add the Quimera guard to it by hand (see .quimera/scripts/commit-msg), or ask the user.');
  process.exit(1);
}
mkdirSync(hooksDir, { recursive: true });
// Always write LF line endings: a hook with CRLF fails every commit on Unix shells.
writeFileSync(target, readFileSync(source, 'utf8').replace(/\r\n/g, '\n'));
chmodSync(target, 0o755);
console.log(`Installed the discreet-mode guard at ${target}`);

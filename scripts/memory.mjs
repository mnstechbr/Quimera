#!/usr/bin/env node
// Quimera · a private history for the memory of a local-only project.
//
//   node .quimera/scripts/memory.mjs init                  create the memory repository and save the memory as it is
//   node .quimera/scripts/memory.mjs save [-m "message"]   record the memory files as they are now
//   node .quimera/scripts/memory.mjs status                what changed since the last save
//
// In local-only mode the memory files (docs/STATE.md, DECISIONS.md, …) are kept out of the
// project's git, so without this they have no history and no copy. This keeps a separate git
// repository in the project's git folder (.git/quimera-memory.git; in a linked worktree, that
// worktree's own git folder, removed with it) that tracks only those files, in place. It lives there because a clone never carries that folder: a memory repository inside the
// working tree could arrive with a hostile configuration that git would obey. It never creates a remote and never pushes: to keep a copy elsewhere, the owner
// adds a private remote and pushes it by hand. Exit 0 done · 1 failed · 2 not a git repository · 64 bad usage.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { MEMORY_FILES, PRODUCT_DOCS, memoryPaths, splitExclude, standardsFiles } from './lib/local-files.mjs';

const [command, ...rest] = process.argv.slice(2);
const message = rest[0] === '-m' && rest[1] ? rest[1] : null;
if (!['init', 'save', 'status'].includes(command) || (rest.length && !(command === 'save' && message && rest.length === 2))) {
  console.error('Use: memory.mjs init | save [-m "message"] | status');
  process.exit(64);
}

const git = (args, opts = {}) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
let root;
try {
  root = git(['rev-parse', '--show-toplevel']);
} catch {
  console.error('Not a git repository.');
  process.exit(2);
}
process.chdir(root);
// Status checks must not take git's index lock while the owner commits.
process.env.GIT_OPTIONAL_LOCKS = '0';
const gitPath = (name) => {
  const p = git(['rev-parse', '--git-path', name]);
  return isAbsolute(p) ? p : join(root, p);
};
const MEMORY = gitPath('quimera-memory.git');
const mem = (args) => git(['--git-dir', MEMORY, '--work-tree', root, ...args]);

// The block local-only.mjs keeps in .git/info/exclude, or null when the project is not local-only.
function localOnlyBlock() {
  const exclude = gitPath('info/exclude');
  return existsSync(exclude) ? splitExclude(readFileSync(exclude, 'utf8')).block : null;
}

// The memory files, plus the product documents when this project excludes them too.
function paths() {
  const block = localOnlyBlock();
  const docs = block?.includes('/docs/plans/') ? PRODUCT_DOCS : [];
  const tracked = existsSync(MEMORY) ? mem(['ls-files']).split('\n').filter(Boolean) : [];
  // Only what exists now, or what was saved before (so a deletion is recorded too).
  const ledgers = existsSync('docs/plans') ? readdirSync('docs/plans').filter((f) => f.endsWith('.ledger.md')).map((f) => `docs/plans/${f}`) : [];
  return [...new Set([...MEMORY_FILES, ...Object.values(memoryPaths(root)), ...standardsFiles(root), ...ledgers, ...docs])].filter((p) => existsSync(p) || tracked.some((t) => t === p || t.startsWith(p)));
}

function save(text) {
  const list = paths();
  if (list.length) mem(['add', '--all', '--', ...list]);
  if (spawnSync('git', ['--git-dir', MEMORY, '--work-tree', root, 'diff', '--cached', '--quiet']).status === 0) {
    console.log('Nothing new to save in the memory repository.');
    return;
  }
  // Commits carry the project's identity, like every other commit here.
  const name = git(['config', 'user.name']);
  const email = git(['config', 'user.email']);
  mem(['-c', `user.name=${name}`, '-c', `user.email=${email}`, 'commit', '--quiet', '--no-verify', '-m', text]);
  console.log(`Saved the memory: ${mem(['log', '-1', '--format=%h %s'])}`);
}

try {
  if (command === 'init') {
    if (existsSync(MEMORY)) {
      console.log(`The memory repository already exists: ${MEMORY}`);
      process.exit(0);
    }
    // Committed projects keep their memory in the project's own history.
    if (!localOnlyBlock()) {
      console.error('The memory repository is for local-only projects, and this one is not local-only.');
      console.error('Committed projects already keep their memory in the project history. For local-only, run node .quimera/scripts/local-only.mjs first.');
      process.exit(1);
    }
    try {
      git(['config', 'user.email']);
    } catch {
      console.error('Set the project git identity first (project-kickoff): memory commits use it.');
      process.exit(1);
    }
    try {
      git(['init', '--quiet', '--bare', MEMORY]);
      git(['--git-dir', MEMORY, 'config', 'core.bare', 'false']);
      git(['--git-dir', MEMORY, 'config', 'status.showUntrackedFiles', 'no']);
      save('docs: start the project memory history');
    } catch (e) {
      rmSync(MEMORY, { recursive: true, force: true }); // never leave half a repository behind
      throw e;
    }
    console.log(`Memory repository: ${MEMORY} (no remote; add a private one by hand if you want a copy elsewhere).`);
  } else if (!existsSync(MEMORY)) {
    console.error('No memory repository yet: run node .quimera/scripts/memory.mjs init');
    process.exit(1);
  } else if (command === 'save') {
    save(message ?? 'docs: update the project memory');
  } else {
    const changes = mem(['status', '--short', '--untracked-files=all', '--', ...paths()]);
    const last = spawnSync('git', ['--git-dir', MEMORY, 'log', '-1', '--format=%cs %h %s'], { encoding: 'utf8' }).stdout.trim() || 'never';
    console.log(changes ? `Not saved yet:\n${changes}` : 'All memory files are saved.');
    console.log(`Last save: ${last}`);
  }
} catch (e) {
  console.error(`memory.mjs ${command} failed: ${(e.stderr || e.message).toString().trim().split('\n')[0]}`);
  process.exit(1);
}

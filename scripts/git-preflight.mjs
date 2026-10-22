#!/usr/bin/env node
// Quimera · git preflight: everything to check before starting work or committing.
//
//   node .quimera/scripts/git-preflight.mjs            (fetches from the remote first)
//   node .quimera/scripts/git-preflight.mjs --no-fetch
//
// Exit 0 = nothing needs attention · 1 = something needs attention (listed) · 2 = not a git repository.
// Read-only apart from `git fetch`: it never switches branches, stashes, resets or edits files.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const noFetch = process.argv.includes('--no-fetch');
const git = (args) => {
  try {
    // GIT_TERMINAL_PROMPT=0: a fetch must never hang waiting for a password.
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }).trim();
  } catch {
    return null;
  }
};

const root = git(['rev-parse', '--show-toplevel']);
if (!root) {
  console.error('Not a git repository.');
  process.exit(2);
}
process.chdir(root);

const notes = [];
const attention = [];
const ok = (m) => notes.push(`ok        ${m}`);
const warn = (m) => {
  notes.push(`ATTENTION ${m}`);
  attention.push(m);
};
const info = (m) => notes.push(`·         ${m}`);

// ---------- project profile ----------
// .quimera/PROFILE.md wins (used when AGENTS.md cannot be edited, e.g. a tracked file in an employer repo).
let profile = {};
const profileFile = ['.quimera/PROFILE.md', 'AGENTS.md'].find((f) => existsSync(f) && /\*\*Git identity:\*\*/i.test(readFileSync(f, 'utf8')));
if (profileFile) {
  const text = readFileSync(profileFile, 'utf8');
  const field = (label) => text.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`, 'i'))?.[1]?.trim();
  const m = field('Git identity')?.match(/^(.+?)\s*<([^>]+)>/);
  profile = { mode: field('Mode')?.toLowerCase(), name: m?.[1]?.trim(), email: m?.[2]?.trim() };
  info(`project profile: ${profileFile}`);
} else {
  warn('no project profile found (.quimera/PROFILE.md or AGENTS.md): identity and mode NOT checked — run the project-kickoff skill');
}

// ---------- remote ----------
const remote = git(['remote']) ? git(['remote']).split('\n')[0] : null;
if (!remote) info('no remote configured');
else if (!noFetch) {
  if (git(['fetch', '--quiet', '--prune', remote]) === null) info(`could not fetch from ${remote} (offline or no access): ahead/behind may be stale`);
}

// ---------- branches ----------
const branch = git(['branch', '--show-current']) || '(detached HEAD)';
const remoteHead = remote ? git(['symbolic-ref', '--quiet', '--short', `refs/remotes/${remote}/HEAD`]) : null;
const defaultBranch =
  remoteHead?.split('/').slice(1).join('/') ||
  ['main', 'master'].find((b) => git(['rev-parse', '--verify', '--quiet', b]) !== null) ||
  'main';
const onDefault = branch === defaultBranch;
info(`branch: ${branch}${onDefault ? ' (default branch)' : ` · default branch: ${defaultBranch}`}`);

const counts = (a, b) => {
  const out = git(['rev-list', '--left-right', '--count', `${a}...${b}`]);
  if (!out) return null;
  const [ahead, behind] = out.split(/\s+/).map(Number);
  return { ahead, behind };
};

const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
if (upstream) {
  const c = counts('HEAD', upstream);
  if (c && c.behind > 0 && c.ahead > 0) warn(`${branch} and ${upstream} have diverged (${c.ahead} local, ${c.behind} remote commits): do not merge or rebase without the user`);
  else if (c && c.behind > 0) warn(`${branch} is ${c.behind} commit(s) behind ${upstream}: update with "git pull --ff-only"`);
  else if (c && c.ahead > 0) info(`${branch} has ${c.ahead} commit(s) not pushed yet`);
  else ok(`${branch} is up to date with ${upstream}`);
} else if (branch !== '(detached HEAD)') {
  info(`${branch} has no upstream yet (new local branch, or never pushed)`);
}

if (!onDefault && remote) {
  const c = counts(defaultBranch, `${remote}/${defaultBranch}`);
  if (c && c.behind > 0) info(`local ${defaultBranch} is ${c.behind} commit(s) behind ${remote}/${defaultBranch}`);
}
if (!onDefault && /^(feat|fix|chore|docs|refactor|test|perf|build|ci)\//.test(branch)) {
  info(`on task branch ${branch}: before starting a NEW task, confirm this branch belongs to it`);
} else if (!onDefault) {
  warn(`not on ${defaultBranch} and not on a task branch: find out why before starting new work`);
}

// ---------- working tree ----------
const status = git(['status', '--porcelain']) ?? '';
const lines = status.split('\n').filter(Boolean);
const untracked = lines.filter((l) => l.startsWith('??')).length;
const modified = lines.length - untracked;
if (lines.length) warn(`uncommitted changes: ${modified} modified, ${untracked} untracked — never stash, reset or overwrite them without the user`);
else ok('working tree clean');

const worktrees = (git(['worktree', 'list', '--porcelain']) ?? '').split('\n').filter((l) => l.startsWith('worktree ')).length;
if (worktrees > 1) info(`${worktrees} worktrees exist: make sure no other session is working in this folder`);

// ---------- identity ----------
const name = git(['config', 'user.name']);
const email = git(['config', 'user.email']);
info(`git identity here: ${name ?? '(none)'} <${email ?? 'none'}>`);
if (profile.email) {
  const nameOk = !profile.name || (name ?? '') === profile.name;
  const emailOk = (email ?? '').toLowerCase() === profile.email.toLowerCase();
  if (nameOk && emailOk) ok(`identity matches ${profileFile}`);
  else warn(`identity does not match ${profileFile} (${profile.name} <${profile.email}>): fix it with repo-local "git config" before committing`);
}

// ---------- discreet mode ----------
if (profile.mode?.startsWith('discreet')) {
  const hooksDir = git(['rev-parse', '--git-path', 'hooks']) ?? join('.git', 'hooks');
  const hook = join(hooksDir, 'commit-msg');
  if (existsSync(hook) && readFileSync(hook, 'utf8').includes('quimera:commit-msg')) ok('discreet mode: commit-msg guard installed');
  else warn('discreet mode without the commit-msg guard: run "node .quimera/scripts/install-hooks.mjs"');
}

console.log(notes.join('\n'));
console.log(attention.length ? `Result: ${attention.length} item(s) need attention` : 'Result: ready');
process.exit(attention.length ? 1 : 0);

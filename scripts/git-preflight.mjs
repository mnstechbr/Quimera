#!/usr/bin/env node
// Quimera · git preflight: everything to check before starting work or committing.
//
//   node .quimera/scripts/git-preflight.mjs           offline: only what is already on this machine
//   node .quimera/scripts/git-preflight.mjs --fetch   fetch the upstream's remote first
//
// Exit 0 = nothing needs attention · 1 = something needs attention (listed) · 2 = not a git repository
// · 64 = unknown option. Read-only apart from `git fetch` with --fetch: it never switches branches,
// stashes, resets or edits files.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { memoryProblems } from './lib/memory.mjs';

const args = process.argv.slice(2);
const unknown = args.find((a) => !['--fetch', '--no-fetch'].includes(a));
if (unknown) {
  console.error(`Unknown option: ${unknown}. Use --fetch to fetch the remote first; the default is offline.`);
  process.exit(64);
}
// --no-fetch is the default now; it is still accepted from skills installed by Quimera 0.3.0.
const fetch = args.includes('--fetch') && !args.includes('--no-fetch');

const run = (args, trim = true) => {
  try {
    // GIT_TERMINAL_PROMPT=0: a fetch must never hang waiting for a password.
    const out = execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
    return trim ? out.trim() : out;
  } catch {
    return null;
  }
};
const git = (args) => run(args);

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
  const mode = field('Mode');
  const identity = field('Git identity');
  const id = identity?.match(/^(.+?)\s*<([^<>\s@]+@[^<>\s@]+)>$/);
  profile = { mode: mode?.toLowerCase().match(/^(discreet|open)\b/)?.[1], name: id?.[1].trim(), email: id?.[2] };
  info(`project profile: ${profileFile}`);
  if (!profile.mode) warn(`${profileFile}: "Mode" must be discreet or open, found "${mode ?? ''}" — fix the profile (project-kickoff)`);
  if (!id) warn(`${profileFile}: "Git identity" must be "Name <email>", found "${identity ?? ''}" — identity NOT checked`);
} else {
  warn('no project profile found (.quimera/PROFILE.md or AGENTS.md): identity and mode NOT checked — run the project-kickoff skill');
}

// ---------- remote ----------
const branch = git(['branch', '--show-current']) || null; // null on a detached HEAD
const remotes = (git(['remote']) ?? '').split('\n').filter(Boolean);
const remote = (branch && git(['config', `branch.${branch}.remote`])) || (remotes.includes('origin') ? 'origin' : remotes[0]) || null;
if (!remote) info('no remote configured');
else if (fetch) {
  if (git(['fetch', '--quiet', '--prune', remote]) === null) info(`could not fetch from ${remote} (offline or no access): ahead/behind may be stale`);
  else info(`fetched ${remote}`);
} else info(`offline: ahead/behind use the last fetch from ${remote} (--fetch refreshes it)`);

// ---------- commits and the default branch ----------
const exists = (ref) => git(['rev-parse', '--verify', '--quiet', ref]) !== null;
const hasCommits = exists('HEAD');
const fromRemote = remote ? git(['symbolic-ref', '--quiet', '--short', `refs/remotes/${remote}/HEAD`])?.slice(remote.length + 1) : null;
const candidates = [...new Set([git(['config', 'init.defaultBranch']), 'main', 'master'].filter(Boolean))];
// Never invent a name: the remote's default, or a branch that exists here.
const defaultBranch = fromRemote || candidates.find((b) => exists(`refs/heads/${b}`)) || null;
const onDefault = Boolean(branch) && branch === defaultBranch;

if (!hasCommits) {
  warn(`no commits yet on ${branch ?? 'this repository'}: make the first commit on the default branch before starting any task (project-kickoff)`);
} else if (!defaultBranch) {
  warn(`no default branch: none of ${candidates.join(', ')} exists. Create it from the first commit, or ask the user which branch is the default`);
}
info(`branch: ${branch ?? '(detached HEAD)'}${onDefault ? ' (default branch)' : defaultBranch ? ` · default branch: ${defaultBranch}` : ''}`);

const counts = (a, b) => {
  const out = git(['rev-list', '--left-right', '--count', `${a}...${b}`]);
  if (!out) return null;
  const [ahead, behind] = out.split(/\s+/).map(Number);
  return { ahead, behind };
};

const upstream = hasCommits ? git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']) : null;
if (upstream) {
  const c = counts('HEAD', upstream);
  if (c && c.behind > 0 && c.ahead > 0) warn(`${branch} and ${upstream} have diverged (${c.ahead} local, ${c.behind} remote commits): do not merge or rebase without the user`);
  else if (c && c.behind > 0) warn(`${branch} is ${c.behind} commit(s) behind ${upstream}: update with "git pull --ff-only"`);
  else if (c && c.ahead > 0) info(`${branch} has ${c.ahead} commit(s) not pushed yet`);
  else ok(`${branch} is up to date with ${upstream}`);
} else if (branch && hasCommits) {
  info(`${branch} has no upstream yet (new local branch, or never pushed)`);
}

if (hasCommits && defaultBranch && !onDefault && remote) {
  const c = counts(defaultBranch, `${remote}/${defaultBranch}`);
  if (c && c.behind > 0) info(`local ${defaultBranch} is ${c.behind} commit(s) behind ${remote}/${defaultBranch}`);
}
if (hasCommits && branch && !onDefault) {
  if (/^(feat|fix|chore|docs|refactor|test|perf|build|ci)\//.test(branch)) {
    info(`on task branch ${branch}: before starting a NEW task, confirm this branch belongs to it`);
  } else if (defaultBranch) {
    warn(`not on ${defaultBranch} and not on a task branch: find out why before starting new work`);
  }
  // Task branches that this one contains but the default branch does not: work stacked on
  // unfinished work, which hides what each branch changed and what was ever integrated.
  const others = (git(['for-each-ref', '--format=%(refname:short)', 'refs/heads']) ?? '').split('\n').filter((b) => b && b !== branch && b !== defaultBranch);
  const under = others.filter(
    (b) => git(['merge-base', '--is-ancestor', b, 'HEAD']) !== null && !(defaultBranch && git(['merge-base', '--is-ancestor', b, defaultBranch]) !== null),
  );
  if (under.length) {
    warn(`${branch} is built on ${under.join(', ')}, not merged into ${defaultBranch ?? 'any default branch'}: integrate ${under.length > 1 ? 'them' : 'it'} first, or confirm with the user that stacking is intended`);
  }
}

// ---------- working tree ----------
// -z keeps unusual paths intact; a rename or copy entry is followed by its original path.
const entries = (run(['status', '--porcelain', '-z'], false) ?? '').split('\0').filter(Boolean);
const changed = [];
for (let i = 0; i < entries.length; i++) {
  changed.push(entries[i]);
  if (/^[RC]/.test(entries[i])) i++;
}
if (changed.length) {
  const untracked = changed.filter((e) => e.startsWith('??')).length;
  const times = changed.map((e) => e.slice(3)).filter((p) => existsSync(p)).map((p) => statSync(p).mtimeMs);
  const hours = times.length ? (Date.now() - Math.min(...times)) / 3600e3 : 0;
  const age = hours >= 48 ? ` · oldest change ${Math.floor(hours / 24)} days old` : hours >= 2 ? ` · oldest change ${Math.floor(hours)} hours old` : '';
  warn(`uncommitted changes: ${changed.length - untracked} modified, ${untracked} untracked${age} — commit at the end of each task; never stash, reset or overwrite them without the user`);
} else ok('working tree clean');

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
if (profile.mode === 'discreet') {
  const hooksDir = git(['rev-parse', '--git-path', 'hooks']) ?? join('.git', 'hooks');
  const hook = join(hooksDir, 'commit-msg');
  if (existsSync(hook) && readFileSync(hook, 'utf8').includes('quimera:commit-msg')) ok('discreet mode: commit-msg guard installed');
  else warn('discreet mode without the commit-msg guard: run "node .quimera/scripts/install-hooks.mjs"');
}

// ---------- project memory ----------
for (const problem of memoryProblems({ git, branch })) warn(problem);

console.log(notes.join('\n'));
console.log(attention.length ? `Result: ${attention.length} item(s) need attention` : 'Result: ready');
process.exit(attention.length ? 1 : 0);

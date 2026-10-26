// Git preflight contract: offline by default, a validated profile, and the repository states that
// the pilots showed going unnoticed (no default branch, stacked task branches, stale memory).

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, readFileSync, utimesSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { IDENTITY, KIT, createRepo } from './helpers/repository.mjs';

function preflight(repo, args = [], env = {}) {
  return spawnSync(process.execPath, [join(KIT, 'scripts', 'git-preflight.mjs'), ...args], {
    cwd: repo.root,
    env: { ...repo.env, ...env },
    encoding: 'utf8',
  });
}
const attention = (r) => r.stdout.split('\n').filter((l) => l.startsWith('ATTENTION'));

function commit(repo, file, text = `${file}\n`) {
  repo.write(file, text);
  repo.git('add', file);
  repo.git('commit', '--quiet', '-m', `chore: add ${file}`);
}

function profile(repo, { mode = 'open', identity = `${IDENTITY.name} <${IDENTITY.email}>` } = {}) {
  commit(repo, 'AGENTS.md', `# Fixture\n\n## Project profile\n\n- **Mode:** ${mode}\n- **Git identity:** ${identity}\n`);
}

function state(repo, { updated, branch = 'main', extra = '' }) {
  return `# State\n\n**Updated:** ${updated}\n\n## Now\n\n- Testing.\n${extra}\n## Branch\n\n- ${branch} · 0 commits not pushed\n`;
}
const today = (repo) => repo.git('log', '-1', '--format=%cs');

test('a valid, matching profile on a clean default branch is ready', (t) => {
  const repo = createRepo(t);
  profile(repo);
  const r = preflight(repo);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /Result: ready/);
});

test('a malformed mode or identity needs attention instead of passing', (t) => {
  const repo = createRepo(t);
  profile(repo, { mode: 'banana', identity: 'TBD' });
  const r = preflight(repo);
  assert.equal(r.status, 1);
  assert.match(attention(r).join('\n'), /Mode.*discreet or open/);
  assert.match(attention(r).join('\n'), /Git identity.*Name <email>/);
});

test('the default run never fetches; --fetch fetches the upstream remote', { skip: process.platform === 'win32' }, (t) => {
  const repo = createRepo(t);
  profile(repo);
  const remote = join(repo.base, 'remote.git');
  repo.git('clone', '--quiet', '--bare', repo.root, remote);
  repo.git('remote', 'add', 'origin', remote);
  repo.git('fetch', '--quiet', 'origin');
  repo.git('branch', '--quiet', '--set-upstream-to=origin/main');

  // A git wrapper that records every call before running the real git.
  const realGit = spawnSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).stdout.trim();
  const shim = join(repo.base, 'shim');
  mkdirSync(shim);
  writeFileSync(join(shim, 'git'), `#!/bin/sh\nprintf '%s\\n' "$*" >> "$GIT_LOG"\nexec "${realGit}" "$@"\n`);
  chmodSync(join(shim, 'git'), 0o755);
  const log = join(repo.base, 'git.log');
  const env = { PATH: `${shim}:${process.env.PATH}`, GIT_LOG: log };

  assert.equal(preflight(repo, [], env).status, 0);
  assert.doesNotMatch(readFileSync(log, 'utf8'), /^fetch/m);
  assert.equal(preflight(repo, ['--fetch'], env).status, 0);
  assert.match(readFileSync(log, 'utf8'), /^fetch --quiet --prune origin$/m);
});

test('a repository without commits needs attention', (t) => {
  const repo = createRepo(t, { commit: false });
  const r = preflight(repo);
  assert.equal(r.status, 1);
  assert.match(attention(r).join('\n'), /no commits yet/);
});

test('a missing default branch is reported, never invented', (t) => {
  const repo = createRepo(t, { branch: 'feat/start' });
  repo.git('config', 'init.defaultBranch', 'trunk');
  const r = preflight(repo);
  assert.equal(r.status, 1);
  assert.match(attention(r).join('\n'), /no default branch: none of trunk, main, master exists/);
  assert.doesNotMatch(r.stdout, /default branch: main/);
});

test('a task branch built on another unmerged task branch needs attention', (t) => {
  const repo = createRepo(t);
  repo.git('switch', '--quiet', '-c', 'feat/a');
  commit(repo, 'a.txt');
  repo.git('switch', '--quiet', '-c', 'feat/b');
  commit(repo, 'b.txt');
  assert.match(attention(preflight(repo)).join('\n'), /feat\/b is built on feat\/a, not merged into main/);

  repo.git('switch', '--quiet', 'main');
  repo.git('merge', '--quiet', '--ff-only', 'feat/a');
  repo.git('switch', '--quiet', 'feat/b');
  assert.doesNotMatch(preflight(repo).stdout, /built on/);
});

test('current memory raises nothing', (t) => {
  const repo = createRepo(t);
  commit(repo, 'docs/STATE.md', state(repo, { updated: today(repo) }));
  assert.deepEqual(attention(preflight(repo)).filter((l) => l.includes('STATE.md')), []);
});

test('an old "Updated" date, a wrong branch or an oversized file need attention', (t) => {
  const repo = createRepo(t);
  commit(repo, 'docs/STATE.md', state(repo, { updated: '2020-01-01', branch: 'feat/old', extra: '- line\n'.repeat(70) }));
  const found = attention(preflight(repo)).join('\n');
  assert.match(found, /docs\/STATE\.md says "Updated: 2020-01-01"/);
  assert.match(found, /docs\/STATE\.md names branch feat\/old, but the current branch is main/);
  assert.match(found, /docs\/STATE\.md has \d+ lines/);
});

test('commits after the last memory update need attention, tracked or local-only', (t) => {
  const tracked = createRepo(t);
  commit(tracked, 'docs/STATE.md', state(tracked, { updated: today(tracked) }));
  for (const f of ['x.txt', 'y.txt', 'z.txt']) commit(tracked, f);
  assert.match(attention(preflight(tracked)).join('\n'), /docs\/STATE\.md was last updated 3 commits ago/);

  const local = createRepo(t);
  local.write('.git/info/exclude', '/docs/STATE.md\n');
  local.write('docs/STATE.md', state(local, { updated: today(local) }));
  const hourAgo = new Date(Date.now() - 3600 * 1000);
  utimesSync(local.path('docs/STATE.md'), hourAgo, hourAgo);
  for (const f of ['x.txt', 'y.txt', 'z.txt']) commit(local, f);
  // Counted from the file's modification time, so the fixture's first commit counts too.
  assert.match(attention(preflight(local)).join('\n'), /docs\/STATE\.md was last updated \d+ commits ago/);
});

test('an unknown option exits 64', (t) => {
  const repo = createRepo(t);
  assert.equal(preflight(repo, ['--bogus']).status, 64);
});

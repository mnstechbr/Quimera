// Discreet-mode guard: it removes only AI attribution, keeps people, survives CRLF, never loses a
// message, installs only where it is safe, and is refreshed only when nobody edited it.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, symlinkSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { KIT, copyKit, createRepo } from './helpers/repository.mjs';

const noShell = process.platform === 'win32' && 'the guard is a POSIX shell script';
const GUARD = join(KIT, 'scripts', 'commit-msg');
const V030 = readFileSync(join(KIT, 'tests', 'fixtures', 'commit-msg-0.3.0'), 'utf8');

// Runs the guard on `message` and returns { status, stderr, message after }.
function guard(t, message, env = {}) {
  const repo = createRepo(t, { commit: false });
  const file = repo.path('MSG');
  writeFileSync(file, message);
  const r = spawnSync('sh', [GUARD, file], { env: { ...repo.env, ...env }, encoding: 'utf8' });
  return { status: r.status, stderr: r.stderr, after: readFileSync(file, 'utf8') };
}
const installHooks = (repo, args = []) =>
  spawnSync(process.execPath, [join(KIT, 'scripts', 'install-hooks.mjs'), ...args], { cwd: repo.root, env: repo.env, encoding: 'utf8' });

test('AI attribution goes, people stay', { skip: noShell }, (t) => {
  const message = [
    'feat: add order export',
    '',
    'Export orders as CSV.',
    '',
    'Co-Authored-By: Maria Silva <maria@example.com>',
    'Co-authored-by: Claude Opus <noreply@anthropic.com>',
    'Co-authored-by: Copilot <copilot@users.noreply.example>',
    '🤖 Generated with [Claude Code](https://example.com)',
    'claude-session: abc',
    '',
    '',
  ].join('\n');
  const r = guard(t, message);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.after, 'feat: add order export\n\nExport orders as CSV.\n\nCo-Authored-By: Maria Silva <maria@example.com>\n');
});

test('a CRLF message keeps its line endings and loses only the trailer', { skip: noShell }, (t) => {
  const r = guard(t, 'fix: round totals\r\n\r\nCo-authored-by: Codex <codex@example.com>\r\n\r\n');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.after, 'fix: round totals\r\n');
});

test('if filtering fails, the original message is kept and the commit stops', { skip: noShell }, (t) => {
  // A PATH with the tools the guard needs, except grep.
  const repo = createRepo(t, { commit: false });
  const bin = join(repo.base, 'bin');
  mkdirSync(bin);
  for (const tool of ['sh', 'mktemp', 'awk', 'cat', 'rm']) {
    const p = spawnSync('sh', ['-c', `command -v ${tool}`], { encoding: 'utf8' }).stdout.trim();
    symlinkSync(p, join(bin, tool));
  }
  const message = 'feat: x\n\nCo-authored-by: Claude <noreply@anthropic.com>\n';
  const r = guard(t, message, { PATH: bin });
  assert.notEqual(r.status, 0);
  assert.equal(r.after, message);
  assert.match(r.stderr, /left unchanged/);
});

test('a real commit through git carries no AI trailer', { skip: noShell }, (t) => {
  const repo = createRepo(t);
  assert.equal(installHooks(repo).status, 0);
  repo.write('a.txt', 'a\n');
  repo.git('add', 'a.txt');
  repo.git('commit', '--quiet', '-m', 'feat: add a\n\nCo-authored-by: Claude <noreply@anthropic.com>');
  assert.equal(repo.git('log', '-1', '--format=%B'), 'feat: add a');
});

test('an old Quimera guard is upgraded; an edited one or another hook is left alone', (t) => {
  const repo = createRepo(t);
  const hook = repo.path('.git/hooks/commit-msg');
  writeFileSync(hook, V030);
  assert.equal(installHooks(repo).status, 0);
  assert.equal(readFileSync(hook, 'utf8'), readFileSync(GUARD, 'utf8'));

  appendFileSync(hook, '# my own rule\n');
  const edited = readFileSync(hook, 'utf8');
  const r = installHooks(repo);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /edited/);
  assert.equal(readFileSync(hook, 'utf8'), edited);

  writeFileSync(hook, '#!/bin/sh\nexit 0\n');
  assert.equal(installHooks(repo).status, 1);
  assert.equal(readFileSync(hook, 'utf8'), '#!/bin/sh\nexit 0\n');
});

test('a hooks folder shared outside the repository needs --shared', (t) => {
  const repo = createRepo(t);
  const shared = join(repo.base, 'shared-hooks');
  mkdirSync(shared);
  repo.git('config', 'core.hooksPath', shared);
  const r = installHooks(repo);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /--shared/);
  assert.equal(installHooks(repo, ['--shared']).status, 0);
  assert.match(readFileSync(join(shared, 'commit-msg'), 'utf8'), /quimera:commit-msg/);
});

test('from a linked worktree the guard goes to the shared hooks folder', (t) => {
  const repo = createRepo(t);
  const tree = join(repo.base, 'tree');
  repo.git('worktree', 'add', '--quiet', '-b', 'feat/x', tree);
  const r = spawnSync(process.execPath, [join(KIT, 'scripts', 'install-hooks.mjs')], { cwd: tree, env: repo.env, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(repo.read('.git/hooks/commit-msg'), /quimera:commit-msg/);
});

test('update refreshes an unchanged guard it installed and leaves an edited one', (t) => {
  const kit = copyKit(t);
  const repo = createRepo(t);
  repo.quimera(['init', '--mode=discreet'], { kit });
  appendFileSync(join(kit, 'scripts', 'commit-msg'), '# newer kit\n');
  assert.equal(repo.quimera(['update'], { kit }).status, 0);
  assert.match(repo.read('.git/hooks/commit-msg'), /# newer kit/);
  assert.equal(repo.manifest().hook.digest, repo.sha('.git/hooks/commit-msg'));

  appendFileSync(repo.path('.git/hooks/commit-msg'), '# mine\n');
  appendFileSync(join(kit, 'scripts', 'commit-msg'), '# even newer\n');
  const r = repo.quimera(['update'], { kit });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /commit-msg guard.*edited/);
  assert.doesNotMatch(repo.read('.git/hooks/commit-msg'), /even newer/);
});

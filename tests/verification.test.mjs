// verify.mjs contract: a step is passed only when its command ran and succeeded; missing evidence
// is unverified, never "ok"; what does not apply says why.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { KIT, createRepo } from './helpers/repository.mjs';

const verify = (repo, args = []) =>
  spawnSync(process.execPath, [join(KIT, 'scripts', 'verify.mjs'), ...args], { cwd: repo.root, env: repo.env, encoding: 'utf8' });
const lastLine = (r) => r.stdout.trim().split('\n').at(-1);

// Writes (or deletes, with null) files and commits them.
function commit(repo, files, message = 'chore: change fixture') {
  for (const [path, text] of Object.entries(files)) {
    if (text === null) repo.git('rm', '--quiet', path);
    else {
      repo.write(path, text);
      repo.git('add', path);
    }
  }
  repo.git('commit', '--quiet', '-m', message);
}
const pkg = (scripts) => `${JSON.stringify({ name: 'fixture', private: true, scripts }, null, 2)}\n`;
const OK = ['node', '-e', 'process.exit(0)'];
const checks = (list) => `${JSON.stringify({ checks: list }, null, 2)}\n`;

test('push with no check that can run is unverified, not ok', (t) => {
  const repo = createRepo(t);
  commit(repo, { 'package.json': pkg({}) });
  repo.git('switch', '--quiet', '-c', 'feat/x');
  commit(repo, { 'src/a.js': 'export const a = 1;\n' });

  const r = verify(repo, ['push']);
  assert.equal(r.status, 3, r.stdout);
  assert.match(lastLine(r), /^Result: unverified · .*unverified/);
});

test('a deletion earlier on the branch still runs the full plan, and its failure counts', (t) => {
  const repo = createRepo(t);
  commit(repo, { 'package.json': pkg({ test: 'exit 19' }), 'a.js': 'export const a = 1;\n' });
  repo.git('switch', '--quiet', '-c', 'feat/x');
  commit(repo, { 'a.js': null });
  commit(repo, { 'README.md': '# Fixture\n\nMore.\n' });

  const r = verify(repo);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stdout, /FAILED test/);
  assert.match(lastLine(r), /^Result: failed/);
});

test('after a passing full run, later changes go back to the changed plan', (t) => {
  const repo = createRepo(t);
  commit(repo, { 'package.json': pkg({ lint: 'exit 0', typecheck: 'exit 0', test: 'exit 0' }), 'a.js': '1;\n', 'b.js': '2;\n' });
  repo.git('switch', '--quiet', '-c', 'feat/x');
  commit(repo, { 'a.js': null });
  const full = verify(repo);
  assert.equal(full.status, 0, full.stdout);
  assert.match(full.stdout, /full verification/);

  commit(repo, { 'b.js': '3;\n' });
  const next = verify(repo);
  assert.equal(next.status, 0, next.stdout);
  assert.doesNotMatch(next.stdout, /full verification/);
});

test('declared checks replace detection, for any stack', (t) => {
  const repo = createRepo(t);
  const declared = [
    { name: 'verify', run: OK },
    { name: 'export', run: OK, when: 'push' },
    { name: 'test', skip: 'no automated tests yet' },
  ];
  commit(repo, { '.quimera/checks.json': checks(declared), 'player.gd': 'extends Node\n' });
  repo.git('switch', '--quiet', '-c', 'feat/x');
  commit(repo, { 'player.gd': 'extends Node2D\n' });

  const r = verify(repo);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /^ok\s+verify/m);
  assert.match(r.stdout, /test: not applicable \(no automated tests yet\)/);
  assert.doesNotMatch(r.stdout, /export/);
  assert.match(verify(repo, ['push']).stdout, /^ok\s+export/m);

  commit(repo, { '.quimera/checks.json': checks([{ name: 'verify', run: ['node', '-e', 'process.exit(7)'] }]) });
  const failed = verify(repo);
  assert.equal(failed.status, 1, failed.stdout);
  assert.match(failed.stdout, /FAILED verify .*exit=7/);
});

test('a project with no package.json and no declared checks is unverified, with the next step', (t) => {
  const repo = createRepo(t);
  repo.git('switch', '--quiet', '-c', 'feat/x');
  commit(repo, { 'player.gd': 'extends Node\n' });
  const r = verify(repo);
  assert.equal(r.status, 3, r.stdout);
  assert.match(r.stdout, /\.quimera\/checks\.json/);
});

test('a documentation-only change is not applicable, with the reason', (t) => {
  const repo = createRepo(t);
  commit(repo, { 'package.json': pkg({ test: 'exit 19' }) });
  repo.git('switch', '--quiet', '-c', 'docs/x');
  commit(repo, { 'README.md': '# Fixture\n\nMore.\n' });
  const r = verify(repo);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /only documentation changed/);
  assert.match(lastLine(r), /^Result: not applicable/);
});

test('MDX is code, not documentation', (t) => {
  const repo = createRepo(t);
  commit(repo, { '.quimera/checks.json': checks([{ name: 'verify', run: OK }]) });
  repo.git('switch', '--quiet', '-c', 'feat/x');
  commit(repo, { 'page.mdx': '# Page\n' });
  const r = verify(repo);
  assert.doesNotMatch(r.stdout, /only documentation/);
  assert.match(r.stdout, /^ok\s+verify/m);
});

test('without a base to compare with, push runs the full plan and says so', (t) => {
  const repo = createRepo(t, { branch: 'feat/start' });
  commit(repo, { '.quimera/checks.json': checks([{ name: 'verify', run: OK }]) });
  const r = verify(repo, ['push']);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /no base/);
  assert.match(r.stdout, /^ok\s+verify/m);

  const bare = createRepo(t, { branch: 'feat/start' });
  commit(bare, { 'package.json': pkg({}) });
  assert.equal(verify(bare, ['push']).status, 3);
});

test('an invalid checks file or base reference stops with exit 2', (t) => {
  const repo = createRepo(t);
  const bad = ['{ not json', checks([{ name: 'x', run: 'npm test' }]), checks([{ name: 'x', run: OK, skip: 'no' }]), checks([{ name: 'x', run: OK, cwd: '../elsewhere' }])];
  for (const text of bad) {
    repo.write('.quimera/checks.json', text);
    const r = verify(repo);
    assert.equal(r.status, 2, `${text}\n${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /checks\.json/);
  }
  repo.write('.quimera/checks.json', checks([{ name: 'verify', run: OK }]));
  assert.equal(verify(repo, ['--base=no-such-ref']).status, 2);
  assert.equal(verify(repo, ['--bogus']).status, 64);
});

test('--json reports every step with its status and the counts', (t) => {
  const repo = createRepo(t);
  commit(repo, { '.quimera/checks.json': checks([{ name: 'verify', run: OK }, { name: 'test', skip: 'none yet' }]) });
  repo.git('switch', '--quiet', '-c', 'feat/x');
  commit(repo, { 'main.py': 'print(1)\n' });
  const r = verify(repo, ['--json']);
  const report = JSON.parse(r.stdout);
  assert.equal(report.result, 'passed');
  assert.deepEqual(report.counts, { passed: 1, failed: 0, unverified: 0, 'not-applicable': 1 });
  assert.deepEqual(report.steps.map((s) => [s.name, s.status]), [['verify', 'passed'], ['test', 'not-applicable']]);
  assert.equal(report.revision, repo.git('rev-parse', 'HEAD'));
});

test('a test runner that finds no tests is unverified, not passed', { skip: process.platform === 'win32' }, (t) => {
  const repo = createRepo(t);
  commit(repo, { 'package.json': pkg({ lint: 'exit 0' }), '.gitignore': 'node_modules/\n' });
  repo.write('node_modules/.bin/vitest', "#!/usr/bin/env node\nconsole.log('No test files found, exiting with code 0');\n");
  chmodSync(repo.path('node_modules/.bin/vitest'), 0o755);
  repo.git('switch', '--quiet', '-c', 'feat/x');
  commit(repo, { 'src/a.js': 'export const a = 1;\n' });

  const r = verify(repo);
  assert.equal(r.status, 3, r.stdout);
  assert.match(r.stdout, /related tests.*unverified \(the test runner found no tests/);
});

test('stale memory adds one warning line without changing the result', (t) => {
  const repo = createRepo(t);
  commit(repo, { '.quimera/checks.json': checks([{ name: 'verify', run: OK }]), 'docs/STATE.md': '# State\n\n**Updated:** 2020-01-01\n' });
  repo.git('switch', '--quiet', '-c', 'feat/x');
  commit(repo, { 'main.py': 'print(1)\n' });
  const r = verify(repo);
  assert.equal(r.status, 0, r.stdout);
  assert.equal(r.stdout.split('\n').filter((l) => l.startsWith('memory:')).length, 1);
});

// The fixtures themselves: every other test relies on these guarantees.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { IDENTITY, createRepo } from './helpers/repository.mjs';

test('a fixture sees no global or system git configuration', (t) => {
  const repo = createRepo(t);
  assert.equal(repo.git('config', '--global', '--list'), '');
  assert.equal(repo.git('config', '--show-origin', '--get', 'user.email'), `file:.git/config\t${IDENTITY.email}`);
  assert.ok(repo.env.HOME.startsWith(repo.base));
});

test('a fixture cannot reach a network remote', (t) => {
  const repo = createRepo(t);
  // Refused before any connection is attempted, so this test itself stays offline.
  const r = repo.run('git', ['ls-remote', 'https://example.invalid/repo.git']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /transport 'https' not allowed/);
});

test('a fixture starts with one commit on the chosen branch, or unborn', (t) => {
  const repo = createRepo(t, { branch: 'trunk' });
  assert.equal(repo.git('branch', '--show-current'), 'trunk');
  assert.equal(repo.git('rev-list', '--count', 'HEAD'), '1');

  const unborn = createRepo(t, { commit: false });
  assert.notEqual(unborn.run('git', ['rev-parse', '--verify', '--quiet', 'HEAD']).status, 0);
});

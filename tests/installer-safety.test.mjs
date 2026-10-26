// The installer stays inside the project: a crafted or corrupted manifest, a symbolic link or a
// replaced helper script can never make it touch files elsewhere or run project code.

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { createRepo, snapshot } from './helpers/repository.mjs';

const digest = (text) => createHash('sha256').update(text).digest('hex');
const noSymlinks = process.platform === 'win32' ? 'symbolic links need extra rights on Windows' : false;

// An installed repository plus a sentinel file next to it, outside the project.
function installed(t) {
  const repo = createRepo(t);
  assert.equal(repo.quimera(['init']).status, 0);
  writeFileSync(join(repo.base, 'outside.txt'), 'sentinel\n');
  return repo;
}

// Runs update after `change` edits the manifest, and checks that nothing changed anywhere.
function rejects(t, change) {
  const repo = installed(t);
  const m = repo.manifest();
  change(m, repo);
  repo.setManifest(m);
  const before = snapshot(repo.base);

  const r = repo.quimera(['update']);
  assert.notEqual(r.status, 0, 'update accepted the manifest');
  assert.match(r.stderr, /Nothing was changed/);
  assert.deepEqual(snapshot(repo.base), before);
}
const entry = (path, hash = digest('sentinel\n')) => (m, repo) => {
  m.installed.files[typeof path === 'function' ? path(repo) : path] = hash;
};

test('a manifest path that climbs out of the project is rejected', (t) => {
  rejects(t, entry('../outside.txt'));
  rejects(t, entry('.quimera/../../outside.txt'));
});

test('absolute, backslash and drive-letter paths are rejected', (t) => {
  rejects(t, entry((repo) => join(repo.base, 'outside.txt')));
  rejects(t, entry('.agents\\skills\\..\\..\\..\\outside.txt'));
  rejects(t, entry('C:/outside.txt'));
});

test('git metadata and files outside the managed folders are rejected', (t) => {
  rejects(t, entry('.git/hooks/pre-commit'));
  rejects(t, entry('.claude/skills/x/.git/config'));
  rejects(t, entry('src/index.ts'));
  rejects(t, entry('.quimera/PROFILE.md'));
});

test('malformed digests, case duplicates and unknown schemas are rejected', (t) => {
  rejects(t, entry('.agents/skills/extra/SKILL.md', 'abc'));
  rejects(t, entry('.agents/skills/verification/skill.md'));
  rejects(t, (m) => {
    m.schema = 99;
  });
  rejects(t, (m) => {
    m.desired.tools = ['claude', 'banana'];
  });
});

test('a manifest that is not JSON is reported, not trusted', (t) => {
  const repo = installed(t);
  writeFileSync(repo.path('.quimera/manifest.json'), '{ not json');
  const before = snapshot(repo.base);
  const r = repo.quimera(['update']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /manifest\.json.*not valid JSON/);
  assert.deepEqual(snapshot(repo.base), before);
  assert.notEqual(repo.quimera(['doctor']).status, 0);
});

test('a symlinked folder makes init refuse before writing anything', { skip: noSymlinks }, (t) => {
  const repo = createRepo(t);
  const sibling = join(repo.base, 'sibling');
  mkdirSync(sibling);
  symlinkSync(sibling, repo.path('.agents'));
  const before = snapshot(repo.base);

  const r = repo.quimera(['init']);
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /\.agents: .*symbolic link/);
  assert.deepEqual(snapshot(repo.base), before);
});

test('a folder replaced by a symlink after install makes update refuse', { skip: noSymlinks }, (t) => {
  const repo = installed(t);
  const elsewhere = join(repo.base, 'elsewhere');
  renameSync(repo.path('.claude/skills'), elsewhere);
  symlinkSync(elsewhere, repo.path('.claude/skills'));
  const before = snapshot(repo.base);

  assert.notEqual(repo.quimera(['update']).status, 0);
  assert.deepEqual(snapshot(repo.base), before);
});

test('a planted symlink in place of an offer copy makes update refuse', { skip: noSymlinks }, (t) => {
  const repo = installed(t);
  symlinkSync(join(repo.base, 'outside.txt'), repo.path('.agents/skills/verification/SKILL.md.quimera-new'));
  const before = snapshot(repo.base);

  assert.notEqual(repo.quimera(['update']).status, 0);
  assert.deepEqual(snapshot(repo.base), before);
});

test('a dangling symlink in place of a kit file is left alone', { skip: noSymlinks }, (t) => {
  const repo = createRepo(t);
  const target = join(repo.base, 'created-through-link.md');
  symlinkSync(target, repo.path('CLAUDE.md'));

  const r = repo.quimera(['init']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /left untouched[\s\S]*CLAUDE\.md/);
  assert.throws(() => readFileSync(target));
});

test('init and doctor never run helper scripts found in the project', (t) => {
  const planted = "import { writeFileSync } from 'node:fs';\nwriteFileSync('planted-ran', '');\n";
  const repo = createRepo(t);
  for (const helper of ['install-hooks.mjs', 'local-only.mjs']) repo.write(`.quimera/scripts/${helper}`, planted);

  const r = repo.quimera(['init', '--mode=discreet', '--local-only']);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!repo.exists('planted-ran'), 'a project helper ran during init');
  assert.match(repo.read('.git/hooks/commit-msg'), /quimera:commit-msg/);
  assert.match(repo.read('.git/info/exclude'), /\/\.quimera\//);
  assert.equal(repo.read('.quimera/scripts/install-hooks.mjs'), planted);

  repo.write('.quimera/scripts/git-preflight.mjs', planted);
  repo.quimera(['doctor']);
  assert.ok(!repo.exists('planted-ran'), 'a project helper ran during doctor');
});

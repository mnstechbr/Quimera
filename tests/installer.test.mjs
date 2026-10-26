// Installer contract: init, update and dry run in disposable repositories.

import assert from 'node:assert/strict';
import { appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { KIT_VERSION, copyKit, createRepo } from './helpers/repository.mjs';

const SKILL = '.agents/skills/verification/SKILL.md';
const MIRROR = '.claude/skills/verification/SKILL.md';

test('init installs the kit and records a digest for every file it wrote', (t) => {
  const repo = createRepo(t);
  const r = repo.quimera(['init']);
  assert.equal(r.status, 0, r.stderr);

  const m = repo.manifest();
  assert.equal(m.version, KIT_VERSION);
  assert.deepEqual(m.tools, ['claude']);
  for (const f of ['.quimera/QUIMERA.md', SKILL, MIRROR, '.claude/agents/quimera-reviewer.md', 'CLAUDE.md']) {
    assert.ok(f in m.files, `${f} missing from the manifest`);
  }
  for (const [f, digest] of Object.entries(m.files)) {
    assert.ok(repo.exists(f), `${f} not written`);
    assert.equal(repo.sha(f), digest, `${f} does not match its digest`);
  }
});

test('update keeps a local edit when the kit did not change', (t) => {
  const repo = createRepo(t);
  repo.quimera(['init']);
  appendFileSync(repo.path(SKILL), '\nLocal rule.\n');
  const edited = repo.read(SKILL);

  const r = repo.quimera(['update']);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(repo.read(SKILL), edited);
  assert.ok(!repo.exists(`${SKILL}.quimera-new`));
});

test('update keeps a local edit and offers the new kit version beside it', (t) => {
  const kit = copyKit(t);
  const repo = createRepo(t);
  repo.quimera(['init'], { kit });
  appendFileSync(repo.path(SKILL), '\nLocal rule.\n');
  const edited = repo.read(SKILL);
  appendFileSync(join(kit, 'skills', 'verification', 'SKILL.md'), '\nUpstream rule.\n');
  const upstream = readFileSync(join(kit, 'skills', 'verification', 'SKILL.md'), 'utf8');

  const r = repo.quimera(['update'], { kit });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(repo.read(SKILL), edited);
  assert.equal(repo.read(`${SKILL}.quimera-new`), upstream);
  // The untouched mirror of the same skill takes the new version directly.
  assert.equal(repo.read(MIRROR), upstream);
  assert.equal(repo.manifest().files[MIRROR], repo.sha(MIRROR));
});

test('a dry run writes nothing', (t) => {
  const repo = createRepo(t);
  const excludeFile = '.git/info/exclude';
  const exclude = () => (repo.exists(excludeFile) ? repo.read(excludeFile) : null);
  const before = exclude();

  const r = repo.quimera(['init', '--dry-run', '--mode=discreet', '--local-only']);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\[dry run\]/);
  assert.equal(repo.git('status', '--porcelain', '--untracked-files=all'), '');
  assert.equal(exclude(), before);
  assert.ok(!repo.exists('.git/hooks/commit-msg'));
});

// Doctor contract: read-only, installation health separate from work readiness, and every state
// the 0.3.0 doctor called "present" while it was not fine.

import assert from 'node:assert/strict';
import { appendFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { IDENTITY, copyKit, createRepo, snapshot } from './helpers/repository.mjs';

const SKILL = '.agents/skills/verification/SKILL.md';
const MIRROR = '.claude/skills/verification/SKILL.md';
const problems = (r) => r.stdout.split('\n').filter((l) => l.startsWith('  problem'));

function installed(t, args = []) {
  const repo = createRepo(t);
  assert.equal(repo.quimera(['init', ...args]).status, 0);
  return repo;
}
function profile(repo, { mode = 'open', files = 'committed' } = {}) {
  repo.write('AGENTS.md', `# Fixture\n\n## Project profile\n\n- **Mode:** ${mode}\n- **Git identity:** ${IDENTITY.name} <${IDENTITY.email}>\n- **Quimera files:** ${files}\n`);
}

test('a healthy installation exits 0 even when work readiness needs attention', (t) => {
  const repo = installed(t);
  const before = snapshot(repo.base);
  const r = repo.quimera(['doctor']);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /Installation: healthy/);
  assert.match(r.stdout, /Work readiness[\s\S]*need attention/);
  assert.deepEqual(snapshot(repo.base), before, 'doctor changed files');
});

test('a pending offer is a problem even after a clean commit', (t) => {
  const kit = copyKit(t);
  const repo = createRepo(t);
  repo.quimera(['init'], { kit });
  appendFileSync(repo.path(SKILL), '\nLocal rule.\n');
  appendFileSync(join(kit, 'skills', 'verification', 'SKILL.md'), '\nUpstream rule.\n');
  repo.quimera(['update'], { kit });
  repo.git('add', '-A');
  repo.git('commit', '--quiet', '-m', 'chore: install');

  const r = repo.quimera(['doctor'], { kit });
  assert.equal(r.status, 1);
  assert.match(problems(r).join('\n'), /verification\/SKILL\.md\.quimera-new/);
});

test('a missing file is a problem, an edited one is only a note', (t) => {
  const repo = installed(t);
  appendFileSync(repo.path('.quimera/adapters/codex.md'), '\nLocal note.\n');
  assert.equal(repo.quimera(['doctor']).status, 0);
  rmSync(repo.path('.quimera/adapters/copilot.md'));
  const r = repo.quimera(['doctor']);
  assert.equal(r.status, 1);
  assert.match(problems(r).join('\n'), /missing.*copilot\.md/);
  assert.match(r.stdout, /note .*edited.*codex\.md/);
});

test('a skill mirror that differs from .agents/skills is a problem', (t) => {
  const repo = installed(t);
  appendFileSync(repo.path(MIRROR), '\nOnly here.\n');
  const r = repo.quimera(['doctor']);
  assert.equal(r.status, 1);
  assert.match(problems(r).join('\n'), /diverged.*claude\/skills\/verification\/SKILL\.md/);
});

test('discreet mode without the guard is a problem; with it, healthy', (t) => {
  const repo = installed(t);
  profile(repo, { mode: 'discreet' });
  assert.match(problems(repo.quimera(['doctor'])).join('\n'), /commit-msg guard/);
  const guarded = installed(t, ['--mode=discreet']);
  profile(guarded, { mode: 'discreet' });
  assert.equal(guarded.quimera(['doctor']).status, 0);
});

test('a profile that contradicts the installation is a problem', (t) => {
  const repo = installed(t, ['--mode=discreet']);
  profile(repo, { mode: 'open' });
  assert.match(problems(repo.quimera(['doctor'])).join('\n'), /profile says mode open/);
});

test('a local-only profile whose files are not excluded is a problem', (t) => {
  const repo = installed(t);
  profile(repo, { files: 'local-only' });
  assert.match(problems(repo.quimera(['doctor'])).join('\n'), /local-only/);
  const excluded = installed(t, ['--local-only']);
  profile(excluded, { files: 'local-only' });
  assert.equal(excluded.quimera(['doctor']).status, 0);
});

test('--json separates installation and readiness', (t) => {
  const repo = installed(t);
  rmSync(repo.path('.quimera/adapters/copilot.md'));
  const r = repo.quimera(['doctor', '--json']);
  const report = JSON.parse(r.stdout);
  assert.equal(report.installation.healthy, false);
  assert.deepEqual(report.installation.problems.map((p) => [p.kind, p.path]), [['missing', '.quimera/adapters/copilot.md']]);
  assert.equal(report.readiness.ready, false);
  assert.equal(r.status, 1);
});

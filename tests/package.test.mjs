// The released package: what `npx github:mnstechbr/Quimera#<tag>` installs. It must carry every
// runtime module and the notices, leave out the kit's own tests, plans and tools, and work end to
// end from the unpacked copy. Projects receive the notices with the adapted skills.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import { KIT, createRepo } from './helpers/repository.mjs';

const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));

// Packs the kit without running any lifecycle script and unpacks it in a temporary folder.
function unpacked(t) {
  const out = mkdtempSync(join(tmpdir(), 'quimera-pack-'));
  t.after(() => rmSync(out, { recursive: true, force: true }));
  const env = createRepo(t).env; // an isolated HOME, so npm never touches the developer's cache
  const pack = spawnSync('npm', ['pack', '--ignore-scripts', '--pack-destination', out, '--json'], { cwd: KIT, env, encoding: 'utf8', shell: process.platform === 'win32' });
  assert.equal(pack.status, 0, pack.stderr);
  const [{ filename }] = JSON.parse(pack.stdout);
  assert.equal(spawnSync('tar', ['-xzf', join(out, filename), '-C', out]).status, 0);
  return join(out, 'package');
}

test('the package holds every runtime module and the notices, and nothing of the kit\'s own', (t) => {
  const pkg = unpacked(t);
  const runtime = [...walk(join(KIT, 'bin')), ...walk(join(KIT, 'scripts'))].map((f) => relative(KIT, f));
  for (const f of [...runtime, 'NOTICE.md', 'LICENSE', 'CHANGELOG.md', 'QUIMERA.md', 'package.json']) {
    assert.ok(existsSync(join(pkg, f)), `${f} missing from the package`);
  }
  for (const f of ['tests', 'dev', 'docs', 'AGENTS.md']) assert.ok(!existsSync(join(pkg, f)), `${f} should not be in the package`);
});

test('init, edit, update and doctor work from the unpacked package', (t) => {
  const pkg = unpacked(t);
  const repo = createRepo(t);
  assert.equal(repo.quimera(['init', '--tools=claude,codex'], { kit: pkg }).status, 0);
  for (const f of ['NOTICE.md', 'LICENSE', 'CHANGELOG.md']) {
    assert.equal(repo.read(`.quimera/${f}`), readFileSync(join(KIT, f), 'utf8'), `.quimera/${f}`);
  }
  appendFileSync(repo.path('.quimera/adapters/codex.md'), '\nLocal note.\n');
  assert.equal(repo.quimera(['update'], { kit: pkg }).status, 0);
  assert.match(repo.read('.quimera/adapters/codex.md'), /Local note\./);
  const doctor = repo.quimera(['doctor'], { kit: pkg });
  assert.match(doctor.stdout, /Installation: healthy/);
});

test('an update across versions names both and points to the changelog', (t) => {
  const repo = createRepo(t);
  repo.quimera(['init']);
  const m = repo.manifest();
  m.installed.version = '0.2.0';
  repo.setManifest(m);
  const r = repo.quimera(['update']);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /0\.2\.0 → \d+\.\d+\.\d+.*\.quimera\/CHANGELOG\.md/);
});

// Update contract: a versioned manifest, a plan built before any write, migration from 0.3.0,
// tool and specialist changes, and safe recovery from a concurrent or interrupted run.

import assert from 'node:assert/strict';
import { appendFileSync, chmodSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { test } from 'node:test';
import { KIT_VERSION, copyKit, createRepo, snapshot } from './helpers/repository.mjs';

const SKILL = '.agents/skills/verification/SKILL.md';
const gitPath = (repo, name) => {
  const p = repo.git('rev-parse', '--git-path', name);
  return isAbsolute(p) ? p : join(repo.root, p);
};
const canChmod = process.platform !== 'win32' && process.getuid?.() !== 0;

test('init records the desired setup, the installed files and the hook', (t) => {
  const repo = createRepo(t);
  assert.equal(repo.quimera(['init', '--mode=discreet', '--specialists=security']).status, 0);
  const m = repo.manifest();
  assert.equal(m.schema, 2);
  assert.deepEqual(m.desired, { tools: ['claude'], models: 'full', mode: 'discreet', localOnly: null, specialists: ['security'] });
  assert.equal(m.installed.version, KIT_VERSION);
  assert.deepEqual(m.pending, { offers: [], orphans: [] });
  assert.equal(m.hook.digest.length, 64);
  assert.ok(repo.read(m.hook.path).includes('quimera:commit-msg'));
});

test('a repeated update changes nothing', (t) => {
  const repo = createRepo(t);
  repo.quimera(['init']);
  assert.equal(repo.quimera(['update']).status, 0);
  const once = snapshot(repo.base);
  assert.equal(repo.quimera(['update']).status, 0);
  assert.deepEqual(snapshot(repo.base), once);
});

test('a 0.3.0 manifest migrates without losing a single digest', (t) => {
  for (const source of ['13106c4', null]) {
    const repo = createRepo(t);
    repo.quimera(['init', '--tools=claude,codex']);
    const files = repo.manifest().installed.files;
    appendFileSync(repo.path(SKILL), '\nLocal rule.\n');
    // The shape both pilot projects carry today.
    repo.setManifest({ version: '0.3.0', source, tools: ['claude', 'codex'], models: 'full', files });

    const r = repo.quimera(['update']);
    assert.equal(r.status, 0, r.stderr);
    const m = repo.manifest();
    assert.equal(m.schema, 2);
    assert.deepEqual(m.installed.files, files);
    assert.deepEqual(m.desired.tools, ['claude', 'codex']);
    assert.match(repo.read(SKILL), /Local rule\./);
  }
});

test('a 0.3.0 manifest written on Windows has its backslashes converted', (t) => {
  const repo = createRepo(t);
  repo.quimera(['init']);
  const files = repo.manifest().installed.files;
  const windows = Object.fromEntries(Object.entries(files).map(([k, v]) => [k.replaceAll('/', '\\'), v]));
  repo.setManifest({ version: '0.3.0', source: null, tools: ['claude'], models: 'full', files: windows });

  assert.equal(repo.quimera(['update']).status, 0);
  assert.deepEqual(repo.manifest().installed.files, files);
});

test('a file the kit stops shipping is removed, or kept as an orphan when edited', (t) => {
  const kit = copyKit(t);
  const repo = createRepo(t);
  repo.quimera(['init'], { kit });
  appendFileSync(repo.path('.quimera/adapters/codex.md'), '\nLocal note.\n');
  rmSync(join(kit, 'adapters', 'codex.md'));
  rmSync(join(kit, 'adapters', 'copilot.md'));

  const r = repo.quimera(['update'], { kit });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(!repo.exists('.quimera/adapters/copilot.md'));
  assert.ok(repo.exists('.quimera/adapters/codex.md'));
  const m = repo.manifest();
  assert.ok(!('.quimera/adapters/copilot.md' in m.installed.files));
  assert.deepEqual(m.pending.orphans, ['.quimera/adapters/codex.md']);
});

test('--tools changes the tool set both ways', (t) => {
  const repo = createRepo(t);
  repo.quimera(['init']);
  assert.equal(repo.quimera(['update', '--tools=claude,cursor']).status, 0);
  assert.ok(repo.exists('.cursor/skills/verification/SKILL.md'));
  assert.deepEqual(repo.manifest().desired.tools, ['claude', 'cursor']);

  appendFileSync(repo.path('.cursor/skills/task-start/SKILL.md'), '\nLocal rule.\n');
  assert.equal(repo.quimera(['update', '--tools=claude']).status, 0);
  assert.ok(!repo.exists('.cursor/skills/verification/SKILL.md'));
  assert.ok(repo.exists('.cursor/skills/task-start/SKILL.md'));
  assert.deepEqual(repo.manifest().pending.orphans, ['.cursor/skills/task-start/SKILL.md']);
});

test('only the chosen specialist reviewers are installed', (t) => {
  const repo = createRepo(t);
  repo.quimera(['init', '--specialists=security']);
  assert.ok(repo.exists('.claude/agents/quimera-security-reviewer.md'));
  assert.ok(!repo.exists('.claude/agents/quimera-database-reviewer.md'));
  assert.ok(repo.exists('.claude/agents/quimera-reviewer.md'));

  assert.equal(repo.quimera(['update', '--specialists=security,interface']).status, 0);
  assert.ok(repo.exists('.claude/agents/quimera-interface-reviewer.md'));
  assert.equal(repo.quimera(['update', '--specialists=none']).status, 0);
  assert.ok(!repo.exists('.claude/agents/quimera-security-reviewer.md'));
  assert.equal(repo.quimera(['init', '--specialists=banana']).status, 64);
});

test('a dry run prints the plan the real run then carries out', (t) => {
  const kit = copyKit(t);
  const repo = createRepo(t);
  repo.quimera(['init'], { kit });
  appendFileSync(repo.path(SKILL), '\nLocal rule.\n');
  appendFileSync(join(kit, 'skills', 'verification', 'SKILL.md'), '\nUpstream rule.\n');
  const before = snapshot(repo.base);

  const dry = repo.quimera(['update', '--dry-run'], { kit });
  assert.equal(dry.status, 0, dry.stderr);
  assert.deepEqual(snapshot(repo.base), before);
  const planned = dry.stdout.split('\n').filter((l) => /^ {2}(write|offer|remove|drop) /.test(l)).map((l) => l.trim().split(/\s+/)[1]).sort();
  assert.deepEqual(planned, [`${SKILL}.quimera-new`, '.claude/skills/verification/SKILL.md'].sort());

  repo.quimera(['update'], { kit });
  const after = snapshot(repo.base);
  const changed = Object.keys({ ...before, ...after }).filter((k) => before[k] !== after[k] && !k.endsWith('manifest.json'));
  assert.deepEqual(changed.map((k) => k.replace(/^repo\//, '')).sort(), planned);
});

test('a second run waits for the first: the lock stops it with nothing changed', (t) => {
  const repo = createRepo(t);
  repo.quimera(['init']);
  repo.write(repo.git('rev-parse', '--git-path', 'quimera.lock'), '12345\n');
  const before = snapshot(repo.base);
  const r = repo.quimera(['update']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /quimera\.lock/);
  assert.deepEqual(snapshot(repo.base), before);
});

test('an interrupted update keeps the old manifest, says so, and the next run finishes', { skip: !canChmod && 'needs file permissions (not Windows, not root)' }, (t) => {
  const kit = copyKit(t);
  const repo = createRepo(t);
  repo.quimera(['init'], { kit });
  appendFileSync(join(kit, 'QUIMERA.md'), '\nUpstream change.\n');
  appendFileSync(join(kit, 'skills', 'verification', 'SKILL.md'), '\nUpstream rule.\n');
  const manifest = readFileSync(repo.path('.quimera/manifest.json'), 'utf8');
  chmodSync(repo.path(SKILL), 0o444);

  const r = repo.quimera(['update'], { kit });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /stopped while changing .*verification\/SKILL\.md/);
  assert.equal(readFileSync(repo.path('.quimera/manifest.json'), 'utf8'), manifest);
  assert.ok(existsSync(gitPath(repo, 'quimera-update.json')));
  assert.match(repo.quimera(['doctor']).stdout, /did not finish/);

  chmodSync(repo.path(SKILL), 0o644);
  assert.equal(repo.quimera(['update'], { kit }).status, 0);
  assert.ok(!existsSync(gitPath(repo, 'quimera-update.json')));
  assert.match(repo.read(SKILL), /Upstream rule\./);
  assert.equal(repo.manifest().installed.files[SKILL], repo.sha(SKILL));
});

// Local-only contract: exact exclusions that never hide the project's own files, migration from the
// 0.3.0 block, and a private memory repository so local-only memory still has a history.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { test } from 'node:test';
import { KIT, createRepo } from './helpers/repository.mjs';

const script = (repo, name, args = []) =>
  spawnSync(process.execPath, [join(repo.root, '.quimera', 'scripts', name), ...args], { cwd: repo.root, env: repo.env, encoding: 'utf8' });
const ignored = (repo, path) => repo.run('git', ['check-ignore', '-q', '--no-index', path]).status === 0;

function localOnly(t, args = []) {
  const repo = createRepo(t);
  assert.equal(repo.quimera(['init', '--local-only', ...args]).status, 0);
  return repo;
}

test('kit and memory files are excluded; the project\'s own files in the same folders are not', (t) => {
  const repo = localOnly(t);
  for (const f of ['.quimera/QUIMERA.md', '.agents/skills/verification/SKILL.md', '.claude/skills/verification/SKILL.md', '.claude/agents/quimera-reviewer.md', 'AGENTS.md', 'CLAUDE.md', 'docs/STATE.md', 'docs/DECISIONS.md', 'x.quimera-new']) {
    assert.ok(ignored(repo, f), `${f} should be excluded`);
  }
  for (const f of ['docs/standards/business.md', '.agents/skills/mine/SKILL.md', '.claude/skills/mine/SKILL.md', '.claude/agents/mine.md', 'docs/plans/roadmap.md', 'docs/vision/brief.md']) {
    assert.ok(!ignored(repo, f), `${f} should stay visible`);
  }
});

test('standards listed in the standards index are excluded, others are not', (t) => {
  const repo = localOnly(t);
  repo.write('docs/standards/INDEX.md', '# Standards\n\n- api/errors: `docs/standards/api/errors.md`\n- [naming](ui/naming.md)\n');
  assert.equal(script(repo, 'local-only.mjs').status, 0);
  assert.ok(ignored(repo, 'docs/standards/api/errors.md'));
  assert.ok(ignored(repo, 'docs/standards/ui/naming.md'));
  assert.ok(!ignored(repo, 'docs/standards/business.md'));
});

test('product documents are excluded only when asked, and the choice is kept', (t) => {
  const repo = localOnly(t);
  assert.ok(!ignored(repo, 'docs/plans/roadmap.md'));
  assert.equal(script(repo, 'local-only.mjs', ['--product-docs']).status, 0);
  assert.ok(ignored(repo, 'docs/plans/roadmap.md'));
  assert.equal(script(repo, 'local-only.mjs').status, 0);
  assert.ok(ignored(repo, 'docs/vision/brief.md'));
});

test('running it again changes nothing', (t) => {
  const repo = localOnly(t);
  const once = repo.read('.git/info/exclude');
  assert.equal(script(repo, 'local-only.mjs').status, 0);
  assert.equal(repo.read('.git/info/exclude'), once);
  assert.equal(once.match(/quimera:local-only begin/g).length, 1);
});

test('files git already tracks are listed, never untracked', (t) => {
  const repo = createRepo(t);
  repo.quimera(['init']);
  repo.write('AGENTS.md', '# Fixture\n');
  repo.git('add', 'AGENTS.md');
  repo.git('commit', '--quiet', '-m', 'docs: add agents file');
  const r = script(repo, 'local-only.mjs');
  assert.equal(r.status, 0);
  assert.match(r.stdout, /already tracked[\s\S]*AGENTS\.md/);
  assert.equal(repo.git('ls-files', 'AGENTS.md'), 'AGENTS.md');
});

test('the broad 0.3.0 block is replaced, and the user\'s own lines stay', (t) => {
  const repo = createRepo(t);
  repo.quimera(['init']);
  const old = ['/.quimera/', '/.agents/skills/', '/AGENTS.md', '/docs/standards/', '/docs/plans/', '*.quimera-new'];
  repo.write('.git/info/exclude', `# git comment\n*.quimera-new\n# quimera: local-only files\n${old.join('\n')}\n\n/.impeccable/\n/public/dev-faces/\n`);
  assert.equal(script(repo, 'local-only.mjs').status, 0);
  const text = repo.read('.git/info/exclude');
  assert.doesNotMatch(text, /^\/docs\/standards\/$/m);
  assert.doesNotMatch(text, /^\/\.agents\/skills\/$/m);
  assert.doesNotMatch(text, /# quimera: local-only files/);
  assert.match(text, /^\/\.impeccable\/$/m);
  assert.match(text, /^\/public\/dev-faces\/$/m);
  assert.match(text, /^# git comment$/m);
  assert.ok(!ignored(repo, 'docs/standards/business.md'));
  assert.ok(ignored(repo, 'AGENTS.md'));
});

test('an update refreshes the exclusions of a local-only project', (t) => {
  const repo = localOnly(t);
  assert.equal(repo.quimera(['update', '--tools=claude,cursor']).status, 0);
  assert.ok(ignored(repo, '.cursor/skills/verification/SKILL.md'));
  assert.ok(!ignored(repo, '.cursor/skills/mine/SKILL.md'));
});

test('the private memory repository keeps a history of the memory files', (t) => {
  const repo = localOnly(t);
  repo.write('docs/STATE.md', '# State\n\nFirst.\n');
  repo.write('docs/DECISIONS.md', '# Decisions\n');
  const init = script(repo, 'memory.mjs', ['init']);
  assert.equal(init.status, 0, init.stderr);

  const mem = (...args) => repo.git('--git-dir=.quimera/memory.git', `--work-tree=${repo.root}`, ...args);
  assert.deepEqual(mem('ls-files').split('\n').sort(), ['CLAUDE.md', 'docs/DECISIONS.md', 'docs/STATE.md']);
  repo.write('docs/STATE.md', '# State\n\nSecond.\n');
  assert.equal(script(repo, 'memory.mjs', ['save', '-m', 'docs: record second state']).status, 0);
  assert.equal(mem('log', '--format=%s').split('\n')[0], 'docs: record second state');
  assert.equal(mem('remote'), '');
  assert.equal(repo.git('status', '--porcelain'), '');
  assert.equal(script(repo, 'memory.mjs', ['init']).status, 0, 'init twice is harmless');
});

test('the memory repository refuses to live where the project would commit it', (t) => {
  const repo = createRepo(t);
  repo.quimera(['init']);
  const r = script(repo, 'memory.mjs', ['init']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /local-only/);
  assert.ok(!repo.exists('.quimera/memory.git'));
});

test('doctor notes local-only memory without a history', (t) => {
  const repo = localOnly(t);
  repo.write('AGENTS.md', '# Fixture\n\n- **Git identity:** Fixture Owner <owner@fixture.test>\n- **Quimera files:** local-only\n');
  repo.write('docs/STATE.md', '# State\n');
  assert.match(repo.quimera(['doctor']).stdout, /note +memory: .*memory\.mjs init/);
  script(repo, 'memory.mjs', ['init']);
  repo.write('docs/STATE.md', '# State\n\nChanged.\n');
  assert.match(repo.quimera(['doctor']).stdout, /note +memory: .*memory\.mjs save/);
});

test('the kit never ships its own memory repository or allows a manifest to claim it', () => {
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', "import { pathProblem } from './bin/lib/paths.mjs'; console.log(pathProblem('.quimera/memory.git/HEAD'))"], { cwd: KIT, encoding: 'utf8' });
  assert.match(r.stdout, /belongs to the project/);
});

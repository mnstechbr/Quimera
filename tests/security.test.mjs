// Regressions from the independent security review before 0.4.0: files a cloned repository can
// carry must never make Quimera run code, hide unrelated files, hang, or write outside its place.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, statSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathProblem } from '../bin/lib/paths.mjs';
import { memoryPaths, standardsFiles } from '../scripts/lib/local-files.mjs';
import { IDENTITY, KIT, createRepo } from './helpers/repository.mjs';

const posix = process.platform === 'win32' ? 'POSIX permissions and devices' : false;
const script = (repo, name, args = [], opts = {}) =>
  spawnSync(process.execPath, [join(KIT, 'scripts', name), ...args], { cwd: repo.root, env: repo.env, encoding: 'utf8', timeout: 20000, ...opts });
const ignored = (repo, path) => repo.run('git', ['check-ignore', '-q', '--no-index', path]).status === 0;
const profile = (files = 'local-only') => `# Fixture\n\n- **Mode:** open\n- **Git identity:** ${IDENTITY.name} <${IDENTITY.email}>\n- **Quimera files:** ${files}\n`;

test('a memory repository planted in the project is never used', { skip: posix }, (t) => {
  const repo = createRepo(t);
  repo.quimera(['init', '--local-only']);
  repo.write('AGENTS.md', profile());
  repo.write('docs/STATE.md', '# State\n');
  // What a hostile repository could commit: a git directory whose config runs a command.
  const marker = join(repo.base, 'PWNED');
  repo.write('.quimera/memory.git/HEAD', 'ref: refs/heads/main\n');
  repo.write('.quimera/memory.git/objects/.keep', '');
  repo.write('.quimera/memory.git/refs/.keep', '');
  repo.write('.quimera/memory.git/config', `[core]\n\trepositoryformatversion = 0\n\tbare = false\n\tfsmonitor = touch ${marker}\n`);

  repo.quimera(['doctor']);
  for (const args of [['status'], ['init'], ['save'], ['status']]) script(repo, 'memory.mjs', args);
  assert.ok(!existsSync(marker), 'a command from the planted repository ran');
  assert.ok(existsSync(join(repo.root, '.git', 'quimera-memory.git', 'HEAD')), 'the memory repository lives in the git folder');
});

test('local-only never turns a manifest key outside the managed folders into an exclusion', (t) => {
  const repo = createRepo(t);
  repo.quimera(['init', '--local-only']);
  const m = repo.manifest();
  for (const key of ['package.json', 'src', '.github/workflows/ci.yml', '.agents/skills/../../src']) m.installed.files[key] = '0'.repeat(64);
  repo.setManifest(m);
  assert.equal(script(repo, 'local-only.mjs').status, 0);
  for (const f of ['package.json', 'src/index.ts', '.github/workflows/ci.yml']) assert.ok(!ignored(repo, f), `${f} was hidden`);
  assert.ok(ignored(repo, '.agents/skills/verification/SKILL.md'));
});

test('a Memory line may name only Markdown files inside the project', (t) => {
  const repo = createRepo(t);
  for (const bad of ['lib/', 'src', '.git/config', 'docs/../../x.md', '-rf.md']) {
    repo.write('AGENTS.md', `# Fixture\n\n- **Memory:** state \`${bad}\` · map \`docs/MAP.md\`\n`);
    assert.equal(memoryPaths(repo.root).state, 'docs/STATE.md', bad);
  }
  repo.write('AGENTS.md', '# Fixture\n\n- **Memory:** state `memory/CURRENT.md`\n');
  assert.equal(memoryPaths(repo.root).state, 'memory/CURRENT.md');
  repo.write('docs/standards/INDEX.md', '- `docs/standards/.git/x.md`\n- `docs/standards/api/errors.md`\n');
  assert.deepEqual(standardsFiles(repo.root), ['docs/standards/api/errors.md']);
});

test('a huge profile line does not hang the preflight', (t) => {
  const repo = createRepo(t);
  repo.write('AGENTS.md', `# Fixture\n\n- **Mode:** open\n- **Git identity:** ${'a'.repeat(1024 * 1024)}\n`);
  const start = Date.now();
  const r = script(repo, 'git-preflight.mjs');
  assert.notEqual(r.status, null, 'the preflight did not finish');
  assert.ok(Date.now() - start < 5000, `took ${Date.now() - start} ms`);
});

test('a profile that is an endless device is not read', { skip: posix }, (t) => {
  const repo = createRepo(t);
  repo.quimera(['init']);
  symlinkSync('/dev/zero', repo.path('AGENTS.md'));
  const r = repo.quimera(['doctor']);
  assert.notEqual(r.status, null, 'doctor did not finish');
  assert.equal(script(repo, 'git-preflight.mjs').signal, null);
});

test('files that belong to the project are recognised in any letter case', () => {
  for (const p of ['.quimera/profile.md', '.quimera/PROFILE.MD', '.quimera/Checks.json', '.quimera/MEMORY.GIT/HEAD']) {
    assert.match(pathProblem(p) ?? '', /belongs to the project/, p);
  }
});

test('verification logs go to a private folder of their own', { skip: posix }, (t) => {
  const repo = createRepo(t);
  repo.write('.quimera/checks.json', JSON.stringify({ checks: [{ name: 'verify', run: ['node', '-e', 'process.exit(5)'] }] }));
  repo.git('add', '-A');
  repo.git('commit', '--quiet', '-m', 'chore: add checks');
  const r = script(repo, 'verify.mjs', ['--all']);
  const log = r.stdout.match(/log: (\S+)/)[1];
  const dir = log.slice(0, log.lastIndexOf('/'));
  assert.equal(statSync(dir).mode & 0o777, 0o700);
  assert.doesNotMatch(dir, new RegExp(`quimera-verify-repo-${r.pid ?? '\\d+'}$`));
  assert.match(readFileSync(log, 'utf8'), /exit=5/);
});

test('the commit guard keeps its temporary files in a folder of its own', () => {
  assert.match(readFileSync(join(KIT, 'scripts', 'commit-msg'), 'utf8'), /mktemp -d/);
});

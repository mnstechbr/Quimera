// Disposable Git repositories for the kit's contract tests.
//
// Each repository lives in its own temporary folder with its own HOME, an empty global Git
// configuration, no system configuration and only the local file protocol allowed. A test can
// never read the developer's Git setup, run their hooks or reach a remote. Everything is removed
// when the test ends.

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const KIT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const KIT_VERSION = JSON.parse(readFileSync(join(KIT, 'package.json'), 'utf8')).version;
export const IDENTITY = { name: 'Fixture Owner', email: 'owner@fixture.test' };

// What a copy of the kit needs to run the installer: the parts `package.json` publishes.
const KIT_PARTS = ['bin', 'skills', 'scripts', 'adapters', 'templates', 'QUIMERA.md', 'NOTICE.md', 'LICENSE', 'package.json'];

function isolatedEnv(home) {
  // Inherited GIT_* variables (GIT_DIR, GIT_INDEX_FILE, …) would point Git at another repository.
  const inherited = Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_') && k !== 'NODE_TEST_CONTEXT');
  return {
    ...Object.fromEntries(inherited),
    HOME: home,
    USERPROFILE: home,
    XDG_CONFIG_HOME: join(home, '.config'),
    GIT_CONFIG_GLOBAL: join(home, '.gitconfig'),
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_ALLOW_PROTOCOL: 'file',
    GIT_TERMINAL_PROMPT: '0',
    LC_ALL: 'C',
  };
}

const sha = (buf) => createHash('sha256').update(buf).digest('hex');

// Every file under `dir` with its digest (a symlink with its target), to prove that nothing changed.
export function snapshot(dir, skip = ['.git']) {
  const out = {};
  const visit = (rel) => {
    for (const name of readdirSync(join(dir, rel))) {
      const r = rel ? `${rel}/${name}` : name;
      if (skip.includes(r)) continue;
      const st = lstatSync(join(dir, r));
      if (st.isSymbolicLink()) out[r] = `link:${readlinkSync(join(dir, r))}`;
      else if (st.isDirectory()) visit(r);
      else out[r] = sha(readFileSync(join(dir, r)));
    }
  };
  visit('');
  return out;
}

function run(cmd, args, { cwd, env }) {
  const r = spawnSync(cmd, args, { cwd, env, encoding: 'utf8' });
  return { status: r.status, signal: r.signal, stdout: r.stdout ?? '', stderr: r.stderr ?? '', error: r.error };
}

// A fresh repository with the fixture identity. `branch` names the initial branch; with
// `commit: false` it stays unborn (no commits, so the branch does not exist yet).
export function createRepo(t, { branch = 'main', commit = true } = {}) {
  const base = mkdtempSync(join(tmpdir(), 'quimera-test-'));
  t.after(() => rmSync(base, { recursive: true, force: true }));
  const home = join(base, 'home');
  const root = join(base, 'repo');
  mkdirSync(home);
  mkdirSync(root);
  writeFileSync(join(home, '.gitconfig'), '');
  const env = isolatedEnv(home);

  const repo = {
    base,
    root,
    home,
    env,
    path: (rel) => join(root, rel),
    exists: (rel) => existsSync(join(root, rel)),
    read: (rel) => readFileSync(join(root, rel), 'utf8'),
    write(rel, text) {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      writeFileSync(join(root, rel), text);
    },
    sha: (rel) => sha(readFileSync(join(root, rel))),
    run: (cmd, args) => run(cmd, args, { cwd: root, env }),
    git(...args) {
      const r = run('git', args, { cwd: root, env });
      if (r.status !== 0) throw new Error(`git ${args.join(' ')} failed (${r.status}): ${r.stderr}`);
      return r.stdout.trim();
    },
    // Runs the installer of `kit` (this kit by default) inside the repository, or in `cwd`.
    quimera: (args, { kit = KIT, cwd = root } = {}) => run(process.execPath, [join(kit, 'bin', 'quimera.mjs'), ...args], { cwd, env }),
    manifest: () => JSON.parse(readFileSync(join(root, '.quimera', 'manifest.json'), 'utf8')),
    setManifest: (m) => writeFileSync(join(root, '.quimera', 'manifest.json'), JSON.stringify(m, null, 2)),
    snapshot: () => snapshot(root),
  };

  repo.git('init', '--quiet', `--initial-branch=${branch}`);
  repo.git('config', 'user.name', IDENTITY.name);
  repo.git('config', 'user.email', IDENTITY.email);
  if (commit) {
    repo.write('README.md', '# Fixture\n');
    repo.git('add', 'README.md');
    repo.git('commit', '--quiet', '-m', 'chore: start fixture');
  }
  return repo;
}

// A disposable copy of the kit, for tests that change the kit's own files between runs.
export function copyKit(t) {
  const dir = mkdtempSync(join(tmpdir(), 'quimera-kit-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const part of KIT_PARTS) cpSync(join(KIT, part), join(dir, part), { recursive: true });
  return dir;
}

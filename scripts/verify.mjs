#!/usr/bin/env node
// Quimera · proportional verification: run only what the changes require.
//
//   node .quimera/scripts/verify.mjs          while working: lint changed files, type check, tests related to changes
//   node .quimera/scripts/verify.mjs push     before the push: the project's verify (or lint+typecheck+test) + build
//
// Options: --base=<ref> (default origin/main) · --plan (print the plan, run nothing) · --all (ignore "docs only")
//          --files=a.ts,b.ts  only these files: lint them and run their related tests, no type check
//                             (for parallel agents sharing a working tree; the coordinator runs the full checks)
// Full output of each step goes to a log file outside the project; the console shows a summary and the failures.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, basename } from 'node:path';

const args = process.argv.slice(2);
const mode = args.find((a) => !a.startsWith('--')) ?? 'changed';
const planOnly = args.includes('--plan');
const all = args.includes('--all');
const baseArg = args.find((a) => a.startsWith('--base='))?.slice('--base='.length);
const filesArg = args.find((a) => a.startsWith('--files='))?.slice('--files='.length);

if (!['changed', 'push'].includes(mode)) {
  console.error(`Unknown mode: ${mode}. Use: changed (default) | push`);
  process.exit(64);
}

const tryGit = (a) => {
  try {
    return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
};

const root = tryGit(['rev-parse', '--show-toplevel'])?.trim();
if (!root) {
  console.error('Not a git repository.');
  process.exit(2);
}
process.chdir(root);

if (!existsSync('package.json')) {
  console.error('No package.json at the repository root: use the verification commands listed in AGENTS.md.');
  process.exit(2);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const scripts = pkg.scripts ?? {};
const pm = existsSync('pnpm-lock.yaml')
  ? 'pnpm'
  : existsSync('bun.lock') || existsSync('bun.lockb')
    ? 'bun'
    : existsSync('yarn.lock')
      ? 'yarn'
      : 'npm';
const monorepo = existsSync('pnpm-workspace.yaml');
const bin = (name) => {
  const p = join('node_modules', '.bin', name);
  return existsSync(p) ? p : null;
};
const runScript = (s) => [pm, 'run', s];

// ---------- what changed ----------
const refExists = (r) => tryGit(['rev-parse', '--verify', '--quiet', r]) !== null;
const base = baseArg ?? ['origin/main', 'origin/master', 'main', 'master'].find(refExists) ?? null;
const mergeBase = base ? tryGit(['merge-base', 'HEAD', base])?.trim() || null : null;
const since = mergeBase ?? 'HEAD';

// -z output keeps non-ASCII and unusual paths intact.
const list = (out) => (out ?? '').split('\0').filter(Boolean);
const changedSet = new Set();
// `git diff <commit>` compares the working tree with the commit: committed + uncommitted changes.
list(tryGit(['diff', '-z', '--name-only', '--diff-filter=ACMR', since])).forEach((f) => changedSet.add(f));
list(tryGit(['ls-files', '-z', '--others', '--exclude-standard'])).forEach((f) => changedSet.add(f));
const deleted = list(tryGit(['diff', '-z', '--name-only', '--diff-filter=D', since]));
let files = [...changedSet].filter((f) => existsSync(f));
if (filesArg) files = filesArg.split(',').map((f) => f.trim()).filter((f) => f && existsSync(f));

// Config changes force a full run only when they are fresh (uncommitted or in the last commit):
// a lockfile touched early in the branch should not make every later run a full one.
const recent = new Set([
  ...list(tryGit(['diff', '-z', '--name-only', 'HEAD'])),
  ...list(tryGit(['diff', '-z', '--name-only', 'HEAD~1', 'HEAD'])),
  ...list(tryGit(['ls-files', '-z', '--others', '--exclude-standard'])),
]);

const isDoc = (f) => /\.(md|mdx|txt)$/i.test(f) || /(^|\/)(LICENSE|CHANGELOG|NOTICE)[^/]*$/i.test(f);
const isJs = (f) => /\.[cm]?[jt]sx?$/.test(f);
const isTest = (f) => isJs(f) && (/\.(test|spec)\.[cm]?[jt]sx?$/.test(f) || /(^|\/)(__tests__|tests?)\//.test(f));
const isConfig = (f) =>
  /(^|\/)(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?|pnpm-workspace\.yaml|\.nvmrc|tsconfig[^/]*\.json|(next|vite|vitest|eslint|playwright|postcss|tailwind)\.config\.[^/]+)$/.test(f);

const code = files.filter((f) => !isDoc(f));
const js = code.filter(isJs);
const sources = js.filter((f) => !isTest(f));
const tests = js.filter(isTest);
const configChanged = !filesArg && ([...recent].some((f) => isConfig(f)) || deleted.some((f) => isJs(f) && recent.has(f)));

console.log(`verify · mode ${mode} · ${pm}${monorepo ? ' (monorepo)' : ''} · base ${base ?? '(none: uncommitted changes only)'}`);
console.log(`changed: ${files.length} (code ${code.length}, docs ${files.length - code.length})`);

if (!all && code.length === 0 && (filesArg || deleted.length === 0)) {
  console.log('Only documentation changed: nothing to verify. (Use --all to force.)');
  process.exit(0);
}

// ---------- plan ----------
// One folder per run: parallel agents must not overwrite each other's logs.
const logDir = join(tmpdir(), `quimera-verify-${basename(root)}-${process.pid}`);
mkdirSync(logDir, { recursive: true });
const steps = [];
const affected = `...[${since}]`;

function fullPlan() {
  if (scripts.verify) {
    steps.push({ name: 'verify', cmd: runScript('verify') });
    return;
  }
  for (const s of ['lint', 'typecheck', 'test']) {
    if (scripts[s]) steps.push({ name: s, cmd: runScript(s) });
    else steps.push({ name: s, skip: `no "${s}" script in package.json` });
  }
}

function changedPlan() {
  const eslint = bin('eslint');
  if (js.length && eslint) {
    steps.push({
      name: `lint (${js.length} file${js.length > 1 ? 's' : ''})`,
      cmd: [eslint, '--no-warn-ignored', ...js],
    });
  } else if (js.length) {
    steps.push({ name: 'lint', skip: 'eslint is not installed at the root' });
  }

  // The type checker needs the whole project; in a monorepo, only affected packages.
  const hasTs = js.some((f) => /\.[cm]?tsx?$/.test(f)) || deleted.length > 0;
  if (hasTs && filesArg) {
    steps.push({ name: 'typecheck', skip: '--files mode: the coordinator runs the type check' });
  } else if (hasTs) {
    if (monorepo) steps.push({ name: 'typecheck (affected)', cmd: ['pnpm', '--filter', affected, 'run', '--if-present', 'typecheck'] });
    else if (scripts.typecheck) steps.push({ name: 'typecheck', cmd: runScript('typecheck') });
    else if (bin('tsc') && existsSync('tsconfig.json')) steps.push({ name: 'typecheck', cmd: [bin('tsc'), '--noEmit'] });
    else steps.push({ name: 'typecheck', skip: 'no typecheck script and no tsc' });
  }

  const vitest = bin('vitest');
  const jest = bin('jest');
  if (vitest && (sources.length || tests.length)) {
    if (tests.length) steps.push({ name: `changed tests (${tests.length})`, cmd: [vitest, 'run', '--passWithNoTests', ...tests] });
    if (sources.length) steps.push({ name: `related tests (${sources.length} sources)`, cmd: [vitest, 'related', '--run', '--passWithNoTests', ...sources] });
  } else if (jest && (sources.length || tests.length)) {
    steps.push({ name: `related tests (${sources.length + tests.length} files)`, cmd: [jest, '--findRelatedTests', '--passWithNoTests', ...sources, ...tests] });
  } else if (filesArg) {
    if (js.length) steps.push({ name: 'tests', skip: 'no vitest or jest to select related tests: the coordinator runs the suite' });
  } else if (monorepo) {
    steps.push({ name: 'tests (affected)', cmd: ['pnpm', '--filter', affected, 'run', '--if-present', 'test'] });
  } else if (scripts.test && js.length) {
    steps.push({ name: 'test', cmd: runScript('test') });
  }
}

if (mode === 'changed' && !configChanged) changedPlan();
else {
  if (mode === 'changed') console.log('Config, lockfile or a deleted file changed: running the full verification.');
  fullPlan();
}
if (mode === 'push') {
  if (monorepo) steps.push({ name: 'build (affected)', cmd: ['pnpm', '--filter', affected, 'run', '--if-present', 'build'], build: true });
  else if (scripts.build) steps.push({ name: 'build', cmd: runScript('build'), build: true });
  else steps.push({ name: 'build', skip: 'no "build" script' });
}

if (planOnly) {
  for (const s of steps) console.log(s.skip ? `  - ${s.name}: skip (${s.skip})` : `  - ${s.name}: ${s.cmd.join(' ')}`);
  process.exit(0);
}

// ---------- run (always in the foreground) ----------
let failed = false;
steps.forEach((s, i) => {
  if (s.skip) {
    console.log(`·  ${s.name}: skipped (${s.skip})`);
    return;
  }
  if (s.build && failed) {
    console.log(`·  ${s.name}: skipped (an earlier step failed)`);
    return;
  }
  const start = Date.now();
  const r = spawnSync(s.cmd[0], s.cmd.slice(1), {
    encoding: 'utf8',
    shell: process.platform === 'win32', // npm, pnpm and node_modules/.bin are .cmd shims on Windows
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
  });
  const exit = r.status ?? 1;
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}${r.error ? `\n${r.error.message}` : ''}`;
  const log = join(logDir, `${String(i + 1).padStart(2, '0')}-${s.name.replace(/[^\w-]+/g, '_')}.log`);
  writeFileSync(log, `$ ${s.cmd.join(' ')}\n${out}\nexit=${exit}\n`);
  const secs = ((Date.now() - start) / 1000).toFixed(1);

  if (exit === 0) {
    const summary = out
      .split('\n')
      .filter((l) => /^\s*(Tests?|Test Files|Tests:|✓ Compiled|Route|Done|passed)/i.test(l))
      .slice(-3)
      .map((l) => l.trim())
      .join(' · ');
    console.log(`ok ${s.name} (${secs}s)${summary ? ` · ${summary}` : ''}`);
    return;
  }

  failed = true;
  console.log(`FAILED ${s.name} (${secs}s) exit=${exit} · log: ${log}`);
  const lines = out.split('\n');
  const relevant = lines.filter(
    (l) => /error|fail|✗|×|⨯|expected|received|TS\d{4}/i.test(l) || /^\S+\.[cm]?[jt]sx?$/.test(l.trim()),
  );
  console.log((relevant.length ? relevant : lines).slice(-50).map((l) => `   ${l}`).join('\n'));
});

console.log(failed ? 'Result: FAILED' : 'Result: ok');
process.exit(failed ? 1 : 0);

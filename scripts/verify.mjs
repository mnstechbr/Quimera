#!/usr/bin/env node
// Quimera · proportional verification: run only what the changes require, and never report a
// change as verified without evidence.
//
//   node .quimera/scripts/verify.mjs          while working: lint changed files, type check, tests related to changes
//   node .quimera/scripts/verify.mjs push     before the push: the project's verify (or lint+typecheck+test) + build
//
// Options: --base=<ref> (default: origin/main, origin/master, main or master) · --plan (print the plan, run nothing)
//          --all (ignore "only documentation changed") · --json (one machine-readable report on stdout)
//          --files=a.ts,b.ts  only these files: lint them and run their related tests (for parallel agents
//                             sharing a working tree; the rest is left to the coordinator)
//
// .quimera/checks.json, when present, declares the project's own checks and replaces detection:
//   { "checks": [ { "name": "verify", "run": ["bash", "tools/verify.sh"] },
//                 { "name": "export", "run": ["bash", "tools/export.sh"], "when": "push" },
//                 { "name": "test", "skip": "why this project has no automated tests yet" } ] }
//
// Every step ends passed, failed, unverified (needed, but it could not run) or not applicable (with the reason).
// Exit 0 passed or nothing to verify · 1 failed · 3 unverified · 2 not a git repository, invalid checks file or base
// · 64 unknown option. Full output of each step goes to a log file outside the project.

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, isAbsolute, join } from 'node:path';
import { memoryProblems } from './lib/memory.mjs';

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const mode = positional[0] ?? 'changed';
const unknown = args.find((a) => a.startsWith('--') && !/^--(plan|all|json|base=.+|files=.*)$/.test(a)) ?? positional[1];
if (unknown || !['changed', 'push'].includes(mode)) {
  console.error(`${unknown ? `Unknown option: ${unknown}` : `Unknown mode: ${mode}`}. Use: verify.mjs [changed|push] [--base=<ref>] [--files=a,b] [--plan] [--all] [--json]`);
  process.exit(64);
}
const planOnly = args.includes('--plan');
const all = args.includes('--all');
const json = args.includes('--json');
const baseArg = args.find((a) => a.startsWith('--base='))?.slice('--base='.length);
const filesArg = args.find((a) => a.startsWith('--files='))?.slice('--files='.length);

const say = (line) => {
  if (!json) console.log(line);
};
const setupError = (message) => {
  console.error(message);
  process.exit(2);
};

const tryGit = (a) => {
  try {
    return execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
};
const git = (a) => tryGit(a)?.trim() ?? null;

const root = git(['rev-parse', '--show-toplevel']);
if (!root) setupError('Not a git repository.');
process.chdir(root);

// ---------- declared checks ----------
const CHECKS = '.quimera/checks.json';
function loadChecks() {
  if (!existsSync(CHECKS)) return null;
  let raw;
  try {
    raw = JSON.parse(readFileSync(CHECKS, 'utf8'));
  } catch (e) {
    setupError(`${CHECKS} is not valid JSON: ${e.message}`);
  }
  if (!Array.isArray(raw?.checks) || !raw.checks.length) setupError(`${CHECKS} needs a non-empty "checks" list`);
  const names = new Set();
  return raw.checks.map((c, i) => {
    const where = `${CHECKS}, check ${i + 1}${typeof c?.name === 'string' ? ` ("${c.name}")` : ''}`;
    if (typeof c?.name !== 'string' || !c.name.trim()) setupError(`${where}: "name" is required`);
    if (names.has(c.name)) setupError(`${where}: the name is used twice`);
    names.add(c.name);
    if ((c.run === undefined) === (c.skip === undefined)) setupError(`${where}: give either "run" (the command as a list of strings) or "skip" (why it does not apply)`);
    if (c.run !== undefined && (!Array.isArray(c.run) || !c.run.length || c.run.some((a) => typeof a !== 'string' || !a))) {
      setupError(`${where}: "run" must be a non-empty list of strings, for example ["npm", "test"]`);
    }
    if (c.skip !== undefined && (typeof c.skip !== 'string' || !c.skip.trim())) setupError(`${where}: "skip" must say why the check does not apply`);
    const when = c.when ?? 'changed';
    if (!['changed', 'push'].includes(when)) setupError(`${where}: "when" must be "changed" or "push"`);
    const cwd = c.cwd ?? '.';
    if (typeof cwd !== 'string' || isAbsolute(cwd) || cwd.split(/[\\/]/).includes('..')) setupError(`${where}: "cwd" must be a folder inside the project`);
    return { name: c.name, run: c.run, skip: c.skip, when, cwd };
  });
}
const declared = loadChecks();

const pkg = existsSync('package.json') ? JSON.parse(readFileSync('package.json', 'utf8')) : null;
const scripts = pkg?.scripts ?? {};
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
const refExists = (r) => git(['rev-parse', '--verify', '--quiet', r]) !== null;
if (baseArg && !refExists(baseArg)) setupError(`--base=${baseArg} is not a branch, tag or commit here.`);
const hasHead = refExists('HEAD');
const base = baseArg ?? ['origin/main', 'origin/master', 'main', 'master'].find(refExists) ?? null;
const mergeBase = base && hasHead ? git(['merge-base', 'HEAD', base]) || null : null;
const since = mergeBase ?? (hasHead ? 'HEAD' : null);

// -z output keeps non-ASCII and unusual paths intact.
const list = (out) => (out ?? '').split('\0').filter(Boolean);
const untracked = list(tryGit(['ls-files', '-z', '--others', '--exclude-standard']));
// `git diff <commit>` compares the working tree with the commit: committed + uncommitted changes.
// Before the first commit, everything in the index counts as changed.
const changedSince = (from) => [...(from ? list(tryGit(['diff', '-z', '--name-only', from])) : list(tryGit(['ls-files', '-z']))), ...untracked];
const deletedSince = (from) => (from ? list(tryGit(['diff', '-z', '--name-only', '--diff-filter=D', from])) : []);

let files = [...new Set(changedSince(since))].filter((f) => existsSync(f));
const deleted = deletedSince(since);
if (filesArg) files = filesArg.split(',').map((f) => f.trim()).filter((f) => f && existsSync(f));

const isDoc = (f) => /\.(md|txt)$/i.test(f) || /(^|\/)(LICENSE|CHANGELOG|NOTICE)[^/]*$/i.test(f);
const isJs = (f) => /\.[cm]?[jt]sx?$/.test(f);
const isTs = (f) => /\.[cm]?tsx?$/.test(f);
const isTest = (f) => isJs(f) && (/\.(test|spec)\.[cm]?[jt]sx?$/.test(f) || /(^|\/)(__tests__|tests?)\//.test(f));
const isConfig = (f) =>
  /(^|\/)(package\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?|pnpm-workspace\.yaml|\.nvmrc|tsconfig[^/]*\.json|(next|vite|vitest|eslint|playwright|postcss|tailwind)\.config\.[^/]+)$/.test(f) ||
  f === CHECKS;

const code = files.filter((f) => !isDoc(f));
const js = code.filter(isJs);
const sources = js.filter((f) => !isTest(f));
const tests = js.filter(isTest);
const other = code.filter((f) => !isJs(f) && !isConfig(f));
const codeDeleted = deleted.filter((f) => !isDoc(f));
const usesTs = existsSync('tsconfig.json') || js.some(isTs);

// A config change or a deleted file anywhere on the branch forces the full plan, until a full run
// passes: verify.mjs then records that commit, and only changes after it count.
const markerFile = git(['rev-parse', '--git-path', 'quimera-verified']);
const marker = (() => {
  try {
    const sha = readFileSync(markerFile, 'utf8').trim();
    const usable =
      /^[0-9a-f]{40,64}$/.test(sha) &&
      git(['merge-base', '--is-ancestor', sha, 'HEAD']) !== null &&
      (!mergeBase || git(['merge-base', '--is-ancestor', mergeBase, sha]) !== null);
    return usable ? sha : null;
  } catch {
    return null;
  }
})();
const impactFrom = marker ?? since;
const fullNeeded =
  !declared && !filesArg && (changedSince(impactFrom).some(isConfig) || deletedSince(impactFrom).some((f) => !isDoc(f)));

const memory = memoryProblems({ git, branch: git(['branch', '--show-current']) || null });

say(
  `verify · mode ${mode} · ${declared ? CHECKS : pkg ? `${pm}${monorepo ? ' (monorepo)' : ''}` : 'no package.json'} · ${
    filesArg ? 'scope: --files' : mergeBase ? `base ${base} (${mergeBase.slice(0, 7)})` : mode === 'push' ? 'no base: full plan' : 'no base: uncommitted changes only'
  }`,
);
say(`changed: ${files.length} (code ${code.length}, docs ${files.length - code.length}) · deleted: ${deleted.length}`);
if (memory.length) say(`memory: ${memory[0]}${memory.length > 1 ? ` (+${memory.length - 1} more: run git-preflight.mjs)` : ''}`);

// ---------- plan ----------
const steps = [];
const runStep = (name, cmd, extra = {}) => steps.push({ name, cmd, ...extra });
const unverified = (name, reason) => steps.push({ name, status: 'unverified', reason });
const notApplicable = (name, reason) => steps.push({ name, status: 'not-applicable', reason });
const COORDINATOR = 'left to the coordinator (--files scope)';
const affected = `...[${since}]`;
const s = (n) => (n > 1 ? 's' : '');

function declaredPlan() {
  for (const c of declared) {
    if (c.when === 'push' && mode !== 'push') continue;
    if (c.skip) notApplicable(c.name, c.skip);
    else if (filesArg) notApplicable(c.name, COORDINATOR);
    else runStep(c.name, c.run, { cwd: c.cwd });
  }
}

function fullPlan() {
  if (scripts.verify) return runStep('verify', runScript('verify'));
  if (scripts.lint) runStep('lint', runScript('lint'));
  else unverified('lint', 'no "lint" script in package.json');
  if (scripts.typecheck) runStep('typecheck', runScript('typecheck'));
  else if (!usesTs) notApplicable('typecheck', 'no TypeScript in this project');
  else if (bin('tsc')) runStep('typecheck', [bin('tsc'), '--noEmit']);
  else unverified('typecheck', 'tsconfig.json exists, but there is no "typecheck" script and no tsc');
  if (scripts.test) runStep('test', runScript('test'), { tests: true });
  else unverified('test', 'no "test" script in package.json; if the project has no tests, declare checks with "skip" and the reason');
}

function changedPlan() {
  const eslint = bin('eslint');
  if (!js.length) notApplicable('lint', 'no JavaScript or TypeScript changed');
  else if (eslint) runStep(`lint (${js.length} file${s(js.length)})`, [eslint, '--no-warn-ignored', ...js]);
  else if (filesArg) notApplicable('lint', COORDINATOR);
  else if (scripts.lint) runStep('lint', runScript('lint'));
  else unverified('lint', 'no linter: install eslint, add a "lint" script, or declare checks in .quimera/checks.json');

  // The type checker needs the whole project; in a monorepo, only affected packages.
  if (!(js.some(isTs) || (usesTs && codeDeleted.length))) notApplicable('typecheck', 'no TypeScript changed');
  else if (filesArg) notApplicable('typecheck', COORDINATOR);
  else if (monorepo) runStep('typecheck (affected)', ['pnpm', '--filter', affected, 'run', '--if-present', 'typecheck']);
  else if (scripts.typecheck) runStep('typecheck', runScript('typecheck'));
  else if (bin('tsc') && existsSync('tsconfig.json')) runStep('typecheck', [bin('tsc'), '--noEmit']);
  else unverified('typecheck', 'no "typecheck" script and no tsc');

  const vitest = bin('vitest');
  const jest = bin('jest');
  if (!sources.length && !tests.length) notApplicable('tests', 'no source or test files changed');
  else if (vitest) {
    if (tests.length) runStep(`changed tests (${tests.length})`, [vitest, 'run', '--passWithNoTests', ...tests], { tests: true });
    if (sources.length) runStep(`related tests (${sources.length} source${s(sources.length)})`, [vitest, 'related', '--run', '--passWithNoTests', ...sources], { tests: true });
  } else if (jest) {
    runStep(`related tests (${sources.length + tests.length} files)`, [jest, '--findRelatedTests', '--passWithNoTests', ...sources, ...tests], { tests: true });
  } else if (filesArg) notApplicable('tests', COORDINATOR);
  else if (monorepo) runStep('tests (affected)', ['pnpm', '--filter', affected, 'run', '--if-present', 'test'], { tests: true });
  else if (scripts.test) runStep('test', runScript('test'), { tests: true });
  else unverified('tests', 'no test command: add a "test" script; if the project has no tests, declare checks with "skip" and the reason');

  // Pages, styles and other files no linter or test above covers: the build is the check that reads them.
  if (other.length) {
    const what = `${other.length} other file${s(other.length)}`;
    if (filesArg) notApplicable(`build (${what})`, COORDINATOR);
    else if (scripts.build) runStep(`build (${what})`, runScript('build'));
    else unverified(`checks for ${what}`, `no check covers ${other.slice(0, 3).join(', ')}${other.length > 3 ? ', …' : ''}: add a "build" script or declare checks`);
  }
}

const nothingChanged = files.length === 0 && deleted.length === 0;
const docsOnly = code.length === 0 && codeDeleted.length === 0;
// With no base, the change list holds only uncommitted work, so push cannot trust it: run everything.
let skipReason = null;
if (!all && !(mode === 'push' && !mergeBase && !filesArg)) {
  if (nothingChanged) skipReason = mergeBase ? `nothing changed since ${base}` : 'nothing to verify: no uncommitted changes and no base to compare with';
  else if (docsOnly) skipReason = 'only documentation changed';
}

if (skipReason) notApplicable('checks', skipReason);
else if (declared) declaredPlan();
else if (!pkg) unverified('checks', `no package.json and no ${CHECKS}: declare this project's checks there (format in the verification skill)`);
else {
  if (mode === 'push' && !mergeBase && !filesArg) say('no base to compare with: running the full plan.');
  if (mode === 'changed' && fullNeeded) say('A config file or a deleted file changed on this branch: running the full verification.');
  if (mode === 'changed' && !fullNeeded) changedPlan();
  else fullPlan();
  if (mode === 'push') {
    if (monorepo) runStep('build (affected)', ['pnpm', '--filter', affected, 'run', '--if-present', 'build'], { build: true });
    else if (scripts.build) runStep('build', runScript('build'), { build: true });
    else notApplicable('build', 'no "build" script');
  }
}

const revision = hasHead ? git(['rev-parse', 'HEAD']) : null;
const report = (result, counts) => ({
  mode,
  base,
  mergeBase,
  revision,
  dirty: Boolean(git(['status', '--porcelain'])),
  scope: filesArg ? 'files' : declared ? 'declared' : mode === 'push' || fullNeeded ? 'full' : 'changed',
  checks: declared ? CHECKS : null,
  files,
  deleted,
  memory,
  steps: steps.map(({ name, status, cmd, cwd, reason, exit, seconds, log }) => ({ name, status, command: cmd ?? null, cwd: cwd ?? null, reason: reason ?? null, exit: exit ?? null, seconds: seconds ?? null, log: log ?? null })),
  counts,
  result,
});

if (planOnly) {
  for (const st of steps) say(st.cmd ? `  - ${st.name}: ${st.cmd.join(' ')}` : `  - ${st.name}: ${st.status} (${st.reason})`);
  if (json) console.log(JSON.stringify(report('planned', null), null, 2));
  process.exit(0);
}

// ---------- run (always in the foreground) ----------
// One folder per run: parallel agents must not overwrite each other's logs.
const logDir = join(tmpdir(), `quimera-verify-${basename(root)}-${process.pid}`);
let failed = false;
steps.forEach((st, i) => {
  if (!st.cmd) return;
  if (st.build && failed) {
    Object.assign(st, { status: 'unverified', reason: 'an earlier step failed' });
    return;
  }
  mkdirSync(logDir, { recursive: true });
  const start = Date.now();
  const r = spawnSync(st.cmd[0], st.cmd.slice(1), {
    cwd: join(root, st.cwd ?? '.'),
    encoding: 'utf8',
    shell: process.platform === 'win32', // npm, pnpm and node_modules/.bin are .cmd shims on Windows
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
  });
  const exit = r.status ?? 1;
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}${r.error ? `\n${r.error.message}` : ''}${r.signal ? `\nstopped by ${r.signal}` : ''}`;
  const log = join(logDir, `${String(i + 1).padStart(2, '0')}-${st.name.replace(/[^\w-]+/g, '_')}.log`);
  writeFileSync(log, `$ ${st.cmd.join(' ')}\n${out}\nexit=${exit}\n`);
  Object.assign(st, { exit, log, seconds: Number(((Date.now() - start) / 1000).toFixed(1)) });

  if (exit === 0 && !r.error && !r.signal) {
    // A runner that selected no tests proved nothing about these files.
    if (st.tests && /No test files found|No tests found/i.test(out)) {
      Object.assign(st, { status: 'unverified', reason: 'the test runner found no tests for these files' });
      return;
    }
    st.status = 'passed';
    const summary = out
      .split('\n')
      .filter((l) => /^\s*(Tests?|Test Files|Tests:|✓ Compiled|Route|Done|passed)/i.test(l))
      .slice(-3)
      .map((l) => l.trim())
      .join(' · ');
    st.summary = summary;
    return;
  }
  failed = true;
  st.status = 'failed';
  const lines = out.split('\n');
  const relevant = lines.filter((l) => /error|fail|✗|×|⨯|expected|received|TS\d{4}/i.test(l) || /^\S+\.[cm]?[jt]sx?$/.test(l.trim()));
  st.excerpt = (relevant.length ? relevant : lines).slice(-50).map((l) => `   ${l}`).join('\n');
});

const counts = { passed: 0, failed: 0, unverified: 0, 'not-applicable': 0 };
for (const st of steps) counts[st.status]++;
// Push readiness needs at least one check that actually ran.
const result = counts.failed
  ? 'failed'
  : counts.unverified || (mode === 'push' && !counts.passed && !skipReason)
    ? 'unverified'
    : counts.passed
      ? 'passed'
      : 'not-applicable';

// A passing full run is the new starting point for "config or deletion changed" (see fullNeeded).
if (result === 'passed' && !declared && !filesArg && (mode === 'push' || fullNeeded) && revision && markerFile) {
  try {
    writeFileSync(markerFile, `${revision}\n`);
  } catch {}
}

if (json) {
  console.log(JSON.stringify(report(result, counts), null, 2));
} else {
  for (const st of steps) {
    if (st.status === 'passed') say(`ok ${st.name} (${st.seconds}s)${st.summary ? ` · ${st.summary}` : ''}`);
    else if (st.status === 'failed') say(`FAILED ${st.name} (${st.seconds}s) exit=${st.exit} · log: ${st.log}\n${st.excerpt}`);
    else say(`·  ${st.name}: ${st.status === 'not-applicable' ? 'not applicable' : 'unverified'} (${st.reason})`);
  }
  const tally = [
    `${counts.passed} passed`,
    counts.failed && `${counts.failed} failed`,
    counts.unverified && `${counts.unverified} unverified`,
    counts['not-applicable'] && `${counts['not-applicable']} not applicable`,
  ].filter(Boolean);
  say(`Result: ${result.replace('-', ' ')} · ${tally.join(' · ')}${filesArg ? ' · files scope: the coordinator runs the rest' : ''}`);
}
process.exit({ passed: 0, 'not-applicable': 0, failed: 1, unverified: 3 }[result]);

#!/usr/bin/env node
// Quimera installer: copies the kit into the current git repository.
//
//   quimera init   [--tools=claude,…] [--mode=discreet|open] [--models=full|economic] [--specialists=security,database,interface|none] [--local-only] [--dry-run]
//   quimera update [--tools=…] [--models=…] [--specialists=…] [--dry-run]   refresh kit files; local edits are kept and the new version is saved as *.quimera-new
//   quimera doctor [--json]        installation health, then work readiness (the git preflight)
//
// Exit codes: 0 done · 1 failed or needs attention · 2 not a git repository · 64 invalid command or option.
//
// It only copies Markdown and small Node scripts. It never installs dependencies, never touches
// your source code, and never overwrites a file it did not create.

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  chmodSync,
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODES, PROFILES, SPECIALISTS, TOOLS, readManifest, writeManifest } from './lib/manifest.mjs';
import { diskProblem, present } from './lib/paths.mjs';
import { digest as digestOf, guardState, lf } from '../scripts/lib/guard.mjs';

const KIT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = JSON.parse(readFileSync(join(KIT, 'package.json'), 'utf8')).version;
const MANIFEST = '.quimera/manifest.json';
// Claude Code role agents in the economic model profile (adapters/models.md): reviewers on the
// mid-size model, code and search on the small one. The full profile keeps each file as shipped.
const ECONOMIC_AGENTS = {
  'quimera-explorer.md': ['haiku', 'low'],
  'quimera-implementer.md': ['haiku', 'medium'],
  default: ['sonnet', 'medium'],
};
// Role agents that exist only for one specialist reviewer; the others come with Claude Code always.
const SPECIALIST_AGENTS = {
  security: 'quimera-security-reviewer.md',
  database: 'quimera-database-reviewer.md',
  interface: 'quimera-interface-reviewer.md',
};

// The options each command accepts: true takes a value, false is a plain switch.
const COMMANDS = {
  init: { tools: true, mode: true, models: true, specialists: true, 'local-only': false, 'dry-run': false },
  update: { tools: true, models: true, specialists: true, 'dry-run': false },
  doctor: { json: false },
};
const HELP = `Quimera ${VERSION}
  quimera init   [--tools=${TOOLS.join(',')}] [--mode=${MODES.join('|')}] [--models=${PROFILES.join('|')}]
                 [--specialists=${SPECIALISTS.join(',')}|none] [--local-only] [--dry-run]
  quimera update [--tools=…] [--models=${PROFILES.join('|')}] [--specialists=…|none] [--dry-run]
  quimera doctor [--json]

Exit codes: 0 done · 1 failed or needs attention (the output says what) · 2 not a git repository · 64 invalid command or option`;

// Invalid usage stops here, before the repository is even looked at.
function usageError(message) {
  console.error(`${message}\n\n${HELP}`);
  process.exit(64);
}

function parseOptions(command, args) {
  const allowed = COMMANDS[command];
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const m = args[i].match(/^--([a-z-]+)(?:=([\s\S]*))?$/);
    if (!m) usageError(`Unexpected argument: ${args[i]}`);
    const [, name, inline] = m;
    if (!(name in allowed)) usageError(`quimera ${command} does not take --${name}`);
    if (name in options) usageError(`--${name} was given twice`);
    if (!allowed[name]) {
      if (inline !== undefined) usageError(`--${name} takes no value`);
      options[name] = true;
      continue;
    }
    // Accepts both --tools=claude and --tools claude.
    const v = inline ?? (args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : undefined);
    if (!v) usageError(`--${name} needs a value`);
    options[name] = v;
  }
  const list = (name, allowedValues) => {
    const values = [...new Set(options[name].split(',').map((t) => t.trim()).filter(Boolean))];
    const bad = values.filter((t) => !allowedValues.includes(t));
    if (!values.length) usageError(`--${name} needs at least one value`);
    if (bad.length) usageError(`Unknown value(s) for --${name}: ${bad.join(', ')}. Choose from: ${allowedValues.join(', ')}`);
    return values;
  };
  if (options.tools !== undefined) options.tools = list('tools', TOOLS);
  if (options.specialists !== undefined) {
    const chosen = options.specialists === 'none' ? [] : list('specialists', SPECIALISTS);
    options.specialists = SPECIALISTS.filter((s) => chosen.includes(s));
  }
  if (options.mode !== undefined && !MODES.includes(options.mode)) usageError(`Unknown mode: ${options.mode}. Choose from: ${MODES.join(', ')}`);
  if (options.models !== undefined && !PROFILES.includes(options.models)) {
    usageError(`Unknown model profile: ${options.models}. Choose from: ${PROFILES.join(', ')}`);
  }
  return options;
}

const [command = 'help', ...rest] = process.argv.slice(2);
if (['help', '--help', '-h'].includes(command)) {
  console.log(HELP);
  process.exit(0);
}
if (!(command in COMMANDS)) usageError(`Unknown command: ${command}`);
const options = parseOptions(command, rest);
const dryRun = Boolean(options['dry-run']);

function repoRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    console.error('Run this inside a git repository (git init first).');
    process.exit(2);
  }
}
// A file inside this repository's git folder (it differs per worktree).
const gitPath = (name) => {
  const p = execFileSync('git', ['rev-parse', '--git-path', name], { encoding: 'utf8' }).trim();
  return isAbsolute(p) ? p : join(process.cwd(), p);
};

const shaOf = (buf) => createHash('sha256').update(buf).digest('hex');
const sha = (path) => shaOf(readFileSync(path));

// The bytes a kit file should have in this project. Only Claude role agents change, and only
// their model and effort lines, so the agent bodies are never duplicated in the kit.
function content(src, dest, models) {
  const buf = readFileSync(src);
  if (models !== 'economic' || !dest.startsWith('.claude/agents/')) return buf;
  const name = dest.split('/').pop();
  const [model, effort] = ECONOMIC_AGENTS[name] ?? ECONOMIC_AGENTS.default;
  return Buffer.from(
    buf.toString('utf8').replace(/^model: .*$/m, `model: ${model}`).replace(/^effort: .*$/m, `effort: ${effort}`),
  );
}
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// What goes where: [source in the kit, destination in the project, with forward slashes]
function plan(tools, specialists) {
  const pairs = [];
  const add = (src, dest) => pairs.push([src, dest.split(sep).join('/')]);
  add(join(KIT, 'QUIMERA.md'), '.quimera/QUIMERA.md');
  // The skills adapt MIT-licensed work: the notices travel with them, and so does what changed.
  for (const f of ['NOTICE.md', 'LICENSE', 'CHANGELOG.md']) add(join(KIT, f), `.quimera/${f}`);
  for (const dir of ['scripts', 'adapters', 'templates']) {
    for (const f of walk(join(KIT, dir))) {
      if (dir === 'templates' && relative(KIT, f).startsWith(join('templates', 'claude'))) continue;
      add(f, join('.quimera', relative(KIT, f)));
    }
  }
  const skillFiles = walk(join(KIT, 'skills'));
  for (const f of skillFiles) add(f, join('.agents', relative(KIT, f)));
  const mirror = (base) => skillFiles.forEach((f) => add(f, join(base, relative(join(KIT, 'skills'), f))));
  if (tools.includes('claude')) {
    mirror('.claude/skills');
    const agents = join(KIT, 'templates', 'claude', 'agents');
    const left = Object.entries(SPECIALIST_AGENTS).filter(([s]) => !specialists.includes(s)).map(([, file]) => file);
    for (const f of walk(agents)) if (!left.includes(relative(agents, f))) add(f, join('.claude', 'agents', relative(agents, f)));
    add(join(KIT, 'templates', 'CLAUDE.md'), 'CLAUDE.md');
  }
  if (tools.includes('copilot')) {
    mirror('.github/skills');
    add(join(KIT, 'templates', 'copilot-instructions.md'), '.github/copilot-instructions.md');
  }
  if (tools.includes('cursor')) mirror('.cursor/skills');
  return pairs;
}

// Every change a run will make, decided before the first write. The dry run prints this list and
// the real run carries out exactly this list. `next` is the digest map the manifest will hold.
function planOperations(pairs, files, models, update) {
  const ops = [];
  const result = { written: [], kept: [], skipped: [], removed: [], orphaned: [] };
  const next = { ...files };
  for (const [src, dest] of pairs) {
    const exists = present(dest);
    const ours = files[dest];
    const bytes = content(src, dest, models);
    const digest = shaOf(bytes);
    const newCopy = `${dest}.quimera-new`;
    const dropStaleCopy = () => present(newCopy) && ops.push({ type: 'drop', path: newCopy, reason: 'stale offer' });
    if (exists && !ours) {
      // A file we did not create: never touch it.
      result.skipped.push(dest);
      continue;
    }
    if (exists && ours) {
      const current = sha(dest);
      if (current !== ours) {
        // We created it but it was edited locally.
        if (current === digest) {
          // The edit already matches the new version: adopt it, nothing to offer.
          ops.push({ type: 'adopt', path: dest });
          next[dest] = current;
          dropStaleCopy();
        } else if (digest !== ours) {
          // Keep the edit and offer the new version beside it.
          ops.push({ type: 'offer', path: newCopy, content: bytes });
          result.kept.push(dest);
        } else dropStaleCopy(); // the kit's version did not change: an older offer is stale
        continue;
      }
      if (digest === ours) {
        dropStaleCopy(); // already current
        continue;
      }
    }
    dropStaleCopy();
    ops.push({ type: 'write', path: dest, content: bytes, reason: exists ? 'update' : 'new' });
    next[dest] = digest;
    result.written.push(dest);
  }

  // Files an older kit installed that this one no longer ships: remove them if untouched.
  if (update) {
    const shipped = new Set(pairs.map(([, dest]) => dest));
    for (const dest of Object.keys(files)) {
      if (shipped.has(dest)) continue;
      if (present(dest) && sha(dest) !== files[dest]) {
        result.orphaned.push(dest);
        continue;
      }
      if (present(dest)) ops.push({ type: 'remove', path: dest, reason: 'no longer shipped' });
      delete next[dest];
      result.removed.push(dest);
    }
  }
  return { ops, result, next };
}

// Stops before anything is written: every problem is listed, and the project stays as it was.
function refuse(problems) {
  console.error(`Quimera stopped:\n${problems.map((p) => `  ${p}`).join('\n')}`);
  console.error('Nothing was changed. Fix or restore what is listed, then run the command again.');
  process.exit(1);
}

// The manifest, checked as a whole before any of its paths is used.
function loadManifest(root) {
  const unsafe = diskProblem(root, MANIFEST, { own: true });
  if (unsafe) refuse([unsafe]);
  const { manifest, problems } = readManifest(readFileSync(MANIFEST, 'utf8'));
  if (problems.length) refuse(problems.map((p) => `${MANIFEST}: ${p}`));
  return manifest;
}

// One run at a time. A lock left by a run that was killed is removed by hand, as the message says.
function takeLock() {
  const lock = gitPath('quimera.lock');
  try {
    const fd = openSync(lock, 'wx');
    writeFileSync(fd, `${process.pid}\n`);
    closeSync(fd);
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
    refuse([`${relative(process.cwd(), lock)}: another Quimera run is in progress. If none is (a run was stopped), delete that file and run the command again.`]);
  }
  process.on('exit', () => {
    try {
      unlinkSync(lock);
    } catch {}
  });
}

function install({ update }) {
  const root = repoRoot();
  process.chdir(root);
  if (update && !present(MANIFEST)) {
    console.error('Quimera is not installed here. Use: quimera init');
    process.exit(1);
  }
  if (!update && present(MANIFEST)) {
    console.error('Quimera is already installed here. Use: quimera update');
    process.exit(1);
  }
  const old = update ? loadManifest(root) : null;
  // null means "not set by the installer": the project profile decides.
  const desired = {
    tools: options.tools ?? old?.desired.tools ?? ['claude'],
    models: options.models ?? old?.desired.models ?? 'full',
    mode: options.mode ?? old?.desired.mode ?? null,
    localOnly: options['local-only'] ? true : (old?.desired.localOnly ?? null),
    specialists: options.specialists ?? old?.desired.specialists ?? [...SPECIALISTS],
  };
  const files = { ...(old?.installed.files ?? {}) };
  const pairs = plan(desired.tools, desired.specialists);

  // Every path this run may read, write or delete is checked on disk first.
  const paths = new Set([...pairs.map(([, dest]) => dest), ...Object.keys(files)]);
  const unsafe = [
    diskProblem(root, MANIFEST, { own: true }),
    diskProblem(root, `${MANIFEST}.tmp`, { own: true }),
    ...[...paths].flatMap((p) => [diskProblem(root, p, { own: p in files }), diskProblem(root, `${p}.quimera-new`, { own: true })]),
  ].filter(Boolean);
  if (unsafe.length) refuse([...new Set(unsafe)]);

  const { ops, result, next } = planOperations(pairs, files, desired.models, update);
  const n = (a) => a.length;
  const setup = `tools: ${desired.tools.join(', ')} · models: ${desired.models} · specialists: ${desired.specialists.join(', ') || 'none'}`;

  if (dryRun) {
    console.log(`[dry run] Quimera ${VERSION} would ${update ? 'update' : 'install'} · ${setup}`);
    for (const op of ops) console.log(`  ${op.type.padEnd(6)} ${op.path}${op.reason ? ` (${op.reason})` : ''}`);
    if (!ops.length) console.log('  nothing to change');
    if (n(result.orphaned)) console.log(`  no longer shipped but edited by you, would stay:\n${result.orphaned.map((f) => `    ${f}`).join('\n')}`);
    if (n(result.skipped)) console.log(`  would leave untouched (not created by Quimera):\n${result.skipped.map((f) => `    ${f}`).join('\n')}`);
    return;
  }

  // A journal of the planned changes lives in the git folder until the manifest is written, so an
  // interrupted run is visible (doctor reports it) and the next run finishes it.
  takeLock();
  const journal = gitPath('quimera-update.json');
  writeFileSync(journal, `${JSON.stringify({ started: new Date().toISOString(), kit: VERSION, operations: ops.map(({ type, path }) => ({ type, path })) }, null, 2)}\n`);
  let at = null;
  try {
    for (const op of ops) {
      at = op.path;
      if (op.type === 'write' || op.type === 'offer') {
        mkdirSync(dirname(op.path), { recursive: true });
        writeFileSync(op.path, op.content);
        if (op.type === 'write' && /\.mjs$|commit-msg$/.test(op.path)) chmodSync(op.path, 0o755);
      } else if (op.type === 'drop' || op.type === 'remove') rmSync(op.path, { force: true });
    }
  } catch (e) {
    console.error(`Quimera stopped while changing ${at}: ${e.message.split('\n')[0]}`);
    console.error(`The manifest still describes the files as they were before this run; ${relative(root, journal)} lists what was planned.`);
    console.error('Fix the problem and run the same command again: files already changed are recognised and the rest is finished.');
    process.exit(1);
  }

  // Steps after the kit files that did not complete; the kit files themselves stay installed.
  const notDone = [];

  // *.quimera-new files are local review copies: keep them out of commits on this machine.
  try {
    const ex = gitPath('info/exclude');
    const cur = existsSync(ex) ? readFileSync(ex, 'utf8') : '';
    if (!cur.split(/\r?\n/).includes('*.quimera-new')) {
      mkdirSync(dirname(ex), { recursive: true });
      appendFileSync(ex, `${cur && !cur.endsWith('\n') ? '\n' : ''}*.quimera-new\n`);
    }
  } catch (e) {
    notDone.push(`keeping *.quimera-new out of commits (.git/info/exclude): ${e.message.split('\n')[0]}`);
  }

  const source = (() => {
    try {
      return execFileSync('git', ['-C', KIT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      return null;
    }
  })();
  const pending = {
    offers: [...new Set([...pairs.map(([, d]) => d), ...Object.keys(next)])].map((p) => `${p}.quimera-new`).filter(present).sort(),
    orphans: [...result.orphaned].sort(),
  };
  // Written whole and then renamed, so a reader never sees half a manifest. The helpers below read
  // it (local-only excludes exactly the files it lists), so it is written before them.
  let hook = old?.hook ?? null;
  const saveManifest = () => {
    mkdirSync('.quimera', { recursive: true });
    writeFileSync(`${MANIFEST}.tmp`, writeManifest({ desired, installed: { version: VERSION, source, files: next }, pending, hook }));
    renameSync(`${MANIFEST}.tmp`, MANIFEST);
  };
  saveManifest();
  rmSync(journal, { force: true });

  // Helpers run from this kit, never from the project: a copy there may be old, edited or not ours.
  const helper = (step, name, args = []) => {
    const r = spawnSync(process.execPath, [join(KIT, 'scripts', name), ...args], { stdio: 'inherit' });
    const why = r.error ? `could not start (${r.error.message})` : r.signal ? `stopped by ${r.signal}` : r.status !== 0 ? `exited with ${r.status}` : null;
    if (why) notDone.push(`${step}: ${why}. After fixing it, run: node .quimera/scripts/${name}`);
    return !why;
  };
  const hookFile = join(gitPath('hooks'), 'commit-msg');
  const recordHook = () => {
    const rel = relative(root, hookFile);
    hook = { path: rel.startsWith('..') || isAbsolute(rel) ? hookFile : rel.split(sep).join('/'), digest: sha(hookFile) };
  };
  if (!update && options.mode === 'discreet' && helper('the discreet-mode commit-msg guard', 'install-hooks.mjs')) recordHook();
  // An update refreshes the guard only when it is exactly one Quimera installed; an edited guard,
  // another tool's hook or a shared hooks folder is left alone.
  const notes = [];
  if (update && existsSync(hookFile)) {
    const nextGuard = lf(readFileSync(join(KIT, 'scripts', 'commit-msg'), 'utf8'));
    const state = guardState(readFileSync(hookFile, 'utf8'), nextGuard, old?.hook?.digest ?? null);
    const common = execFileSync('git', ['rev-parse', '--git-common-dir'], { encoding: 'utf8' }).trim();
    const inGitDir = !relative(isAbsolute(common) ? common : join(root, common), hookFile).startsWith('..');
    if (state === 'upgrade' && inGitDir) {
      writeFileSync(hookFile, nextGuard);
      chmodSync(hookFile, 0o755);
      recordHook();
      notes.push('the commit-msg guard was refreshed to this version');
    } else if (state === 'upgrade') notes.push('the commit-msg guard is in a shared hooks folder: refresh it with node .quimera/scripts/install-hooks.mjs --shared');
    else if (state === 'edited') notes.push('the commit-msg guard was edited here, so it was left as it is (compare it with .quimera/scripts/commit-msg)');
    else if (state === 'current' && old?.hook?.digest !== digestOf(nextGuard)) recordHook();
  }
  // Local-only exclusions are exact, so they follow every change of the installed files.
  const localOnly = options['local-only'] || (readProfile().localOnly ?? desired.localOnly);
  if (localOnly) helper('the local-only exclusions', 'local-only.mjs');
  if (hook !== old?.hook) saveManifest();

  console.log(`Quimera ${VERSION} ${update ? 'updated' : 'installed'} · ${setup}`);
  if (update && old.installed.version !== VERSION) console.log(`  version: ${old.installed.version} → ${VERSION}; what changed is in .quimera/CHANGELOG.md`);
  console.log(`  written: ${n(result.written)} file(s)`);
  if (n(result.kept)) console.log(`  kept your edits in ${n(result.kept)} file(s); the new version is next to each as *.quimera-new:\n${result.kept.map((f) => `    ${f}`).join('\n')}`);
  if (n(result.removed)) console.log(`  removed ${n(result.removed)} file(s) the kit no longer ships`);
  if (n(result.orphaned)) console.log(`  no longer shipped but edited by you, left in place:\n${result.orphaned.map((f) => `    ${f}`).join('\n')}`);
  if (n(result.skipped)) console.log(`  left untouched (not created by Quimera):\n${result.skipped.map((f) => `    ${f}`).join('\n')}`);
  for (const x of notes) console.log(`  note: ${x}`);
  if (result.skipped.includes('CLAUDE.md') && existsSync('CLAUDE.md')) {
    const text = readFileSync('CLAUDE.md', 'utf8');
    if (!/^@AGENTS\.md\s*$/m.test(text)) console.log('  note: your CLAUDE.md does not import AGENTS.md, so Claude Code will not read it. Add a line "@AGENTS.md".');
  }
  if (!update) {
    console.log('\nNext: open your coding agent in this folder and say "start this project with Quimera".');
    console.log('It runs the project-kickoff skill: mode, identity, and the memory files, asking you first.');
  }
  if (notDone.length) {
    console.error(`\nNot done:\n${notDone.map((s) => `  ${s}`).join('\n')}`);
    console.error(`The kit files listed above were ${update ? 'updated' : 'installed'}; only these steps are missing.`);
    process.exit(1);
  }
}

// The project profile's mode and Quimera-files lines, from .quimera/PROFILE.md or AGENTS.md.
function readProfile() {
  const file = ['.quimera/PROFILE.md', 'AGENTS.md'].find((f) => existsSync(f) && /\*\*Git identity:\*\*/i.test(readFileSync(f, 'utf8')));
  if (!file) return { file: null, mode: null, localOnly: null };
  const text = readFileSync(file, 'utf8');
  const field = (label) => text.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*(.+)`, 'i'))?.[1]?.trim().toLowerCase();
  const files = field('Quimera files');
  return { file, mode: field('Mode')?.match(/^(discreet|open)\b/)?.[1] ?? null, localOnly: files ? files.startsWith('local-only') : null };
}

// Read-only. Installation health decides the exit code; work readiness is reported beside it.
function doctor() {
  const root = repoRoot();
  process.chdir(root);
  if (!present(MANIFEST)) {
    console.log('Quimera is not installed here.');
    process.exit(1);
  }
  const m = loadManifest(root);
  const problems = [];
  const notes = [];
  const problem = (kind, path, message) => problems.push({ kind, path, message });
  const note = (kind, path, message) => notes.push({ kind, path, message });

  const files = m.installed.files;
  let unchanged = 0;
  for (const [p, digest] of Object.entries(files)) {
    const unsafe = diskProblem(root, p, { own: true });
    if (unsafe) problem('unsafe', p, unsafe);
    else if (!present(p)) problem('missing', p, 'missing: update restores it');
    else if (sha(p) !== digest) note('edited', p, 'edited here; update keeps your version');
    else unchanged++;
    if (present(`${p}.quimera-new`)) problem('offer', `${p}.quimera-new`, 'a newer kit version waits beside your edit: compare the two, keep one, delete the .quimera-new copy');
  }
  for (const p of m.pending.orphans) if (present(p)) note('orphan', p, 'no longer shipped by the kit; kept because you edited it');
  for (const p of Object.keys(files)) {
    const mirror = p.match(/^\.(claude|github|cursor)\/skills\/(.+)$/);
    const canonical = mirror && `.agents/skills/${mirror[2]}`;
    if (canonical && present(p) && present(canonical) && !diskProblem(root, p, { own: true }) && sha(p) !== sha(canonical)) {
      problem('diverged', p, `differs from ${canonical}: tools would read different versions of this skill`);
    }
  }

  const profile = readProfile();
  if (m.desired.mode && profile.mode && profile.mode !== m.desired.mode) {
    problem('drift', profile.file, `the profile says mode ${profile.mode}, but the installation was set up for ${m.desired.mode}`);
  }
  if (m.desired.localOnly !== null && profile.localOnly !== null && profile.localOnly !== m.desired.localOnly) {
    problem('drift', profile.file, `the profile says Quimera files are ${profile.localOnly ? 'local-only' : 'committed'}, but the installation was set up ${m.desired.localOnly ? 'local-only' : 'committed'}`);
  }
  if ((profile.mode ?? m.desired.mode) === 'discreet') {
    const hook = join(gitPath('hooks'), 'commit-msg');
    const text = existsSync(hook) ? readFileSync(hook, 'utf8') : null;
    const lf = (s) => s.replace(/\r\n/g, '\n');
    if (text === null) problem('hook', null, 'discreet mode without the commit-msg guard: run node .quimera/scripts/install-hooks.mjs');
    else if (!text.includes('quimera:commit-msg')) problem('hook', null, 'discreet mode, but another commit-msg hook is installed: add the Quimera guard to it (see .quimera/scripts/commit-msg)');
    else if (shaOf(lf(text)) !== shaOf(lf(readFileSync(join(KIT, 'scripts', 'commit-msg'), 'utf8')))) {
      note('hook', null, "the commit-msg guard differs from this kit's version (an older kit, or edited)");
    }
  }
  if (profile.localOnly ?? m.desired.localOnly) {
    const ignored = spawnSync('git', ['check-ignore', '-q', '.quimera/QUIMERA.md']).status === 0;
    if (!ignored) problem('local-only', null, 'Quimera files should be local-only, but .quimera/ is not excluded from git: run node .quimera/scripts/local-only.mjs');
    // Local-only memory exists only on this disk unless it has its own history.
    if (!existsSync('.quimera/memory.git')) {
      note('memory', null, 'local-only memory has no history and no copy: node .quimera/scripts/memory.mjs init keeps one in a private repository on this machine');
    } else if (/Not saved yet/.test(spawnSync(process.execPath, [join(KIT, 'scripts', 'memory.mjs'), 'status'], { encoding: 'utf8' }).stdout ?? '')) {
      note('memory', null, 'memory changes are not saved yet: node .quimera/scripts/memory.mjs save');
    }
  }
  if (present(gitPath('quimera-update.json'))) problem('interrupted', null, 'a previous run did not finish: run update again to complete it');
  if (m.installed.version !== VERSION) note('version', null, `installed ${m.installed.version}; this kit is ${VERSION}: update moves to it`);
  if (!profile.file) note('profile', null, 'no project profile yet: run the project-kickoff skill');

  const r = spawnSync(process.execPath, [join(KIT, 'scripts', 'git-preflight.mjs')], { encoding: 'utf8' });
  const total = Object.keys(files).length;
  if (options.json) {
    console.log(
      JSON.stringify(
        {
          installed: m.installed.version,
          source: m.installed.source,
          kit: VERSION,
          desired: m.desired,
          installation: { healthy: !problems.length, files: total, unchanged, problems, notes },
          readiness: { ready: r.status === 0, exit: r.status, report: r.stdout },
        },
        null,
        2,
      ),
    );
    process.exit(problems.length ? 1 : 0);
  }
  console.log(`Quimera ${m.installed.version}${m.installed.source ? ` (${m.installed.source})` : ''} · tools: ${m.desired.tools.join(', ')} · models: ${m.desired.models} · kit available: ${VERSION}`);
  console.log('\nInstallation');
  console.log(`  ok        ${unchanged} of ${total} kit files as installed`);
  for (const p of problems) console.log(`  problem   ${p.kind}: ${p.path ? `${p.path}: ` : ''}${p.message}`);
  for (const x of notes) console.log(`  note      ${x.kind}: ${x.path ? `${x.path}: ` : ''}${x.message}`);
  console.log(problems.length ? `Installation: ${problems.length} problem(s)` : 'Installation: healthy');
  console.log('\nWork readiness (git preflight)');
  process.stdout.write(r.stdout ?? '');
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.error || r.signal) console.error(`The git preflight did not finish: ${r.error?.message ?? `stopped by ${r.signal}`}`);
  process.exit(problems.length ? 1 : 0);
}

switch (command) {
  case 'init':
    install({ update: false });
    break;
  case 'update':
    install({ update: true });
    break;
  case 'doctor':
    doctor();
    break;
}

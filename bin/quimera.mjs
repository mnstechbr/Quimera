#!/usr/bin/env node
// Quimera installer: copies the kit into the current git repository.
//
//   quimera init   [--tools=claude,codex,copilot,cursor,antigravity,other] [--mode=discreet|open] [--models=full|economic] [--local-only] [--dry-run]
//   quimera update [--models=full|economic] [--dry-run]   refresh kit files; local edits are kept and the new version is saved as *.quimera-new
//   quimera doctor                 check the installation and run the git preflight
//
// It only copies Markdown and small Node scripts. It never installs dependencies, never touches
// your source code, and never overwrites a file it did not create.

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync, chmodSync } from 'node:fs';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const KIT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = JSON.parse(readFileSync(join(KIT, 'package.json'), 'utf8')).version;
const MANIFEST = '.quimera/manifest.json';
const TOOLS = ['claude', 'codex', 'copilot', 'cursor', 'antigravity', 'other'];
const PROFILES = ['full', 'economic'];
// Claude Code role agents in the economic model profile (adapters/models.md): reviewers on the
// mid-size model, code and search on the small one. The full profile keeps each file as shipped.
const ECONOMIC_AGENTS = {
  'quimera-explorer.md': ['haiku', 'low'],
  'quimera-implementer.md': ['haiku', 'medium'],
  default: ['sonnet', 'medium'],
};

const [command = 'help', ...rest] = process.argv.slice(2);
const flag = (name) => rest.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
// Accepts both --tools=claude and --tools claude.
const value = (name) => {
  const f = flag(name);
  if (!f) return undefined;
  if (f.includes('=')) return f.split('=').slice(1).join('=');
  const next = rest[rest.indexOf(f) + 1];
  return next && !next.startsWith('--') ? next : undefined;
};
const dryRun = Boolean(flag('dry-run'));

function repoRoot() {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    console.error('Run this inside a git repository (git init first).');
    process.exit(2);
  }
}

const shaOf = (buf) => createHash('sha256').update(buf).digest('hex');
const sha = (path) => shaOf(readFileSync(path));

// The bytes a kit file should have in this project. Only Claude role agents change, and only
// their model and effort lines, so the agent bodies are never duplicated in the kit.
function content(src, dest, models) {
  const buf = readFileSync(src);
  if (models !== 'economic' || !dest.startsWith(join('.claude', 'agents'))) return buf;
  const name = dest.split(/[\\/]/).pop();
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

// What goes where: [source in the kit, destination in the project]
function plan(tools) {
  const pairs = [];
  const add = (src, dest) => pairs.push([src, dest]);
  add(join(KIT, 'QUIMERA.md'), '.quimera/QUIMERA.md');
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
    for (const f of walk(join(KIT, 'templates', 'claude', 'agents'))) add(f, join('.claude', 'agents', relative(join(KIT, 'templates', 'claude', 'agents'), f)));
    add(join(KIT, 'templates', 'CLAUDE.md'), 'CLAUDE.md');
  }
  if (tools.includes('copilot')) {
    mirror('.github/skills');
    add(join(KIT, 'templates', 'copilot-instructions.md'), '.github/copilot-instructions.md');
  }
  if (tools.includes('cursor')) mirror('.cursor/skills');
  return pairs;
}

function install({ update }) {
  const root = repoRoot();
  process.chdir(root);
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : { files: {} };
  if (update && !existsSync(MANIFEST)) {
    console.error('Quimera is not installed here. Use: quimera init');
    process.exit(1);
  }
  if (!update && existsSync(MANIFEST)) {
    console.error('Quimera is already installed here. Use: quimera update');
    process.exit(1);
  }

  const tools = update
    ? manifest.tools
    : (value('tools') ?? 'claude').split(',').map((t) => t.trim()).filter(Boolean);
  const bad = tools.filter((t) => !TOOLS.includes(t));
  if (bad.length) {
    console.error(`Unknown tool(s): ${bad.join(', ')}. Choose from: ${TOOLS.join(', ')}`);
    process.exit(64);
  }
  if (flag('models') && !value('models')) {
    console.error(`--models needs a value: ${PROFILES.join(' or ')}`);
    process.exit(64);
  }
  const models = value('models') ?? manifest.models ?? 'full';
  if (!PROFILES.includes(models)) {
    console.error(`Unknown model profile: ${models}. Choose from: ${PROFILES.join(', ')}`);
    process.exit(64);
  }

  const result = { written: [], kept: [], skipped: [], removed: [], orphaned: [] };
  const files = { ...manifest.files };
  const pairs = plan(tools);
  for (const [src, dest] of pairs) {
    const exists = existsSync(dest);
    const ours = files[dest];
    const next = content(src, dest, models);
    if (exists && !ours) {
      // A file we did not create: never touch it.
      result.skipped.push(dest);
      continue;
    }
    const newCopy = `${dest}.quimera-new`;
    const dropStaleCopy = () => {
      if (!dryRun && existsSync(newCopy)) rmSync(newCopy);
    };
    if (exists && ours && sha(dest) !== ours) {
      // We created it but it was edited locally.
      if (sha(dest) === shaOf(next)) {
        // The edit already matches the new version: adopt it, nothing to offer.
        if (!dryRun) files[dest] = sha(dest);
        dropStaleCopy();
      } else if (shaOf(next) !== ours) {
        // Keep the edit and offer the new version beside it.
        if (!dryRun) {
          mkdirSync(dirname(dest), { recursive: true });
          writeFileSync(newCopy, next);
        }
        result.kept.push(dest);
      } else dropStaleCopy(); // the kit's version did not change: an older offer is stale
      continue;
    }
    if (exists && ours && shaOf(next) === ours) {
      dropStaleCopy(); // already current
      continue;
    }
    dropStaleCopy();
    if (!dryRun) {
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, next);
      if (/\.mjs$|commit-msg$/.test(dest)) chmodSync(dest, 0o755);
      files[dest] = sha(dest);
    }
    result.written.push(dest);
  }

  // Files an older kit installed that the new kit no longer ships: remove them if untouched.
  if (update) {
    const shipped = new Set(pairs.map(([, dest]) => dest));
    for (const dest of Object.keys(files)) {
      if (shipped.has(dest)) continue;
      if (existsSync(dest) && sha(dest) !== files[dest]) {
        result.orphaned.push(dest);
        continue;
      }
      if (!dryRun && existsSync(dest)) rmSync(dest);
      if (!dryRun) delete files[dest];
      result.removed.push(dest);
    }
  }

  if (!dryRun) {
    const source = (() => {
      try {
        return execFileSync('git', ['-C', KIT, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      } catch {
        return null;
      }
    })();
    mkdirSync('.quimera', { recursive: true });
    writeFileSync(MANIFEST, JSON.stringify({ version: VERSION, source, tools, models, files }, null, 2) + '\n');
  }

  // *.quimera-new files are local review copies: keep them out of commits on this machine.
  if (!dryRun) {
    try {
      let ex = execFileSync('git', ['rev-parse', '--git-path', 'info/exclude'], { encoding: 'utf8' }).trim();
      if (!isAbsolute(ex)) ex = join(process.cwd(), ex);
      const cur = existsSync(ex) ? readFileSync(ex, 'utf8') : '';
      if (!cur.split(/\r?\n/).includes('*.quimera-new')) {
        mkdirSync(dirname(ex), { recursive: true });
        appendFileSync(ex, `${cur && !cur.endsWith('\n') ? '\n' : ''}*.quimera-new\n`);
      }
    } catch {}
  }

  const mode = value('mode');
  if (!update && mode === 'discreet' && !dryRun) spawnSync('node', ['.quimera/scripts/install-hooks.mjs'], { stdio: 'inherit' });
  if (!update && flag('local-only') && !dryRun) spawnSync('node', ['.quimera/scripts/local-only.mjs'], { stdio: 'inherit' });

  const n = (a) => a.length;
  console.log(`${dryRun ? '[dry run] ' : ''}Quimera ${VERSION} ${update ? 'updated' : 'installed'} · tools: ${tools.join(', ')} · models: ${models}`);
  console.log(`  written: ${n(result.written)} file(s)`);
  if (n(result.kept)) console.log(`  kept your edits in ${n(result.kept)} file(s); the new version is next to each as *.quimera-new:\n${result.kept.map((f) => `    ${f}`).join('\n')}`);
  if (n(result.removed)) console.log(`  removed ${n(result.removed)} file(s) the kit no longer ships`);
  if (n(result.orphaned)) console.log(`  no longer shipped but edited by you, left in place:\n${result.orphaned.map((f) => `    ${f}`).join('\n')}`);
  if (n(result.skipped)) console.log(`  left untouched (not created by Quimera):\n${result.skipped.map((f) => `    ${f}`).join('\n')}`);
  if (result.skipped.includes('CLAUDE.md')) {
    const text = readFileSync('CLAUDE.md', 'utf8');
    if (!/^@AGENTS\.md\s*$/m.test(text)) console.log('  note: your CLAUDE.md does not import AGENTS.md, so Claude Code will not read it. Add a line "@AGENTS.md".');
  }
  if (!update) {
    console.log('\nNext: open your coding agent in this folder and say "start this project with Quimera".');
    console.log('It runs the project-kickoff skill: mode, identity, and the memory files, asking you first.');
  }
}

function doctor() {
  const root = repoRoot();
  process.chdir(root);
  if (!existsSync(MANIFEST)) {
    console.log('Quimera is not installed here.');
    process.exit(1);
  }
  const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  const missing = Object.keys(m.files).filter((f) => !existsSync(f));
  console.log(`Quimera ${m.version}${m.source ? ` (${m.source})` : ''} · tools: ${m.tools.join(', ')} · models: ${m.models ?? 'full'} · kit available: ${VERSION}`);
  console.log(missing.length ? `missing files:\n${missing.map((f) => `  ${f}`).join('\n')}` : 'all kit files present');
  console.log(existsSync('AGENTS.md') ? 'AGENTS.md present' : 'no AGENTS.md yet: run the project-kickoff skill');
  const r = spawnSync('node', ['.quimera/scripts/git-preflight.mjs', '--no-fetch'], { stdio: 'inherit' });
  process.exit(missing.length || r.status ? 1 : 0);
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
  default:
    console.log(`Quimera ${VERSION}
  quimera init   [--tools=claude,codex,copilot,cursor,antigravity,other] [--mode=discreet|open] [--models=full|economic] [--local-only] [--dry-run]
  quimera update [--models=full|economic] [--dry-run]
  quimera doctor`);
}

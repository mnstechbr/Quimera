#!/usr/bin/env node
// Quimera · keeps the Quimera kit and the project memory out of git, on this machine only.
//
//   node .quimera/scripts/local-only.mjs                     exclude the kit files and the memory files
//   node .quimera/scripts/local-only.mjs --product-docs      also exclude docs/vision/, docs/studies/, docs/plans/, docs/reviews/
//   node .quimera/scripts/local-only.mjs --no-product-docs   stop excluding them
//
// It rebuilds one block in .git/info/exclude (never committed) from the files Quimera installed
// (.quimera/manifest.json) and the memory files, path by path, so the project's own files in the
// same folders stay visible. Lines outside the block are never changed, except the broad list
// Quimera 0.3.0 wrote, which the block replaces. Files git already tracks are listed, never untracked.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join } from 'node:path';
import { readSmall } from './lib/files.mjs';
import { pathProblem } from './lib/managed.mjs';
import { BLOCK_BEGIN, BLOCK_END, LEDGERS, MEMORY_FILES, PRODUCT_DOCS, memoryPaths, splitExclude, standardsFiles } from './lib/local-files.mjs';

// What Quimera 0.3.0 appended: whole folders, which also hid the project's own files.
const OLD_HEADER = '# quimera: local-only files';
const OLD_PATHS = new Set([
  '/.quimera/', '/.agents/skills/', '/AGENTS.md', '/CLAUDE.md', '/.claude/skills/', '/.claude/agents/quimera-*.md',
  '/.github/copilot-instructions.md', '/.github/skills/', '/.cursor/skills/', '/docs/STATE.md', '/docs/MAP.md',
  '/docs/VISION.md', '/docs/vision/', '/docs/DECISIONS.md', '/docs/DESIGN.md', '/docs/EXPERIENCE.md',
  '/docs/standards/', '/docs/studies/', '/docs/plans/', '/docs/reviews/', '*.quimera-new',
]);

const args = process.argv.slice(2);
const unknown = args.find((a) => !['--product-docs', '--no-product-docs'].includes(a));
if (unknown || args.length > 1) {
  console.error(`Unknown option: ${unknown ?? args.join(' ')}. Use --product-docs or --no-product-docs.`);
  process.exit(64);
}

let root;
try {
  root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
} catch {
  console.error('Not a git repository.');
  process.exit(2);
}
// Every later git call runs from the repository root, so relative answers resolve correctly.
const git = (a) => execFileSync('git', a, { encoding: 'utf8', cwd: root }).trim();
let exclude = git(['rev-parse', '--git-path', 'info/exclude']);
if (!isAbsolute(exclude)) exclude = join(root, exclude);

// The kit files outside .quimera/, exactly as the manifest lists them (0.3.0 or schema 2).
let kitFiles = [];
const manifestFile = join(root, '.quimera', 'manifest.json');
if (existsSync(manifestFile)) {
  try {
    const m = JSON.parse(readSmall(manifestFile, { root, max: 4 * 1024 * 1024 }) ?? '');
    kitFiles = Object.keys(m.installed?.files ?? m.files ?? {});
  } catch {
    console.error('.quimera/manifest.json is not valid JSON: only the memory files are excluded. Run "quimera doctor".');
  }
} else {
  console.error('No .quimera/manifest.json yet: only .quimera/ and the memory files are excluded. Run this again after "quimera init".');
}
// A kit path that is also a valid pattern: inside the managed folders (the installer's own rule), with
// no glob characters and no negation. Anything else in a manifest would hide the project's files.
const plain = (p) => !pathProblem(p) && /^[\w.@+-][\w./@+ -]*$/.test(p);

const current = existsSync(exclude) ? readFileSync(exclude, 'utf8') : '';
let { outside, block } = splitExclude(current);
if (outside.includes(OLD_HEADER)) outside = outside.filter((l) => l !== OLD_HEADER && !OLD_PATHS.has(l));
// Product documents follow the last explicit choice.
const productDocs = args.includes('--product-docs') ? true : args.includes('--no-product-docs') ? false : (block?.includes('/docs/plans/') ?? false);

const entries = [
  '/.quimera/',
  ...[...new Set([...kitFiles.filter((p) => plain(p) && !p.startsWith('.quimera/')), ...MEMORY_FILES, ...Object.values(memoryPaths(root)), ...standardsFiles(root), LEDGERS])].sort().map((p) => `/${p}`),
  ...(productDocs ? PRODUCT_DOCS.map((p) => `/${p}`) : []),
  '*.quimera-new',
];

while (outside.length && outside.at(-1) === '') outside.pop();
const text = `${[...outside, ...(outside.length ? [''] : []), BLOCK_BEGIN, ...entries, BLOCK_END].join('\n')}\n`;
if (text !== current) {
  mkdirSync(dirname(exclude), { recursive: true });
  writeFileSync(exclude, text);
  console.log(`Excluded ${entries.length} path(s) in ${exclude}${productDocs ? ', product documents included' : ''}`);
} else {
  console.log('Already up to date.');
}

const pathspecs = entries.map((p) => (p.endsWith('/') ? `:(glob)${p.slice(1)}**` : p.startsWith('/') ? `:(glob)${p.slice(1)}` : `:(glob)**/${p}`));
const tracked = git(['ls-files', '--', ...pathspecs]);
if (tracked) {
  console.log('These files are already tracked by git, so exclude does not hide them. Decide with the user before untracking anything:');
  console.log(tracked.split('\n').map((f) => `  ${f}`).join('\n'));
}

// Quimera · which files are project memory and which are product documents, for local-only
// projects. Shared by local-only.mjs, memory.mjs and the installer's doctor. Read-only.

import { readSmall } from './files.mjs';
import { join, posix } from 'node:path';

export const MEMORY_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'docs/STATE.md',
  'docs/MAP.md',
  'docs/VISION.md',
  'docs/DECISIONS.md',
  'docs/DESIGN.md',
  'docs/EXPERIENCE.md',
  'docs/standards/INDEX.md',
];
// The owner's own documents: excluded in local-only mode only when the owner chooses so.
export const PRODUCT_DOCS = ['docs/vision/', 'docs/studies/', 'docs/plans/', 'docs/reviews/'];
// The state, map and decisions files: the defaults, or the files the profile's "Memory" line names
// (for example: state `memory/CURRENT.md` · map `docs/MAP.md` · decisions `docs/DECISIONS.md`).
export function memoryPaths(root) {
  const paths = { state: 'docs/STATE.md', map: 'docs/MAP.md', decisions: 'docs/DECISIONS.md' };
  const text = ['.quimera/PROFILE.md', 'AGENTS.md'].map((f) => readSmall(join(root, f), { root })).find((t) => t !== null);
  const line = text?.match(/\*\*Memory:\*\*[ \t]*([^\n]+)/i)?.[1];
  for (const key of Object.keys(paths)) {
    const p = line?.match(new RegExp(`${key}\\s+\`([^\`]+)\``, 'i'))?.[1];
    // Only a Markdown file inside the project counts: no folder, no git metadata, nothing that climbs.
    if (p && /^[\w.@+][\w./@+ -]*\.md$/i.test(p) && !p.split('/').some((s) => s === '..' || s.toLowerCase() === '.git')) paths[key] = posix.normalize(p);
  }
  return paths;
}

// parallel-agents working files: process memory, not product documents.
export const LEDGERS = 'docs/plans/*.ledger.md';

// The standards that docs/standards/INDEX.md points to (code-standards writes them), as
// `docs/standards/…` paths or relative Markdown links. Nothing outside docs/standards/ counts.
export function standardsFiles(root) {
  const text = readSmall(join(root, 'docs', 'standards', 'INDEX.md'), { root });
  if (text === null) return [];
  const found = new Set();
  for (const [, p] of text.matchAll(/(docs\/standards\/[\w./-]+\.md)/g)) found.add(posix.normalize(p));
  for (const [, p] of text.matchAll(/\]\(([\w./-]+\.md)\)/g)) found.add(p.startsWith('docs/') ? posix.normalize(p) : posix.join('docs/standards', p));
  return [...found].filter((p) => p.startsWith('docs/standards/') && p !== 'docs/standards/INDEX.md' && !p.split('/').some((s) => s.toLowerCase() === '.git')).sort();
}

// The block local-only.mjs owns in .git/info/exclude.
export const BLOCK_BEGIN = '# quimera:local-only begin (rebuilt by .quimera/scripts/local-only.mjs; add your own lines outside this block)';
export const BLOCK_END = '# quimera:local-only end';

// { outside: lines not in the block, block: lines inside it, or null when there is none }
export function splitExclude(text) {
  const lines = text.split(/\r?\n/);
  const begin = lines.indexOf(BLOCK_BEGIN);
  const end = lines.indexOf(BLOCK_END, begin + 1);
  if (begin < 0 || end < 0) return { outside: lines, block: null };
  return { outside: [...lines.slice(0, begin), ...lines.slice(end + 1)], block: lines.slice(begin + 1, end) };
}

// Quimera · which files are project memory and which are product documents, for local-only
// projects. Shared by local-only.mjs, memory.mjs and the installer's doctor. Read-only.

import { existsSync, readFileSync } from 'node:fs';
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
// parallel-agents working files: process memory, not product documents.
export const LEDGERS = 'docs/plans/*.ledger.md';

// The standards that docs/standards/INDEX.md points to (code-standards writes them), as
// `docs/standards/…` paths or relative Markdown links. Nothing outside docs/standards/ counts.
export function standardsFiles(root) {
  const index = join(root, 'docs', 'standards', 'INDEX.md');
  if (!existsSync(index)) return [];
  const text = readFileSync(index, 'utf8');
  const found = new Set();
  for (const [, p] of text.matchAll(/(docs\/standards\/[\w./-]+\.md)/g)) found.add(posix.normalize(p));
  for (const [, p] of text.matchAll(/\]\(([\w./-]+\.md)\)/g)) found.add(p.startsWith('docs/') ? posix.normalize(p) : posix.join('docs/standards', p));
  return [...found].filter((p) => p.startsWith('docs/standards/') && p !== 'docs/standards/INDEX.md').sort();
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

// Quimera · what to do with an existing commit-msg hook. Shared by install-hooks.mjs and the
// installer's update. A guard is upgraded only when it is exactly one Quimera shipped: either a
// released version below, or the one this installation recorded. Anything else is left alone.

import { createHash } from 'node:crypto';

export const MARKER = 'quimera:commit-msg';
// sha256 of each guard Quimera has released. When scripts/commit-msg changes, add the digest of
// the version being replaced here, so installations of it can still be upgraded.
export const RELEASED = new Set([
  'cd0da12a50660d96a648070e4da58e63fdca27904bb4a49f99682052d8499f52', // 0.3.0
]);

export const lf = (text) => text.replace(/\r\n/g, '\n');
export const digest = (text) => createHash('sha256').update(text).digest('hex');

// 'missing' | 'current' | 'upgrade' (an unedited older Quimera guard) | 'edited' (a Quimera guard
// someone changed) | 'other' (another tool's hook)
export function guardState(existing, next, recorded = null) {
  if (existing === null) return 'missing';
  if (existing === next) return 'current';
  if (!existing.includes(MARKER)) return 'other';
  const d = digest(existing);
  return RELEASED.has(d) || d === recorded ? 'upgrade' : 'edited';
}

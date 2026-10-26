// Quimera · is the project memory current? Compares docs/STATE.md with the repository.
// Shared by the git preflight and verify.mjs. Read-only.
//
// The pilots kept working for hours while STATE.md stayed days behind, and nothing said so.
// Each problem is one line that names the file and what to do.

import { existsSync, readFileSync, statSync } from 'node:fs';

export const STATE_FILE = 'docs/STATE.md';
const MAX_LINES = 60;
const MAX_BYTES = 6 * 1024;
// close-task rewrites STATE.md in the same commit as the work, so a few commits without it
// means the loop was skipped.
const MAX_COMMITS_SINCE = 3;

// `git(args)` returns trimmed stdout, or null when the command fails. `branch` is the current branch.
export function memoryProblems({ git, branch, file = STATE_FILE }) {
  if (!existsSync(file)) return [];
  const lastCommit = git(['log', '-1', '--format=%cI']);
  if (!lastCommit) return []; // no commits yet: nothing to compare with
  const text = readFileSync(file, 'utf8');
  const out = [];

  // Commits since the file last changed: from git when it is tracked, from its modification time
  // when it is kept out of git (local-only). Uncommitted edits count as a fresh update.
  const tracked = git(['ls-files', '--error-unmatch', '--', file]) !== null;
  let since;
  if (!tracked) since = Number(git(['rev-list', '--count', `--since=${statSync(file).mtime.toISOString()}`, 'HEAD']) ?? 0);
  else if (git(['status', '--porcelain', '--', file])) since = 0;
  else {
    const last = git(['log', '-1', '--format=%H', '--', file]);
    since = last ? Number(git(['rev-list', '--count', `${last}..HEAD`]) ?? 0) : 0;
  }
  if (since >= MAX_COMMITS_SINCE) out.push(`${file} was last updated ${since} commits ago: rewrite it whole before going on (close-task, step 3)`);

  const updated = text.match(/\*\*Updated:\*\*\s*(\d{4}-\d{2}-\d{2})/)?.[1];
  const lastDay = lastCommit.slice(0, 10); // the committer's own date
  if (updated && updated < lastDay) out.push(`${file} says "Updated: ${updated}", but the last commit is from ${lastDay}: rewrite it whole`);

  // The first item under "## Branch" starts with the branch name.
  const lines = text.split(/\r?\n/);
  const at = lines.findIndex((l) => /^##\s+Branch\b/i.test(l));
  const item = at < 0 ? null : lines.slice(at + 1).find((l) => /^\s*[-*]\s+\S/.test(l));
  const named = item?.replace(/^\s*[-*]\s+/, '').match(/^`?([^\s`·(]+)/)?.[1];
  if (named && branch && !named.includes('{{') && named !== branch) {
    out.push(`${file} names branch ${named}, but the current branch is ${branch}: update it`);
  }

  const bytes = Buffer.byteLength(text);
  const count = lines.length - (text.endsWith('\n') ? 1 : 0);
  if (count > MAX_LINES || bytes > MAX_BYTES) {
    out.push(`${file} has ${count} lines (${(bytes / 1024).toFixed(1)} KB): keep it under ${MAX_LINES} lines and ${MAX_BYTES / 1024} KB, rewritten whole`);
  }
  return out;
}

// Path rules for the files Quimera manages in a project.
//
// Destinations come from the kit's own plan and from .quimera/manifest.json, which lives in the
// project and can be edited, corrupted or crafted. Every path is checked here before the installer
// reads, writes or deletes anything, so a bad path stops the whole run with nothing changed.

import { lstatSync } from 'node:fs';
import { join } from 'node:path';

// Folders and files the installer may create, update or remove. Paths use forward slashes.
export const MANAGED_DIRS = ['.quimera/', '.agents/skills/', '.claude/skills/', '.claude/agents/', '.github/skills/', '.cursor/skills/'];
export const MANAGED_FILES = ['CLAUDE.md', '.github/copilot-instructions.md'];
// Files inside managed folders that belong to the project, never to the manifest.
const PROJECT_FILES = ['.quimera/PROFILE.md', '.quimera/manifest.json'];

// Why `p` can never be a managed path, or null when it can.
export function pathProblem(p) {
  if (typeof p !== 'string' || !p) return 'empty path';
  // Backslashes, colons (drive letters, Windows streams) and absolute paths could leave the project.
  if (/[\\:\0]/.test(p) || p.startsWith('/')) return 'not a relative path with forward slashes';
  const parts = p.split('/');
  // Windows drops a trailing dot or space, so ".. " would climb like "..".
  if (parts.some((s) => s === '' || s === '.' || s === '..' || /[. ]$/.test(s))) return 'has an empty, "." or ".." segment';
  if (parts.some((s) => s.toLowerCase() === '.git')) return 'points into git metadata';
  if (PROJECT_FILES.includes(p)) return 'belongs to the project, not to the kit';
  if (!MANAGED_FILES.includes(p) && !MANAGED_DIRS.some((d) => p.startsWith(d))) return 'is outside the folders Quimera manages';
  return null;
}

const lstat = (p) => {
  try {
    return lstatSync(p);
  } catch {
    return null;
  }
};

// Why `rel` is unsafe to use inside `root` as it is on disk, or null. Every folder between the
// project root and the file must be a real folder (a symlink would lead outside the project), and
// the file itself must not be a symlink when `own` says Quimera reads, writes or deletes it.
export function diskProblem(root, rel, { own }) {
  const parts = rel.split('/');
  let at = root;
  for (const [i, part] of parts.slice(0, -1).entries()) {
    at = join(at, part);
    const st = lstat(at);
    if (!st) return null; // missing: it will be created as a real folder
    const where = parts.slice(0, i + 1).join('/');
    if (st.isSymbolicLink()) return `${where}: is a symbolic link; Quimera only writes into real folders inside the project`;
    if (!st.isDirectory()) return `${where}: is a file where a folder is expected`;
  }
  if (own && lstat(join(root, rel))?.isSymbolicLink()) return `${rel}: is a symbolic link; Quimera never writes through one`;
  return null;
}

// Like existsSync, but a symlink counts as present even when its target is missing.
export const present = (p) => lstat(p) !== null;

// Path rules for the files Quimera manages in a project.
//
// Destinations come from the kit's own plan and from .quimera/manifest.json, which lives in the
// project and can be edited, corrupted or crafted. Every path is checked here before the installer
// reads, writes or deletes anything, so a bad path stops the whole run with nothing changed.

import { lstatSync } from 'node:fs';
import { join } from 'node:path';

export { MANAGED_DIRS, MANAGED_FILES, pathProblem } from '../../scripts/lib/managed.mjs';

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
  const target = own ? lstat(join(root, rel)) : null;
  if (target?.isSymbolicLink()) return `${rel}: is a symbolic link; Quimera never writes through one`;
  if (target?.isDirectory()) return `${rel}: is a folder where a file is expected`;
  return null;
}

// Like existsSync, but a symlink counts as present even when its target is missing.
export const present = (p) => lstat(p) !== null;

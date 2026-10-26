// Quimera · reading project files that a cloned repository may have crafted: only regular files
// inside the project, and only up to a size no memory or profile file needs to exceed. A symlink to
// a device, to a file elsewhere, or a file of gigabytes is treated as absent.

import { readFileSync, realpathSync, statSync } from 'node:fs';
import { isAbsolute, relative } from 'node:path';

export const SMALL = 64 * 1024;

export function readSmall(path, { root = process.cwd(), max = SMALL } = {}) {
  try {
    const real = realpathSync(path);
    const rel = relative(realpathSync(root), real);
    if (rel.startsWith('..') || isAbsolute(rel)) return null;
    const st = statSync(real);
    if (!st.isFile() || st.size > max) return null;
    return readFileSync(real, 'utf8');
  } catch {
    return null;
  }
}

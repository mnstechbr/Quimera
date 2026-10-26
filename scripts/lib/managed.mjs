// Quimera · which paths in a project belong to the kit. Shared by the installer (bin/lib/paths.mjs)
// and local-only.mjs, so a manifest key outside these folders can neither be written, deleted nor
// turned into an exclusion that hides the project's own files.

// Folders and files the installer may create, update or remove. Paths use forward slashes.
export const MANAGED_DIRS = ['.quimera/', '.agents/skills/', '.claude/skills/', '.claude/agents/', '.github/skills/', '.cursor/skills/'];
export const MANAGED_FILES = ['CLAUDE.md', '.github/copilot-instructions.md'];
// Inside managed folders but owned by the project: never claimed by a manifest. Compared without
// letter case, as on the case-insensitive disks of macOS and Windows.
const PROJECT_FILES = ['.quimera/profile.md', '.quimera/manifest.json', '.quimera/checks.json'];
const PROJECT_DIRS = ['.quimera/memory.git/'];

// Why `p` can never be a managed path, or null when it can.
export function pathProblem(p) {
  if (typeof p !== 'string' || !p) return 'empty path';
  // Backslashes, colons (drive letters, Windows streams) and absolute paths could leave the project.
  if (/[\\:\0]/.test(p) || p.startsWith('/')) return 'not a relative path with forward slashes';
  const parts = p.split('/');
  // Windows drops a trailing dot or space, so ".. " would climb like "..".
  if (parts.some((s) => s === '' || s === '.' || s === '..' || /[. ]$/.test(s))) return 'has an empty, "." or ".." segment';
  if (parts.some((s) => s.toLowerCase() === '.git')) return 'points into git metadata';
  const lower = p.toLowerCase();
  if (PROJECT_FILES.includes(lower) || PROJECT_DIRS.some((d) => lower.startsWith(d))) return 'belongs to the project, not to the kit';
  if (!MANAGED_FILES.includes(p) && !MANAGED_DIRS.some((d) => p.startsWith(d))) return 'is outside the folders Quimera manages';
  return null;
}

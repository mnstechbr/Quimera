// Reading .quimera/manifest.json: the record of what the installer wrote and the digest of each
// file as written. The whole manifest is checked before it is trusted for anything.

import { pathProblem } from './paths.mjs';

export const TOOLS = ['claude', 'codex', 'copilot', 'cursor', 'antigravity', 'other'];
export const PROFILES = ['full', 'economic'];
const DIGEST = /^[0-9a-f]{64}$/;
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

// { manifest, problems }: `manifest` is usable only when `problems` is empty.
export function readManifest(text) {
  let m;
  try {
    m = JSON.parse(text);
  } catch {
    return { problems: ['not valid JSON'] };
  }
  if (!isObject(m)) return { problems: ['not a JSON object'] };

  const problems = [];
  // 0.3.0 wrote no schema field. A newer kit's manifest needs that newer kit.
  if ('schema' in m && m.schema !== 1) problems.push(`schema ${JSON.stringify(m.schema)} is not supported by this version of the kit`);
  if (typeof m.version !== 'string') problems.push('"version" is missing');
  if (!Array.isArray(m.tools) || !m.tools.length || m.tools.some((t) => !TOOLS.includes(t))) {
    problems.push(`"tools" must list some of: ${TOOLS.join(', ')}`);
  }
  if (m.models !== undefined && !PROFILES.includes(m.models)) problems.push(`"models" must be one of: ${PROFILES.join(', ')}`);
  if (!isObject(m.files)) {
    problems.push('"files" is missing');
    return { problems };
  }
  const seen = new Map();
  for (const [path, digest] of Object.entries(m.files)) {
    const bad = pathProblem(path);
    if (bad) problems.push(`${JSON.stringify(path)} ${bad}`);
    if (typeof digest !== 'string' || !DIGEST.test(digest)) problems.push(`${JSON.stringify(path)} has a malformed digest`);
    // On case-insensitive disks two spellings are the same file.
    const key = path.toLowerCase();
    if (seen.has(key)) problems.push(`${JSON.stringify(path)} and ${JSON.stringify(seen.get(key))} differ only in letter case`);
    else seen.set(key, path);
  }
  return problems.length ? { problems } : { manifest: m, problems };
}

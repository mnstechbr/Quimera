// Reading and writing .quimera/manifest.json: what the project asked for, what the installer wrote
// (with the digest of each file as written), what is waiting for the user, and the hook it installed.
// The whole manifest is checked before it is trusted for anything.
//
// Schema 2:
//   { "schema": 2,
//     "desired":   { "tools": [...], "models": "full", "mode": "discreet" | "open" | null,
//                    "localOnly": true | false | null, "specialists": [...] },
//     "installed": { "version": "0.4.0", "source": "<commit>" | null, "files": { "<path>": "<sha256>" } },
//     "pending":   { "offers": ["<path>.quimera-new"], "orphans": ["<path>"] },
//     "hook":      { "path": "<git hooks path>/commit-msg", "digest": "<sha256>" } | null }
// null in "desired" means the installer was not told, so the project profile decides.
// Quimera 0.3.0 wrote { version, source, tools, models, files }; it is read as schema 2.

import { pathProblem } from './paths.mjs';

export const SCHEMA = 2;
export const TOOLS = ['claude', 'codex', 'copilot', 'cursor', 'antigravity', 'other'];
export const PROFILES = ['full', 'economic'];
export const MODES = ['discreet', 'open'];
export const SPECIALISTS = ['security', 'database', 'interface'];
const DIGEST = /^[0-9a-f]{64}$/;
const isObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const isList = (v, allowed) => Array.isArray(v) && v.every((x) => allowed.includes(x)) && new Set(v).size === v.length;

// A 0.3.0 manifest in the schema 2 shape. On Windows 0.3.0 wrote keys with backslashes; they are
// converted here and then pass the same path checks as any other key.
function fromLegacy(m) {
  const files = isObject(m.files) ? Object.fromEntries(Object.entries(m.files).map(([k, v]) => [String(k).replaceAll('\\', '/'), v])) : m.files;
  return {
    schema: SCHEMA,
    desired: { tools: m.tools, models: m.models ?? 'full', mode: null, localOnly: null, specialists: [...SPECIALISTS] },
    installed: { version: m.version, source: m.source ?? null, files },
    pending: { offers: [], orphans: [] },
    hook: null,
  };
}

// { manifest, problems }: `manifest` is usable only when `problems` is empty.
export function readManifest(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { problems: ['not valid JSON'] };
  }
  if (!isObject(raw)) return { problems: ['not a JSON object'] };
  if ('schema' in raw && raw.schema !== SCHEMA) return { problems: [`schema ${JSON.stringify(raw.schema)} is not supported by this version of the kit`] };
  const m = 'schema' in raw ? raw : fromLegacy(raw);

  const problems = [];
  const { desired: d, installed: inst, pending = { offers: [], orphans: [] }, hook = null } = m;
  if (!isObject(d)) problems.push('"desired" is missing');
  else {
    if (!isList(d.tools, TOOLS) || !d.tools.length) problems.push(`"tools" must list some of: ${TOOLS.join(', ')}`);
    if (!PROFILES.includes(d.models)) problems.push(`"models" must be one of: ${PROFILES.join(', ')}`);
    if (d.mode !== null && !MODES.includes(d.mode)) problems.push(`"mode" must be one of: ${MODES.join(', ')}, or null`);
    if (d.localOnly !== null && typeof d.localOnly !== 'boolean') problems.push('"localOnly" must be true, false or null');
    if (!isList(d.specialists, SPECIALISTS)) problems.push(`"specialists" must list some of: ${SPECIALISTS.join(', ')}`);
  }
  if (!isObject(inst)) problems.push('"installed" is missing');
  else {
    if (typeof inst.version !== 'string') problems.push('"version" is missing');
    if (inst.source !== null && typeof inst.source !== 'string') problems.push('"source" must be a commit or null');
    if (!isObject(inst.files)) problems.push('"files" is missing');
    else {
      const seen = new Map();
      for (const [path, digest] of Object.entries(inst.files)) {
        const bad = pathProblem(path);
        if (bad) problems.push(`${JSON.stringify(path)} ${bad}`);
        if (typeof digest !== 'string' || !DIGEST.test(digest)) problems.push(`${JSON.stringify(path)} has a malformed digest`);
        // On case-insensitive disks two spellings are the same file.
        const key = path.toLowerCase();
        if (seen.has(key)) problems.push(`${JSON.stringify(path)} and ${JSON.stringify(seen.get(key))} differ only in letter case`);
        else seen.set(key, path);
      }
    }
  }
  if (!isObject(pending) || !Array.isArray(pending.offers) || !Array.isArray(pending.orphans)) problems.push('"pending" must hold "offers" and "orphans" lists');
  else {
    for (const p of pending.orphans) if (pathProblem(p)) problems.push(`orphan ${JSON.stringify(p)} ${pathProblem(p)}`);
    for (const p of pending.offers) {
      const bad = typeof p === 'string' && p.endsWith('.quimera-new') ? pathProblem(p.slice(0, -'.quimera-new'.length)) : 'is not a .quimera-new copy';
      if (bad) problems.push(`offer ${JSON.stringify(p)} ${bad}`);
    }
  }
  if (hook !== null && !(isObject(hook) && typeof hook.path === 'string' && DIGEST.test(hook.digest ?? ''))) problems.push('"hook" must be null or { path, digest }');

  return problems.length ? { problems } : { manifest: { schema: SCHEMA, desired: d, installed: inst, pending, hook }, problems };
}

export const writeManifest = (m) => `${JSON.stringify({ schema: SCHEMA, desired: m.desired, installed: m.installed, pending: m.pending, hook: m.hook }, null, 2)}\n`;

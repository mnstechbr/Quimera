#!/usr/bin/env node
// Quimera · content checks for the kit itself (development only; never copied into projects).
//
//   node dev/check-content.mjs [kit-root]
//
// An error breaks a kit rule (AGENTS.md, "Rules for changing the kit") or can stop a tool from
// loading a skill. Advice is worth a look but does not fail the check. Exit 1 on any error.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SIZE_ADVICE = 12 * 1024;
const SIZE_LIMIT = 20 * 1024;
const NAME = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DESCRIPTION_MAX = 1024;
const TRADEMARK = /bmad/i;
const PRONOUN = /\b(he|him|his|himself|she|her|hers|herself)\b/i;
// Paths a skill may point to: its own references and templates, and the kit files a project gets in .quimera/.
const SKILL_ASSET = /^(references|templates)\/[\w.-]+(\/[\w.-]+)*\.md$/;
const KIT_FILE = /^\.quimera\/((templates|adapters|scripts)\/[\w.-]+(\/[\w.-]+)*|QUIMERA\.md)$/;

const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((name) => {
        const p = join(dir, name);
        return statSync(p).isDirectory() ? walk(p) : [p];
      })
    : [];

// Lines with their number and whether they sit in a "## Provenance" section, where upstream names
// and upstream paths are credits, not references.
function annotate(text) {
  let provenance = false;
  return text.split(/\r?\n/).map((line, i) => {
    if (/^## /.test(line)) provenance = line.trim() === '## Provenance';
    return { text: line, line: i + 1, provenance };
  });
}

export function checkContent(root) {
  const out = [];
  const rel = (p) => relative(root, p).split(sep).join('/');
  const report = (level, file, line, rule, message) => out.push({ level, file: rel(file), line, rule, message });
  const error = (...a) => report('error', ...a);
  const advice = (...a) => report('advice', ...a);

  const skillsDir = join(root, 'skills');
  const skillFiles = existsSync(skillsDir)
    ? readdirSync(skillsDir)
        .map((name) => join(skillsDir, name, 'SKILL.md'))
        .filter((p) => existsSync(p))
    : [];
  const notice = existsSync(join(root, 'NOTICE.md')) ? readFileSync(join(root, 'NOTICE.md'), 'utf8').toLowerCase() : '';

  for (const file of skillFiles) {
    const folder = dirname(file).split(sep).pop();
    const text = readFileSync(file, 'utf8');
    const lines = annotate(text);

    // ---------- frontmatter: exactly name and description ----------
    const end = lines[0]?.text === '---' ? lines.findIndex((l, i) => i > 0 && l.text === '---') : -1;
    if (end < 0) {
      error(file, 1, 'frontmatter', 'no frontmatter between "---" lines at the top');
    } else {
      const fields = {};
      for (const l of lines.slice(1, end)) {
        const m = l.text.match(/^([A-Za-z][\w-]*):(?: (.*))?$/);
        if (!m) error(file, l.line, 'frontmatter', 'not a "key: value" line');
        else if (m[1] in fields) error(file, l.line, 'frontmatter-keys', `duplicate key "${m[1]}"`);
        else fields[m[1]] = { value: m[2] ?? '', line: l.line };
      }
      const keys = Object.keys(fields);
      for (const k of keys.filter((k) => !['name', 'description'].includes(k))) {
        error(file, fields[k].line, 'frontmatter-keys', `only "name" and "description" are allowed, found "${k}"`);
      }
      for (const k of ['name', 'description'].filter((k) => !keys.includes(k))) {
        error(file, 1, 'frontmatter-keys', `missing "${k}"`);
      }
      if (fields.name) {
        const { value, line } = fields.name;
        if (!NAME.test(value) || value.length > 64) error(file, line, 'name-format', 'name must be lowercase letters, digits and single hyphens, at most 64 characters');
        else if (value !== folder) error(file, line, 'name-folder', `name "${value}" does not match its folder "${folder}"`);
      }
      if (fields.description) {
        const { value, line } = fields.description;
        // A double-quoted JSON string is also a valid YAML double-quoted scalar, so this check is
        // exact without a YAML parser.
        let parsed = null;
        if (value.startsWith('"')) {
          try {
            parsed = JSON.parse(value);
          } catch {}
        }
        if (typeof parsed !== 'string') error(file, line, 'description-quoted', 'description must be one double-quoted string with JSON escapes');
        else if (!parsed.trim() || parsed.length > DESCRIPTION_MAX) error(file, line, 'description-length', `description must have 1 to ${DESCRIPTION_MAX} characters`);
      }
    }

    // ---------- Provenance ends the skill ----------
    const headings = lines.filter((l) => /^## /.test(l.text));
    const last = headings.at(-1);
    if (!last || last.text.trim() !== '## Provenance') {
      error(file, last?.line ?? 1, 'provenance-last', 'the last section must be "## Provenance"');
    } else if (!lines.slice(last.line).some((l) => l.text.trim())) {
      error(file, last.line, 'provenance-last', 'the Provenance section is empty');
    }

    // ---------- references point to files that exist ----------
    for (const l of lines.filter((l) => !l.provenance)) {
      for (const [, span] of l.text.matchAll(/`([^`]+)`/g)) {
        for (const token of span.split(/\s+/)) {
          if (SKILL_ASSET.test(token) && !existsSync(join(dirname(file), token))) {
            error(file, l.line, 'reference-exists', `${token} does not exist in skills/${folder}/`);
          }
        }
      }
    }

    // ---------- credits: every upstream repository in Provenance is listed in NOTICE.md ----------
    for (const l of lines.filter((l) => l.provenance)) {
      for (const [, repo] of l.text.matchAll(/github\.com\/([\w.-]+\/[\w-]+(?:\.[\w-]+)*)/g)) {
        if (!notice.includes(repo.toLowerCase())) error(file, l.line, 'notice-credit', `${repo} is credited here but not listed in NOTICE.md`);
      }
    }

    // ---------- size: skills are loaded into the agent's context ----------
    const size = Buffer.byteLength(text);
    if (size > SIZE_LIMIT) error(file, 1, 'skill-size', `${size} bytes; the limit is ${SIZE_LIMIT}`);
    else if (size > SIZE_ADVICE) advice(file, 1, 'skill-size', `${size} bytes; consider moving detail to references/ (advice above ${SIZE_ADVICE})`);
  }

  // ---------- rules for every Markdown file an agent reads ----------
  const agentFiles = [
    ...walk(skillsDir),
    ...walk(join(root, 'adapters')),
    ...walk(join(root, 'templates')),
    join(root, 'QUIMERA.md'),
  ].filter((p) => p.endsWith('.md') && existsSync(p));
  for (const file of agentFiles) {
    for (const l of annotate(readFileSync(file, 'utf8')).filter((l) => !l.provenance)) {
      if (TRADEMARK.test(l.text)) error(file, l.line, 'trademark', 'upstream trademark outside a Provenance section');
      // Text inside {{…}} is an example about a named person, not about the user.
      if (PRONOUN.test(l.text.replace(/\{\{.*?\}\}/g, ''))) error(file, l.line, 'user-pronoun', 'gendered pronoun: refer to the user as "the user" or "they"');
      for (const [, span] of l.text.matchAll(/`([^`]+)`/g)) {
        for (const token of span.split(/\s+/)) {
          if (KIT_FILE.test(token) && !existsSync(join(root, token.slice('.quimera/'.length)))) {
            error(file, l.line, 'reference-exists', `${token} is not shipped by the kit`);
          }
        }
      }
    }
  }

  return out.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '..'));
  const found = checkContent(root);
  for (const d of found) console.log(`${d.file}:${d.line}: ${d.level} ${d.rule}: ${d.message}`);
  const errors = found.filter((d) => d.level === 'error').length;
  console.log(`content check: ${errors} error(s), ${found.length - errors} advice`);
  process.exit(errors ? 1 : 0);
}

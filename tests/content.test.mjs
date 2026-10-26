// Content rules for the kit: skills load in every tool and keep the kit's own rules.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { checkContent } from '../dev/check-content.mjs';
import { KIT } from './helpers/repository.mjs';

const GOOD_SKILL = [
  '---',
  'name: sample',
  'description: "Use when testing: a description with a colon, which plain YAML would reject."',
  '---',
  '',
  '# Sample',
  '',
  'Read `references/guide.md` first.',
  '',
  '## Provenance',
  '',
  'Adapted from github.com/obra/superpowers (MIT).',
  '',
].join('\n');

// A minimal kit in a temporary folder: { 'skills/sample/SKILL.md': text, … }.
function makeKit(t, files) {
  const root = mkdtempSync(join(tmpdir(), 'quimera-content-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const all = { 'NOTICE.md': '[obra/superpowers](https://github.com/obra/superpowers)\n', 'skills/sample/references/guide.md': '# Guide\n', ...files };
  for (const [rel, text] of Object.entries(all)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  }
  return root;
}

const rules = (root, level = 'error') =>
  checkContent(root)
    .filter((d) => d.level === level)
    .map((d) => `${d.rule}@${d.line}`);

test('the kit passes its own content checks', () => {
  const errors = checkContent(KIT).filter((d) => d.level === 'error');
  assert.deepEqual(errors, []);
});

test('a valid skill has no findings', (t) => {
  assert.deepEqual(checkContent(makeKit(t, { 'skills/sample/SKILL.md': GOOD_SKILL })), []);
});

test('an unquoted description is rejected, as YAML parsers reject one with a colon', (t) => {
  const text = GOOD_SKILL.replace(/^description: "(.*)"$/m, 'description: $1');
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': text })), ['description-quoted@3']);
});

test('frontmatter holds exactly name and description', (t) => {
  const extra = GOOD_SKILL.replace('name: sample\n', 'name: sample\nlicense: MIT\n');
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': extra })), ['frontmatter-keys@3']);
  const missing = GOOD_SKILL.replace('name: sample\n', '');
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': missing })), ['frontmatter-keys@1']);
});

test('the name matches the folder', (t) => {
  const root = makeKit(t, { 'skills/other/SKILL.md': GOOD_SKILL, 'skills/other/references/guide.md': '' });
  assert.deepEqual(rules(root), ['name-folder@2']);
});

test('Provenance is the last section', (t) => {
  const after = `${GOOD_SKILL}\n## Notes\n\nMore.\n`;
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': after })), ['provenance-last@14']);
  const none = GOOD_SKILL.replace(/## Provenance[\s\S]*/, '');
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': none })), ['provenance-last@1']);
});

test('a missing reference is an error, an upstream path in Provenance is not', (t) => {
  const text = GOOD_SKILL.replace('references/guide.md', 'references/missing.md').replace('(MIT).', '(MIT), `references/upstream-only.md`.');
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': text })), ['reference-exists@8']);
  const kitPath = GOOD_SKILL.replace('Read `references/guide.md` first.', 'Run `node .quimera/scripts/missing.mjs` first.');
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': kitPath })), ['reference-exists@8']);
});

test('upstream trademarks appear only in Provenance', (t) => {
  const outside = GOOD_SKILL.replace('# Sample', '# Sample in the BMAD style');
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': outside })), ['trademark@6']);
  const credit = GOOD_SKILL.replace('(MIT).', '(MIT), with ideas from BMAD-METHOD.');
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': credit })), []);
});

test('the user is never "he" or "she"; named examples in placeholders are fine', (t) => {
  const gendered = GOOD_SKILL.replace('first.', 'first, unless the user says he read it.');
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': gendered })), ['user-pronoun@8']);
  const persona = GOOD_SKILL.replace('first.', 'first. {{e.g. "Ana checks orders on her phone"}}');
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': persona })), []);
});

test('every upstream repository credited in Provenance is listed in NOTICE.md', (t) => {
  const text = GOOD_SKILL.replace('obra/superpowers', 'someone/unlisted');
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': text })), ['notice-credit@12']);
});

test('large skills get advice, oversized skills fail', (t) => {
  const pad = (bytes) => GOOD_SKILL.replace('# Sample', `# Sample\n\n${'x'.repeat(bytes)}`);
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': pad(13 * 1024) }), 'advice'), ['skill-size@1']);
  assert.deepEqual(rules(makeKit(t, { 'skills/sample/SKILL.md': pad(21 * 1024) })), ['skill-size@1']);
});

test('every skill frontmatter parses with PyYAML, when it is available', (t) => {
  const probe = spawnSync('python3', ['-I', '-c', 'import yaml'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    t.skip('python3 with PyYAML is not available: cross-check not run');
    return;
  }
  const script = 'import sys, yaml\nd = yaml.safe_load(sys.stdin.read())\nassert sorted(d) == ["description", "name"], d\n';
  for (const name of readdirSync(join(KIT, 'skills'))) {
    const head = readFileSync(join(KIT, 'skills', name, 'SKILL.md'), 'utf8').split('\n---\n')[0].replace(/^---\n/, '');
    const r = spawnSync('python3', ['-I', '-c', script], { input: head, encoding: 'utf8' });
    assert.equal(r.status, 0, `${name}: ${r.stderr}`);
  }
});

const GOOD_SCENARIO = [
  '# Sample scenario',
  '',
  '**Seen in:** a pilot project, rewritten.',
  '**Setup:** a fresh repository.',
  '**Expected:** one next action.',
  '**Evidence:** what to look for.',
  '**Rules:** `skills/sample/SKILL.md`',
  '**Never:** what must not happen.',
  '',
].join('\n');

test('evaluation scenarios carry every field and point to rules that exist', (t) => {
  const kit = makeKit(t, { 'skills/sample/SKILL.md': GOOD_SKILL, 'evals/scenarios/01-sample.md': GOOD_SCENARIO });
  assert.deepEqual(rules(kit), []);
  const missing = makeKit(t, { 'skills/sample/SKILL.md': GOOD_SKILL, 'evals/scenarios/01-sample.md': GOOD_SCENARIO.replace('**Never:** what must not happen.\n', '') });
  assert.deepEqual(rules(missing), ['scenario-fields@1']);
  const dangling = makeKit(t, { 'skills/sample/SKILL.md': GOOD_SKILL, 'evals/scenarios/01-sample.md': GOOD_SCENARIO.replace('skills/sample/SKILL.md', 'skills/gone/SKILL.md') });
  assert.deepEqual(rules(dangling), ['reference-exists@7']);
});

test('the kit ships at least twelve evaluation scenarios', () => {
  const names = readdirSync(join(KIT, 'evals', 'scenarios')).filter((f) => f.endsWith('.md'));
  assert.ok(names.length >= 12, `${names.length} scenarios`);
});

// Adapters say what they rest on: a status (tested only with a recorded run), the date they were
// checked and primary sources. The README cannot claim more than docs/compatibility.md records.

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { KIT } from './helpers/repository.mjs';

const read = (p) => readFileSync(join(KIT, p), 'utf8');
const adapters = readdirSync(join(KIT, 'adapters')).filter((f) => f !== 'models.md');
const field = (text, name) => text.match(new RegExp(`^\\*\\*${name}:\\*\\* (.+)$`, 'm'))?.[1];

test('every adapter states its status, the date it was checked and its sources', () => {
  for (const name of adapters) {
    const text = read(`adapters/${name}`);
    assert.match(field(text, 'Status') ?? '', /^(tested|experimental)\b/, `${name}: status`);
    assert.match(field(text, 'Checked') ?? '', /^\d{4}-\d{2}-\d{2}\b/, `${name}: checked date`);
    assert.match(field(text, 'Sources') ?? '', /https:\/\//, `${name}: sources`);
  }
});

test('a tool is "tested" only when docs/compatibility.md records a dated run', () => {
  const runs = read('docs/compatibility.md');
  for (const name of adapters) {
    const status = field(read(`adapters/${name}`), 'Status');
    if (!status.startsWith('tested')) continue;
    const tool = read(`adapters/${name}`).match(/^# (.+?) adapter/m)[1];
    const row = runs.split('\n').find((l) => l.startsWith(`| ${tool} |`) && /\| tested \|/.test(l));
    assert.ok(row, `${tool} is marked tested without a run in docs/compatibility.md`);
    assert.match(row, /\d{4}-\d{2}-\d{2}/);
  }
  assert.match(runs, /\| Claude Code \|.*\| tested \|/);
});

test('Gemini CLI and OpenCode are named, and no tool is said to lack a skills folder', () => {
  const other = read('adapters/other-tools.md');
  assert.match(other, /\| Gemini CLI \|.*experimental/);
  assert.match(other, /\| OpenCode \|.*experimental/);
  assert.doesNotMatch(other, /\| none: the agent reads/);
});

test('a missing model never becomes a costlier one silently', () => {
  assert.match(read('adapters/models.md'), /never move to a costlier model without the user's ok/i);
});

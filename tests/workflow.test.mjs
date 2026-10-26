// The working loop must reach every session: it lives in AGENTS.md (loaded by every tool), its
// triggers are in the skill descriptions, and its limits match what the scripts check.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { MAX_BYTES, MAX_LINES } from '../scripts/lib/memory.mjs';
import { KIT } from './helpers/repository.mjs';

const read = (p) => readFileSync(join(KIT, p), 'utf8');
const description = (name) => JSON.parse(read(`skills/${name}/SKILL.md`).match(/^description: (.*)$/m)[1]);
const section = (text, heading) => text.split(`## ${heading}\n`)[1]?.split(/\n## /)[0] ?? '';

test('the AGENTS.md template carries a short working loop, the one file every tool loads', () => {
  const agents = read('templates/AGENTS.md');
  const loop = section(agents, 'Working loop');
  const items = loop.split('\n').filter((l) => /^\d+\.|^- /.test(l));
  assert.ok(items.length > 0 && items.length <= 10, `${items.length} items`);
  for (const must of [/depth/i, /branch/i, /verif/i, /STATE\.md/, /compact/i, /MAP\.md/, /code-review/, /close-task/, /phase/i]) {
    assert.match(loop, must);
  }
  assert.doesNotMatch(agents, /^## Process$/m);
});

test('skill descriptions trigger on what happens in a long session', () => {
  assert.match(description('task-start'), /before any change/i);
  assert.match(description('code-review'), /end of each phase/i);
  assert.match(description('code-review'), /before any delivery/i);
  assert.match(description('close-task'), /end of every task/i);
});

test('QUIMERA.md counts owner rejections and holds costly actions', () => {
  const quimera = read('QUIMERA.md');
  assert.match(section(quimera, 'Verification'), /rejects? a delivery[^.]*counts as a failed attempt/i);
  assert.match(quimera, /study-round/);
  assert.match(quimera, /## Costly actions/);
});

test('the STATE.md template states the limits the scripts check', () => {
  const state = read('templates/docs/STATE.md');
  assert.match(state, new RegExp(`${MAX_LINES} lines`));
  assert.match(state, new RegExp(`${MAX_BYTES / 1024} KB`));
  assert.match(state, /rewrite it whole/i);
});

test('the workflow contract gives each scenario exactly one next action', () => {
  const rows = read('docs/workflow-contract.md')
    .split('\n')
    .filter((l) => /^\| [^-]/.test(l))
    .slice(1)
    .map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  assert.ok(rows.length >= 3);
  for (const [scenario, action] of rows) assert.ok(scenario && action, `empty cell in ${scenario}`);
  for (const must of [/long session/i, /compact/i, /third rejection/i]) {
    assert.ok(rows.some(([s]) => must.test(s)), `no row for ${must}`);
  }
});

test('the opt-in compaction reminder is valid JSON and only prints text', () => {
  const adapter = read('adapters/claude-code.md');
  const json = JSON.parse(section(adapter, 'Reminder after compaction (opt-in)').match(/```json\n([\s\S]*?)```/)[1]);
  const [entry] = json.hooks.SessionStart;
  assert.equal(entry.matcher, 'compact');
  assert.match(entry.hooks[0].command, /^echo /);
  assert.match(read('AGENTS.md'), /compaction reminder/);
});

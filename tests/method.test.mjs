// One method: a single failure policy, honest self-review labels, approvals not asked twice,
// memory where the project keeps it, and tiers that route the work in every tool.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { IDENTITY, KIT, createRepo } from './helpers/repository.mjs';

const read = (p) => readFileSync(join(KIT, p), 'utf8');
const section = (text, heading) => text.split(`## ${heading}`)[1]?.split(/\n## /)[0] ?? '';

test('parallel-agents never parks a blocking finding after the third round', () => {
  const skill = read('skills/parallel-agents/SKILL.md');
  const loop = skill.match(/6\. \*\*Fix loop\*\*[\s\S]*?\n7\. /)[0];
  assert.match(loop, /Critical or Important[^.]*blocks/);
  assert.match(loop, /bring it to the user/);
  assert.match(loop, /Only Minor findings are parked/);
  assert.match(section(skill, 'Without subagents'), /self-review \(not independent\)/);
});

test('approval given for a scope is not asked again; irreversible steps still are', () => {
  const quimera = read('QUIMERA.md');
  assert.match(quimera, /already authorized for this scope[^.]*not ask again/i);
  assert.match(read('skills/task-start/SKILL.md'), /unless the user already confirmed this scope/);
});

test('the session that writes code runs on the standard tier, in every tool', () => {
  assert.match(section(read('QUIMERA.md'), 'Roles, model tiers and effort'), /session that writes code runs on the standard tier/i);
  for (const name of readdirSync(join(KIT, 'adapters')).filter((f) => f !== 'models.md')) {
    assert.match(read(`adapters/${name}`), /### Session model/, name);
  }
  assert.match(read('skills/project-kickoff/SKILL.md'), /which model to start sessions on/i);
});

test('the profile can point memory to the project\'s own files, and the checks follow it', (t) => {
  for (const f of ['templates/AGENTS.md', 'templates/PROFILE.md']) assert.match(read(f), /\*\*Memory:\*\*/, f);
  assert.match(read('QUIMERA.md'), /"Memory" line/);

  const repo = createRepo(t);
  repo.write('AGENTS.md', `# Fixture\n\n- **Mode:** open\n- **Git identity:** ${IDENTITY.name} <${IDENTITY.email}>\n- **Memory:** state \`memory/CURRENT.md\` · map \`docs/MAP.md\` · decisions \`docs/DECISIONS.md\`\n`);
  repo.write('memory/CURRENT.md', '# Current\n\n**Updated:** 2020-01-01\n');
  repo.git('add', '-A');
  repo.git('commit', '--quiet', '-m', 'docs: add memory');
  const r = spawnSync(process.execPath, [join(KIT, 'scripts', 'git-preflight.mjs')], { cwd: repo.root, env: repo.env, encoding: 'utf8' });
  assert.match(r.stdout, /memory\/CURRENT\.md says "Updated: 2020-01-01"/);
});

test('the workflow contract covers the method scenarios', () => {
  const contract = read('docs/workflow-contract.md');
  for (const must of [/read-only review/i, /typo/i, /permission check/i, /third failed attempt/i, /no independent reviewer/i, /branch for this same task/i, /cannot be edited/i, /own memory files/i]) {
    assert.match(contract, must);
  }
});

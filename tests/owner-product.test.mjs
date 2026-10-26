// Kickoff and the project-start reviews fit the owner and the kind of product: both pilot owners
// were not technical, and one product was a game the SaaS-shaped questions did not fit.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { KIT } from './helpers/repository.mjs';

const read = (p) => readFileSync(join(KIT, p), 'utf8');
const productTypes = () =>
  read('templates/AGENTS.md')
    .match(/\*\*Product type:\*\* \{\{(.*?)\}\}/)[1]
    .split('|')
    .map((s) => s.trim());

test('kickoff asks who the owner is before anything technical', () => {
  const questions = read('skills/project-kickoff/references/questions.md');
  const first = questions.split(/\n\*\*\(b\)/)[0];
  assert.match(first, /\*\*\(a\)[^\n]*technical/i);
  assert.match(first, /decide/i);
  assert.match(questions, /\*\*\(b\)[^\n]*(coaching|concise)/i);
  assert.match(questions, /plain words/i);
  for (const type of productTypes()) assert.ok(questions.includes(type), `kickoff does not offer "${type}"`);
});

test('the profile records the owner and the product type, with room for what is learned', () => {
  for (const file of ['templates/AGENTS.md', 'templates/PROFILE.md']) {
    const text = read(file);
    assert.match(text, /\*\*Owner:\*\*/, file);
    assert.match(text, /\*\*Product type:\*\*/, file);
  }
  assert.match(read('templates/AGENTS.md'), /^## Working with the owner$/m);
});

test('every product type has its own vision-review category set', () => {
  const headings = read('skills/vision-review/references/categories.md')
    .split('\n')
    .filter((l) => l.startsWith('## '))
    .join('\n')
    .toLowerCase();
  for (const type of productTypes().filter((t) => t !== 'other')) assert.ok(headings.includes(type.toLowerCase()), `no category set for "${type}"`);
  assert.match(read('skills/vision-review/SKILL.md'), /Product type/);
  assert.doesNotMatch(read('skills/vision-review/SKILL.md'), /The user is learning/);
});

test('design directions start from the owner\'s references and real assets', () => {
  const skill = read('skills/design-directions/SKILL.md');
  assert.match(skill, /placeholder/i);
  assert.match(skill, /owner's own references/i);
  assert.match(skill, /real stack/i);
  assert.doesNotMatch(skill, /The user loves motion/);
});

test('QUIMERA.md follows the profile instead of assuming one kind of owner', () => {
  const quimera = read('QUIMERA.md');
  assert.doesNotMatch(quimera, /growing as an engineer/);
  assert.doesNotMatch(quimera, /the user prefers interactive HTML/);
  assert.match(quimera, /^## Other skills and plugins$/m);
});

test('the workflow contract covers the owner and product cases', () => {
  const contract = read('docs/workflow-contract.md');
  for (const must of [/non-technical owner/i, /\| A game/i, /another workflow/i]) assert.match(contract, must);
});

test('kickoff stays short enough to load whole', () => {
  assert.ok(Buffer.byteLength(read('skills/project-kickoff/SKILL.md')) < 12 * 1024);
});

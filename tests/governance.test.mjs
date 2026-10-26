// The kit's own maintenance: validation runs only by hand, and the release steps are written down.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { KIT } from './helpers/repository.mjs';

const read = (p) => readFileSync(join(KIT, p), 'utf8');

test('the validation workflow runs only when dispatched by hand', () => {
  const wf = read('.github/workflows/validate.yml');
  const on = wf.split(/^on:\n/m)[1].split(/^\S/m)[0];
  assert.deepEqual(on.trim().split('\n').map((l) => l.trim()), ['workflow_dispatch:']);
  assert.match(wf, /node: \[20, 24\]/);
  assert.match(wf, /run: npm test/);
  assert.match(wf, /run: npm run check/);
  assert.match(wf, /contents: read/);
});

test('security reporting, contribution rules and the release checklist exist', () => {
  assert.match(read('SECURITY.md'), /Report a vulnerability/);
  assert.match(read('CONTRIBUTING.md'), /npm test/);
  const checklist = read('AGENTS.md').split('## Release checklist')[1];
  for (const must of [/npm test/, /security specialist/, /pilot projects migrated on copies/, /CHANGELOG\.md/, /Ask the user before each outward step/]) {
    assert.match(checklist, must);
  }
});

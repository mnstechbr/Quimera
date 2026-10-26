// The git flow the skills prescribe, run step by step in a fresh repository with no remote: the
// default branch exists from the first commit, every task branch starts from it and returns to it,
// and the preflight ends clean. The skills must keep naming the commands this walkthrough uses.

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { IDENTITY, KIT, createRepo } from './helpers/repository.mjs';

const skill = (name) => readFileSync(join(KIT, 'skills', name, 'SKILL.md'), 'utf8');
const preflight = (repo) => spawnSync(process.execPath, [join(KIT, 'scripts', 'git-preflight.mjs')], { cwd: repo.root, env: repo.env, encoding: 'utf8' });

test('the skills name the commands of the local flow', () => {
  const kickoff = skill('project-kickoff');
  assert.match(kickoff, /git symbolic-ref HEAD refs\/heads\/<default>/);
  assert.match(kickoff, /git commit --allow-empty -m "chore: start project"/);
  assert.match(skill('task-start'), /git switch -c <name> <default>/);
  const close = skill('close-task');
  assert.match(close, /## 6\. Integrate locally/);
  assert.match(close, /git merge --ff-only <branch>/);
  assert.match(close, /git branch -d <branch>/);
});

test('kickoff, two tasks and local integration leave one default branch and a clean preflight', (t) => {
  // A folder where git init chose another name for the first branch.
  const repo = createRepo(t, { branch: 'master', commit: false });
  const profile = `# Fixture\n\n## Project profile\n\n- **Mode:** open\n- **Git identity:** ${IDENTITY.name} <${IDENTITY.email}>\n- **Quimera files:** committed\n`;
  const state = (now) => `# State\n\n**Updated:** ${new Date().toISOString().slice(0, 10)}\n\n## Now\n\n- ${now}\n\n## Branch\n\n- main · nothing to push\n`;

  // project-kickoff: name the default branch, then make the first commit on it.
  repo.git('symbolic-ref', 'HEAD', 'refs/heads/main');
  repo.write('AGENTS.md', profile);
  repo.write('docs/STATE.md', state('Kickoff done.'));
  repo.git('add', 'AGENTS.md', 'docs/STATE.md');
  repo.git('commit', '--quiet', '-m', 'chore: start project');

  for (const [branch, file] of [['feat/a', 'a.txt'], ['feat/b', 'b.txt']]) {
    // task-start: a new branch from the default branch.
    repo.git('switch', '--quiet', '-c', branch, 'main');
    // the task, then close-task: memory in the same commit as the work.
    repo.write(file, `${file}\n`);
    repo.write('docs/STATE.md', state(`${file} added.`));
    repo.git('add', file, 'docs/STATE.md');
    repo.git('commit', '--quiet', '-m', `feat: add ${file}`);
    // close-task, "Integrate locally".
    repo.git('switch', '--quiet', 'main');
    repo.git('merge', '--quiet', '--ff-only', branch);
    repo.git('branch', '-d', branch);
  }

  assert.equal(repo.git('branch', '--format=%(refname:short)'), 'main');
  assert.deepEqual(repo.git('log', '--format=%s').split('\n'), ['feat: add b.txt', 'feat: add a.txt', 'chore: start project']);
  const r = preflight(repo);
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /Result: ready/);
});

test('a local-only kickoff with nothing to commit still creates the default branch', (t) => {
  const repo = createRepo(t, { commit: false });
  repo.git('commit', '--quiet', '--allow-empty', '-m', 'chore: start project');
  assert.equal(repo.git('rev-parse', '--abbrev-ref', 'HEAD'), 'main');
  assert.doesNotMatch(preflight(repo).stdout, /no commits yet|no default branch/);
});

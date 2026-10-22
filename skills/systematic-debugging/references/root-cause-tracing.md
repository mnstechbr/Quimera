# Root cause tracing

Bugs often show up deep in the call stack: a command runs in the wrong directory, a file lands in the wrong place, a database opens with the wrong path. The instinct is to fix the line where the error appears. That treats the symptom.

**Principle:** trace backward through the call chain until you find the original trigger, then fix it there.

## When to use

- The error happens deep in execution, not at an entry point.
- The stack trace shows a long chain of calls.
- It is unclear where the invalid data came from.
- Something appears during the test run and you do not know which test causes it.

If you can trace back, trace to the original trigger and fix there, then consider defense in depth (`defense-in-depth.md`). If you hit a dead end (code you do not control, no way to go further up), fix at the deepest point you can reach and say so.

## The process

1. **Observe the symptom.**
   `Error: git init failed in ~/project/packages/core`
2. **Find the immediate cause.** What code directly does this?
   `await execFileAsync('git', ['init'], { cwd: projectDir });`
3. **Ask what called it.**
   `WorktreeManager.createSessionWorktree(projectDir)` ← `Session.initializeWorkspace()` ← `Session.create()` ← a test calling `Project.create()`
4. **Keep tracing up. What value was passed?**
   `projectDir = ''`. An empty `cwd` resolves to the current process directory, which is the source tree.
5. **Find the original trigger.** Where did the empty string come from?
   A test read `context.tempDir` at module load, before the setup hook that fills it ran.

Fix at step 5 (make `tempDir` throw if read before setup), not at step 2.

## Adding stack traces when you cannot trace by reading

Log just before the suspicious operation, not after it fails:

```typescript
async function gitInit(directory: string) {
  console.error('DEBUG git init:', {
    directory,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    stack: new Error().stack,
  });
  await execFileAsync('git', ['init'], { cwd: directory });
}
```

- In tests, write to stderr directly; the project logger may be silenced.
- Include context: directory, cwd, relevant environment variables (whether set, never the secret value), timestamps.
- Run the tests, filter the output for your marker, and look for test file names, line numbers and repeated parameters.
- Remove the instrumentation before committing.

## Finding which test pollutes shared state

When an unwanted file, directory, database row or global state appears during a test run and you do not know which test creates it, bisect:

1. Clean the pollution and confirm it is gone.
2. List the test files in a stable order.
3. Run the first half on its own. Check whether the pollution appeared.
4. If it did, the polluter is in that half; otherwise it is in the other half (or it needs tests from both halves together, in which case run them in order and narrow from the end).
5. Clean again and repeat on the guilty half until one file remains. Then do the same with the tests inside that file.

Run each step in the foreground and read the result. For a few dozen files, running them one by one and checking after each is also fine. Do not write a script that deletes things between runs unless the user agrees: a wrong path in a cleanup loop destroys real files.

## Key principle

Found the immediate cause → can you go one level up? Yes → trace up and ask "is this the source?" again. When you reach the source, fix it there and add validation at the layers in between. Fixing only where the error appears leaves the trigger in place for the next caller.

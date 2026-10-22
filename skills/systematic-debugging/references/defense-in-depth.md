# Defense in depth

After you fix a bug caused by invalid data, one validation feels like enough. But a single check can be bypassed by another code path, a refactor or a mock.

**Principle:** validate at each layer the data passes through, so the bug becomes structurally impossible, not just fixed once.

Use this after the root cause is found and fixed, not instead of finding it. Keep it proportional: add layers where a wrong value causes real damage (files written in the wrong place, data crossing tenants, money, deletions).

## The four layers

### 1. Entry point validation

Reject obviously invalid input at the boundary (API handler, public function, CLI argument).

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory cannot be empty');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory does not exist: ${workingDirectory}`);
  }
  // ...
}
```

### 2. Business logic validation

Check that the data makes sense for this specific operation.

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error('projectDir required for workspace initialization');
  }
  // ...
}
```

### 3. Environment guards

Refuse dangerous operations in contexts where they should never happen.

```typescript
async function gitInit(directory: string) {
  if (process.env.NODE_ENV === 'test') {
    const target = normalize(resolve(directory));
    const tmp = normalize(resolve(tmpdir()));
    if (!target.startsWith(tmp)) {
      throw new Error(`Refusing git init outside temp dir during tests: ${directory}`);
    }
  }
  // ...
}
```

### 4. Debug instrumentation

Capture context for the next investigation (without secret values).

```typescript
logger.debug('About to git init', { directory, cwd: process.cwd(), stack: new Error().stack });
```

## Applying it

1. Trace the data flow: where the bad value starts and where it is used.
2. List every checkpoint it passes through.
3. Add a check at each layer that is worth it.
4. Test each layer: try to bypass layer 1 and confirm layer 2 catches it. Each check you add needs a test that fails without it.

## Why more than one layer

In the original case (an empty `projectDir` causing `git init` in the source tree), every layer caught something the others missed: different code paths skipped the entry check, mocks skipped the business check, platform differences needed the environment guard, and the debug log exposed structural misuse.

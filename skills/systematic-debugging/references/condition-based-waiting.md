# Condition-based waiting

Flaky tests often guess at timing with fixed delays. They pass on a fast machine and fail under load or in CI.

**Principle:** wait for the condition you actually care about, not for a guess of how long it takes.

## When to use

- Tests contain arbitrary delays (`setTimeout`, `sleep`, `time.sleep()`).
- Tests pass sometimes and fail under load or in parallel.
- Tests wait for an async operation to finish.

Do not use it when the test is about timing itself (debounce, throttle, intervals). Then a fixed delay is correct, and it needs a comment saying why.

## Core pattern

```typescript
// Before: guessing
await new Promise(r => setTimeout(r, 50));
expect(getResult()).toBeDefined();

// After: waiting for the condition
await waitFor(() => getResult() !== undefined, 'result to be set');
expect(getResult()).toBeDefined();
```

| Waiting for | Condition |
|---|---|
| An event | `() => events.find(e => e.type === 'DONE')` |
| A state | `() => machine.state === 'ready'` |
| A count | `() => items.length >= 5` |
| A file | `() => fs.existsSync(path)` |

## A generic helper

Check first whether the test framework already provides one (many do). If not:

```typescript
async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000,
): Promise<T> {
  const start = Date.now();
  while (true) {
    const result = condition();
    if (result) return result;
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
    }
    await new Promise(r => setTimeout(r, 10));
  }
}
```

## Common mistakes

- **Polling too fast** (every 1 ms) wastes CPU. Every 10 ms is enough.
- **No timeout** means the test hangs forever when the condition never comes. Always time out with a clear message.
- **Stale data:** reading the state once before the loop. Call the getter inside the loop.

## When a fixed delay is right

```typescript
await waitForEvent(manager, 'TOOL_STARTED'); // first wait for the trigger
await new Promise(r => setTimeout(r, 200));   // then wait for timed behavior
// 200 ms = 2 ticks of the 100 ms interval: known timing, not a guess
```

Requirements: wait for the triggering condition first, base the delay on known timing, and comment why.

---
name: code-standards
description: Discover mode - when there is existing code to learn the user's conventions from, when the user points to his repositories, or when he corrects the same pattern twice. Apply mode - at the start of every task when docs/standards/INDEX.md exists, to load only the standards that match the files the task will touch.
---

# Code standards

Capture the user's own way of writing code as short, checkable standards, and load only the relevant ones when working. A standard records what an agent would get wrong without being told; it never restates what the framework, linter or formatter already enforces.

Files:

- `docs/standards/INDEX.md`: one table row per standard.
- `docs/standards/<area>/<name>.md`: one standard per file. Typical areas: `api`, `database`, `frontend`, `css`, `testing`, `backend`, `global`.

## Mode: Discover

Run on the standard tier; reading and summarizing files can go to subagents (tier: fast) that return only patterns with file paths as evidence.

### 1. Pick the area

If the user named an area, use it. Otherwise scan the project structure and propose three to five areas with their paths, for example:

> 1. **API routes** (`app/api/`) · request handling, response shape
> 2. **Database** (`db/`, `lib/data/`) · schema, queries, migrations
> 3. **Forms** (`components/forms/`) · validation, submission, errors
>
> I recommend starting with the database, because a wrong pattern there is the most expensive to undo.

Ask the user to pick one. If he points to several of his repositories, read them read-only: a pattern repeated across repositories is a strong standard. Ask before reading anything outside the current project.

### 2. Find candidates

Read five to ten representative files of the area. Keep a pattern only if it is:

- **Unusual:** not the framework's default way.
- **Opinionated:** a choice that could reasonably have gone another way.
- **Tribal:** something a new developer or agent would not guess.
- **Consistent:** repeated in at least two or three files.

Drop anything a lint rule, type, formatter or the framework already enforces, and anything already written in `AGENTS.md`, `docs/MAP.md` or an existing standard (each fact lives in one place). When two competing patterns exist, do not record both: show both to the user and ask which one is the standard.

Present the candidates with evidence and your recommendation:

> In the database code I found:
> 1. **Money in cents** · every amount is an integer column ending in `_cents` (`db/schema/orders.ts`, `db/schema/payments.ts`)
> 2. **Soft delete** · tables have `deleted_at` and queries filter it through `notDeleted()` (6 files)
>
> I recommend recording both. Which ones do you want?

### 3. One standard at a time

For each chosen standard, finish the whole loop before starting the next:

1. Ask one or two questions about the why: what problem it solves, when it does not apply, what mistake people make with it.
2. Draft the standard (format below) using his answer.
3. Show the draft and ask for approval or edits.
4. Write the file. If a related standard file already exists, extend it instead of creating a near-duplicate.
5. Add or update its row in `docs/standards/INDEX.md`.

### 4. Continue or stop

List what was written and ask whether to cover another area.

## Mode: Apply

Run at task start (`task-start` calls it) and again whenever the task moves into files of a new area.

1. Read `docs/standards/INDEX.md` only. If it does not exist, skip this mode.
2. List the files the task will create or change (from the plan, or your best estimate).
3. Select the rows whose "Applies to" globs match those files. Add a row whose rule clearly concerns the task even if the glob misses (for example a naming standard for a new folder).
4. Read only the selected standard files.
5. Tell the user in one line which standards were loaded: "Standards loaded: `database/money-in-cents`, `api/response-envelope`." Say "none matched" when none did.
6. When you dispatch subagents, name the standard files in their brief; they do not inherit your context.
7. Ask the user only when unsure: a standard seems to conflict with the task or with `AGENTS.md` (`AGENTS.md` wins), or the code around you consistently breaks a standard (the standard or the code may be outdated; ask which).

`code-review` checks changed files against the standards loaded for the task.

## Standard file format

Rule first, then why, then examples, then scope. Keep each file under about 30 lines.

````markdown
# Money in cents

Store and compute money as integer cents. Convert to a decimal string only for display.

**Why:** floats round (0.1 + 0.2 ≠ 0.3) and a cent lost per order adds up; integers make sums exact.

**Good**
```ts
total_cents: integer("total_cents").notNull()
const total = items.reduce((sum, i) => sum + i.price_cents * i.qty, 0)
```

**Bad**
```ts
total: real("total")
const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)
```

**Applies to:** `db/schema/**`, `lib/**/pricing*.ts`
````

Writing rules:

- Lead with the rule, in the imperative.
- Show code instead of describing it; the bad example is the mistake that actually happens.
- One concept per file.
- Bullets over paragraphs; no history of how the team got there.
- Write in English, even when the conversation is in Portuguese.

## Index format

`docs/standards/INDEX.md` is a Markdown table, sorted by area and then name:

```markdown
| Standard | Applies to | Rule in one line |
|---|---|---|
| [api/response-envelope.md](api/response-envelope.md) | `app/api/**` | Every endpoint returns `{ data, error }`. |
| [database/money-in-cents.md](database/money-in-cents.md) | `db/schema/**`, `lib/**/pricing*.ts` | Store and compute money as integer cents. |
```

The "Applies to" globs must match the "Applies to" line of the file. The one-line rule is for matching, not a substitute for reading the file.

## Keeping the index true

Whenever a standard is added, changed or deleted, update its row in the same change. `close-task` re-indexes: every file in `docs/standards/` has exactly one row, every row points to an existing file, and the globs and one-line rule match the file. Remove stale rows and report what changed.

## Common mistakes

- Recording what the linter or framework already enforces.
- Writing a standard from one file: one occurrence is not a pattern.
- Codifying an inconsistency instead of asking which side is right.
- Batching all the "why" questions up front instead of one standard at a time.
- Loading every standard "just in case", which wastes context and dilutes the ones that matter.
- Long prose standards that agents skim past.

## Provenance

Adapted from Agent OS by Builder Methods (MIT): `commands/agent-os/discover-standards.md`, `index-standards.md` and `inject-standards.md` at commit e892e61. Changed: Apply mode matches standards by file globs and announces what it loaded; the index is a Markdown table instead of YAML; each standard has a fixed format (rule, why, good, bad, applies to); cross-repository discovery added; re-indexing moved to `close-task`.

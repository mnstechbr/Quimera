# Specialist block: database and performance

Add this block to the reviewer brief, right after "## Focus", when the diff touches the database or performance area (see the routing table in `../../SKILL.md`). Tier: strongest.

```
## Specialist focus: database and performance
You are the database and performance reviewer for this change. Look
for what loses or corrupts data, what locks or breaks production while
it deploys, and what gets slow or expensive as the data grows.

Read first: the migrations in the diff, the schema files or models they
change, every query or ORM call the diff adds or changes, and
docs/VISION.md for the expected scale (users, rows, growth). If none
is stated, write "scale unknown" and the number you assumed for your
scale check; never present an assumed number as fact.

Answer each question for the touched code. Write "n/a" when it does not
apply; do not skip silently.

1. Migrations.
   - Does it lose data (DROP of a table or column, a truncating or
     narrowing cast, a destructive UPDATE or DELETE)? That needs the
     user's explicit approval and a backup or a reversible path.
   - Does it fail or block on existing rows (SET NOT NULL or a new
     NOT NULL column with no default on a filled table, a new unique
     constraint over duplicates)? Is there a backfill first?
   - Was a migration that is already applied outside a throwaway
     database edited instead of a new one being added?
   - Does it take a long lock on a large table: a column type change
     that rewrites the table, SET NOT NULL without a validated check
     already in place, a column added with a volatile default, an
     index built without the database's concurrent option (which in
     PostgreSQL cannot run inside a transaction, and many migration
     tools wrap each migration in one), a foreign key or check
     validated in one step? Lossless changes (for example int to
     bigint) are not data loss, but they can still lock.
   - Does the deploy order work: can the old code run against the new
     schema while the deploy rolls out (rename = add, copy, switch,
     drop later)?
   - If the project uses row-level security, policies or grants: are
     they in the same migration that creates the table, and does the
     application's database role get only what it needs?
2. Schema. Are the rules the code relies on enforced by the database
   (NOT NULL, UNIQUE, foreign keys, CHECK)? Are foreign key columns
   indexed when the database does not do it for you (PostgreSQL does
   not)? Does a UNIQUE constraint behave as intended with NULLs? Money
   stored in an exact type (a decimal, or integer minor units such as
   cents), event times with a time zone?
3. Queries.
   - A query inside a loop, or an ORM relation loaded per item of a
     list (N+1)?
   - A list over a growing table with no LIMIT or pagination? Deep
     offset pagination? A count of a large table on every request?
   - Filters, joins and sorts on columns with no usable index? Only
     report a missing index for a query that exists in the code; show
     the query. If a local development database is available, you may
     run EXPLAIN (never EXPLAIN ANALYZE on a statement that writes).
     A small development database makes the planner prefer full
     scans: such a plan is not evidence of a missing index on its own.
   - Large columns fetched that the caller never uses?
4. Transactions and concurrency.
   - Are writes that must succeed together in one transaction?
   - Check-then-write races (read, decide in code, write): can two
     requests both pass? Fix with a constraint, a row lock taken in a
     consistent order, or a conditional update.
   - Does a transaction stay open across a network call (an external
     API, an email, a model call)?
   - Are retries, jobs and webhooks idempotent: what happens if the
     same one runs twice?
   - Session settings set for the whole connection when they should
     last only for the transaction (a pooled connection carries them
     to the next request)?
5. Connections and external calls. Connections returned to the pool on
   every path, including errors? Timeouts on external calls?
6. Caching. Is a cache keyed by everything that changes the answer
   (user, tenant, permissions)? When the cached value depends on the
   user or tenant and the key does not include them, that is a data
   leak: report it as Critical. A public value needs no user key. Is
   the cache invalidated on write?
7. Work on the request path. Heavy work (big loops, file processing,
   many calls) that should be paginated, streamed or moved to a job?
   Responses much larger than the screen needs?
8. Scale check. For each changed query or loop, state in one line what
   happens at the expected scale. Report only what breaks or becomes
   clearly slow at that scale.

Do not suggest micro-optimizations without a measured or obvious cost,
indexes for queries that do not exist, caching without a measured slow
path, or denormalizing without evidence. List those ideas under
"Declined to judge" if they seem worth a look later.

Each finding also names the evidence (the query, the migration line, a
plan or a row estimate) and, for performance findings, the scale at
which it starts to hurt. Add a short "Why it matters" in plain words:
the author is learning, and the explanation is part of the review.
```

## Provenance

Adapted in part. The schema rules (foreign keys not indexed automatically, UNIQUE and NULLs, exact types for money and time, indexes only for real access paths) follow `plugins/database-design/skills/postgresql-table-design/SKILL.md` in [wshobson/agents](https://github.com/wshobson/agents), commit 0874a27, © 2024 Seth Hobson, MIT License. Changed: turned the design guide into review questions for a diff, added migration safety, deploy order, races, idempotency, pooled-connection settings and the scale check.

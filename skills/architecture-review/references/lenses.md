# Review lenses

Walk every lens. Each question is here because its answer can change a decision; skip a question only when it clearly does not apply, and say so. Each lens ends as decided, deferred with a reason, or an open question.

## 1. Coherence

- Does the design serve the goals and the audience in `docs/VISION.md`? Name any part that serves neither.
- Does it respect every principle and non-negotiable rule in `AGENTS.md`?
- Does it agree with existing entries in `docs/DECISIONS.md`? A contradiction is raised, not overridden.
- Is there one named paradigm (layered, hexagonal, modular monolith, pipes and filters) with its layers mapped to real folders? Who may depend on whom?
- Does every requirement in the feature description have a place in the design, and every component a requirement behind it?

## 2. Data and database

- **Model:** what are the core entities and their relationships? Which entity owns each piece of shared data, and is there exactly one writer per entity?
- **Integrity:** which rules does the database enforce (foreign keys, unique, check, not null) and which only the code? Rules that protect money, identity or isolation belong in the database.
- **Queries:** list the real queries the feature runs. Add an index only for a query on that list; note expected row counts.
- **Scale path:** what breaks first at 10x and 100x the expected data or traffic (a full scan, an N+1, a lock, a growing table without retention)? Is there a cheap step that keeps that path open?
- **Migrations:** is every change a new migration? A migration already applied outside a disposable environment is never edited. Is there a plan for changing a column with data in it (expand, backfill, contract)?
- **Multi-tenancy:** how is isolation enforced: row-level security, a mandatory tenant filter in one data-access layer, or separate schemas? Can any code path query tenant data without going through it? Is there a negative test that proves one tenant cannot read another?
- **Money:** amounts stored as integer minor units or exact decimals, never floats; currency stored with the amount; every charge or transfer idempotent (idempotency key) and recorded in an append-only ledger or audit trail.
- **Retention and personal data:** what is kept, for how long, and how is it deleted on request?

## 3. Security

- **Authentication:** how does a request prove who it is? How are sessions created, expired and revoked?
- **Authorization on every entry point:** pages, API routes, server actions, webhooks, background jobs, admin tools, agent tools. Is the check in a single helper that every entry point calls, or repeated by hand? Is denial tested?
- **Input validation:** is every external input (body, params, headers, files, webhook payloads, model output) validated with a schema at the boundary? Are uploads checked by content, size and type?
- **Web risks:** CSRF protection on state-changing requests; output escaping and a content security policy against XSS; no SQL built from strings.
- **Secrets:** where do they live, who can read them, how are they rotated? None in the repository, logs, error messages or client bundles.
- **Least privilege:** does the app's database user lack DDL rights? Do service tokens and API keys have the narrowest scope? Do admin functions need a separate role?
- **Abuse:** rate limits on login, signup, password reset and expensive or costly endpoints (including AI calls); enumeration through error messages or timing; what an authenticated but malicious user can do.
- **Audit:** are sensitive changes recorded with who, what and when, in the same transaction as the change?

## 4. Failure and operations

- **External calls:** for each external service, what happens when it is slow, down, or returns garbage? Timeouts set? Retries limited, with backoff, and only for idempotent operations?
- **Partial failure:** if step 2 of 3 fails, what state is left? Is there a transaction, an outbox, or a compensating step?
- **Deploy:** where does it run, how is it deployed, and how is a bad deploy rolled back? Do migrations run before or after the code that needs them, and is the old code compatible during the switch?
- **Environments:** which environments exist (local, test, production), and how do configuration and secrets differ between them?
- **Backup and restore:** what is backed up, how often, where, and has a restore ever been tested? Is there a backup before every deploy that migrates data?
- **Observability:** can someone find out at 3 a.m. what failed and for which user, without logging personal data or secrets? Which signal raises an alert?
- **Cost:** which parts grow in cost with usage (AI calls, storage, egress)? Is there a limit or an alert?

## 5. Simplicity

- What is the simplest design that meets the requirements? Name it, even when you do not choose it.
- For each extra service, layer, queue, cache or abstraction: what concrete problem does it solve today? Fill the complexity table in the skill.
- Can a well-known starter, library or managed service replace something being hand-built? Was it searched for?
- Will the user be able to understand, run and debug this alone in six months?

## 6. Fit for agents

- Are module boundaries clear enough that two agents working in parallel touch different files?
- Is there one obvious place for each kind of code (routes, domain logic, data access, UI), recorded in `docs/MAP.md`?
- Are the rules that protect the system enforceable by a lint rule, a type, a test or a single helper, instead of relying on every agent remembering them?
- Are naming, error shapes, ids, dates and response formats fixed where independent work would drift?
- Is there an existing file that a new feature can copy as the example?

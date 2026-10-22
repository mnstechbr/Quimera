# Vision review categories

Scan `docs/VISION.md` against each category. "Clear" describes what is enough; the probes are starting points for questions, not a script. Ask only what would change what gets built, tested, operated or paid for.

## 1. Problem and who has it

- **Clear when:** one or two sentences name who is affected, what hurts today, and when; the user's own words support it.
- **Probes:** Who exactly feels this, in what situation? What do they do today instead? What happens if we build nothing?
- **Why it matters:** a product that solves a vague problem ends up solving none.

## 2. Out of scope

- **Clear when:** an explicit list of what the first version will not do, including tempting features.
- **Probes:** What would someone reasonably expect that we will not build now? What is for later?
- **Why it matters:** anything not written as out of scope will be assumed in scope by someone, and the work grows.

## 3. Success criteria and failure criteria

- **Clear when:** each is measurable (a number, a time, a rate) with a baseline or "unknown", and there is at least one failure signal that would make us stop or change course.
- **Probes:** In three months, what number tells us it worked? What would tell us it failed? Who measures it, and how?
- **Why it matters:** without a measurable target, "done" is an opinion and there is no way to know when to stop investing.

## 4. Users, roles and permissions

- **Clear when:** each kind of user is named, with what they can see and do, and who grants or removes access.
- **Probes:** Who can see whose data? Is there an administrator? Can one person belong to two organizations? What can a user never do?
- **Why it matters:** permissions are expensive to change after data exists; a wrong default leaks data.

## 5. Data: what exists, who owns it, retention and LGPD

- **Clear when:** the main data is listed, with its source, owner, what is personal or sensitive, how long it is kept, how a person can ask for deletion, and where it is stored.
- **Probes:** Which personal data do we collect, and why do we need each item? How long do we keep it? What happens when a customer leaves? Do we import data that already exists?
- **Why it matters:** LGPD obligations and deletion rules shape the database from day one; retrofitting them is risky.

## 6. Cost per customer

- **Clear when:** a rough monthly cost per customer (or per usage unit) for AI calls, hosting, storage and messages (for example per WhatsApp conversation), compared with what the customer pays or the budget.
- **Probes:** How many AI calls does a typical customer trigger per day? Which messages cost money? What is the most a customer can cost us before it hurts?
- **Why it matters:** usage-priced services can make each new customer lose money without anyone noticing.

## 7. External dependencies and what happens when each fails

- **Clear when:** each external service (AI provider, payments, messaging, login, email, maps) is listed with what the user sees and what the system does when it is down, slow or changes its rules.
- **Probes:** If the AI provider is down for an hour, what does the user see? If the messaging platform blocks the number? Is there a fallback or only a clear message?
- **Why it matters:** every dependency will fail at some point; deciding the behaviour now avoids silent data loss and angry users.

## 8. Deploy, backup and rollback

- **Clear when:** where it runs, how a new version goes live, how often data is backed up and where, how long a restore takes, and how to return to the previous version.
- **Probes:** If a deploy breaks the site, how do we go back, and how long does it take? When was a backup last restored as a test? Who can deploy?
- **Why it matters:** a backup that was never restored is a hope, not a backup.

## 9. Observability: how we know it broke

- **Clear when:** the failures that matter are named, with how we find out (alert, log, health check, user report) and who is notified.
- **Probes:** Would we know before the customer tells us? Which errors are logged, and where? What must never appear in logs (secrets, personal data)?
- **Why it matters:** problems found by customers cost trust; problems found by no one cost data.

## 10. Security and abuse

- **Clear when:** the main threats are named for this product (account takeover, data leaking between customers, spam, prompt injection into AI features, scraping, fraud), with the intended defence and the limits (rate limits, quotas).
- **Probes:** What is the worst thing a malicious user could do? Can one customer see another's data? What stops someone from running up our AI or message bill?
- **Why it matters:** abuse that costs money or leaks data is usually cheap to prevent early and expensive after an incident.

## 11. Product languages

- **Clear when:** the languages of the finished product are listed, plus who writes and reviews the copy, and whether dates, currency and number formats follow a locale.
- **Probes:** Which languages at launch? Does the AI answer in the user's language? Who checks the translations?
- **Why it matters:** adding a language late touches every screen, message and template.

## 12. What we don't know yet

- **Clear when:** an explicit list of open unknowns, each with its impact and how and when we will find out.
- **Probes:** What are we betting on without evidence? What would make us change the approach?
- **Why it matters:** named unknowns can be tested cheaply; hidden ones surface as rework.

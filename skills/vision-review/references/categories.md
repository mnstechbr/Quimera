# Vision review categories

Scan `docs/VISION.md` against the core categories and the set for the project's product type (the profile's "Product type" line). "Clear" describes what is enough; the probes are starting points for questions in plain words, not a script. Ask only what would change what gets built, tested, operated or paid for. A category from another set applies only when the vision makes it relevant.

## Core: every product

### C1. Problem and who has it

- **Clear when:** one or two sentences name who is affected, what hurts today, and when; the user's own words support it.
- **Probes:** Who exactly feels this, in what situation? What do they do today instead? What happens if we build nothing?
- **Why it matters:** a product that solves a vague problem ends up solving none.

### C2. Out of scope

- **Clear when:** an explicit list of what the first version will not do, including tempting features.
- **Probes:** What would someone reasonably expect that we will not build now? What is for later?
- **Why it matters:** anything not written as out of scope will be assumed in scope by someone, and the work grows.

### C3. Success criteria and failure criteria

- **Clear when:** each is measurable (a number, a time, a rate) with a baseline or "unknown", and there is at least one failure signal that would make us stop or change course.
- **Probes:** In three months, what number tells us it worked? What would tell us it failed? Who measures it, and how?
- **Why it matters:** without a measurable target, "done" is an opinion and there is no way to know when to stop investing.

### C4. Quality bar and references

- **Clear when:** the owner named two or three existing products, games or sites at the level they expect, said what they like in each, and what would make them say "this is not good enough".
- **Probes:** Which product, game or site is the level you have in mind? What would disappoint you on the first try? Is a rough first version acceptable to test the idea, or must the first thing you see already look finished?
- **Why it matters:** an owner who expects a polished product and receives a rough prototype loses trust, and the work is redone.

### C5. External dependencies and what happens when each fails

- **Clear when:** each external service (AI provider, payments, messaging, login, email, maps, stores) is listed with what the user sees and what the system does when it is down, slow or changes its rules.
- **Probes:** If that service is down for an hour, what does the user see? If a store or platform changes its rules? Is there a fallback or only a clear message?
- **Why it matters:** every dependency will fail at some point; deciding the behaviour now avoids silent data loss and angry users.

### C6. Product languages

- **Clear when:** the languages of the finished product are listed, plus who writes and reviews the copy, and whether dates, currency and number formats follow a locale.
- **Probes:** Which languages at launch? Does the AI answer in the user's language? Who checks the translations?
- **Why it matters:** adding a language late touches every screen, message and template.

### C7. What we don't know yet

- **Clear when:** an explicit list of open unknowns, each with its impact and how and when we will find out.
- **Probes:** What are we betting on without evidence? What would make us change the approach?
- **Why it matters:** named unknowns can be tested cheaply; hidden ones surface as rework.

## Set: web app or SaaS, mobile app, API (products with accounts or customer data)

### A1. Users, roles and permissions

- **Clear when:** each kind of user is named, with what they can see and do, and who grants or removes access.
- **Probes:** Who can see whose data? Is there an administrator? Can one person belong to two organizations? What can a user never do?
- **Why it matters:** permissions are expensive to change after data exists; a wrong default leaks data.

### A2. Data: what exists, who owns it, retention and LGPD

- **Clear when:** the main data is listed, with its source, owner, what is personal or sensitive, how long it is kept, how a person can ask for deletion, and where it is stored.
- **Probes:** Which personal data do we collect, and why do we need each item? How long do we keep it? What happens when a customer leaves? Do we import data that already exists?
- **Why it matters:** LGPD obligations and deletion rules shape the database from day one; retrofitting them is risky.

### A3. Cost per customer

- **Clear when:** a rough monthly cost per customer (or per usage unit) for AI calls, hosting, storage and messages (for example per WhatsApp conversation), compared with what the customer pays or the budget.
- **Probes:** How many AI calls does a typical customer trigger per day? Which messages cost money? What is the most a customer can cost us before it hurts?
- **Why it matters:** usage-priced services can make each new customer lose money without anyone noticing.

### A4. Deploy, backup and rollback

- **Clear when:** where it runs, how a new version goes live, how often data is backed up and where, how long a restore takes, and how to return to the previous version.
- **Probes:** If a deploy breaks the site, how do we go back, and how long does it take? When was a backup last restored as a test? Who can deploy?
- **Why it matters:** a backup that was never restored is a hope, not a backup.

### A5. Observability: how we know it broke

- **Clear when:** the failures that matter are named, with how we find out (alert, log, health check, user report) and who is notified.
- **Probes:** Would we know before the customer tells us? Which errors are logged, and where? What must never appear in logs (secrets, personal data)?
- **Why it matters:** problems found by customers cost trust; problems found by no one cost data.

### A6. Security and abuse

- **Clear when:** the main threats are named for this product (account takeover, data leaking between customers, spam, prompt injection into AI features, scraping, fraud), with the intended defence and the limits (rate limits, quotas).
- **Probes:** What is the worst thing a malicious user could do? Can one customer see another's data? What stops someone from running up our AI or message bill?
- **Why it matters:** abuse that costs money or leaks data is usually cheap to prevent early and expensive after an incident.

## Set: landing page or visual showcase

### V1. What the visitor should do

- **Clear when:** the one action a visitor should take (contact on WhatsApp, book, buy, try something) is named, with how we will know they did it.
- **Probes:** After one minute on the page, what should the visitor do? How will you know it worked?
- **Why it matters:** a beautiful page without a clear action impresses and sells nothing.

### V2. Content and assets: who provides them

- **Clear when:** every photo, model, video and text is listed with who provides it (the owner, a photographer, a generator, a free library) and its license.
- **Probes:** Do the real photos or products exist yet? Who writes the texts? May we use generated images, and should the page say so?
- **Why it matters:** waiting for assets stalls the work, and an asset without a license can force the page offline.

### V3. Device budget

- **Clear when:** the weakest device that must run it well (a mid-range phone, for example), the page weight, and the weight of any 3D or video are stated.
- **Probes:** What phone do your visitors use? Must it work on mobile data? How long may the first screen take to appear?
- **Why it matters:** heavy visuals that work on a desktop can make the page unusable on the phones the visitors actually have.

### V4. What the page captures from the visitor

- **Clear when:** anything taken from the visitor (camera, photos, forms, location) is listed, with where it goes and whether it ever leaves the device.
- **Probes:** Does anything the visitor shows or types leave their phone? What does the page tell them about it?
- **Why it matters:** a camera or form feature without a clear privacy promise scares visitors away and can break the law.

## Set: game

### G1. Core loop and session

- **Clear when:** what the player does again and again, what makes it fun, and how long a typical session lasts are written in a few sentences.
- **Probes:** What does the player do in the first thirty seconds? What makes them try again after losing? How long does one play last on the bus?
- **Why it matters:** every level, control and screen serves the core loop; without it the game becomes a pile of features.

### G2. Who makes the art, the levels and the sound

- **Clear when:** for art, levels, sound and music, it is clear who makes each (the owner, the agent, a tool, an artist), with what style references and licenses.
- **Probes:** Do you draw the characters, or should the agent? Who designs the levels? Which games look like what you imagine?
- **Why it matters:** placeholder art and levels nobody owns are where game projects disappoint their owners first.

### G3. Target device and performance budget

- **Clear when:** the weakest device that must run it smoothly, the frame rate, the install size and how it is installed (store, direct install) are stated.
- **Probes:** Which phone must it run on without stuttering? How will people install it: a store, or a file you send them?
- **Why it matters:** the engine, the art and the effects are chosen against this budget.

### G4. Difficulty, fairness and progression

- **Clear when:** how hard it is, how it gets harder, what is never allowed (random deaths, unfair traps), and how a stuck player gets help are written down.
- **Probes:** Who should be able to finish the first level? What would feel unfair? Is there an easier mode?
- **Why it matters:** difficulty decides whether players come back; it is also what the owner will judge by playing.

### G5. Players' data, age and money

- **Clear when:** the age of the players, what is saved and where, and whether there are ads, purchases or online features are stated, with the rules that follow (children's privacy, store policies).
- **Probes:** Can children play? Is anything saved online? Will it ever have ads or purchases?
- **Why it matters:** games for children carry legal limits on data, ads and paid random rewards that shape the design from the start.

## Set: library or command-line tool

### L1. Who uses it and how

- **Clear when:** who calls it (a developer, a script, another program), the main commands or functions, and what is promised to stay stable are stated.
- **Probes:** Who will call this, from where? What would break for them if a name changed?
- **Why it matters:** the public surface is a promise; changing it later breaks other people's work.

### L2. Platforms and runtimes

- **Clear when:** the operating systems, runtime versions and environments it must support are listed.
- **Probes:** Which systems must it run on? Which runtime versions do its users have?
- **Why it matters:** each platform added late brings its own path, shell and packaging problems.

### L3. Distribution and license

- **Clear when:** how people get it (a package registry, a download, a copy), how versions are named, and the license are decided.
- **Probes:** How will people install and update it? May companies use it?
- **Why it matters:** the license and the release channel are hard to change once people depend on them.

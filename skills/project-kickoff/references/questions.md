# Kickoff questions

Ask one at a time, in plain words: no jargon and no acronym the owner did not use first. Each question gets: the question, one plain line on why it matters, your recommendation with the reason, and the options. Wait for the answer before the next one. Talk in the user's language (default Brazilian Portuguese until question (g) says otherwise).

When the owner chose "decide technical choices and explain briefly" in (a), turn (c), (e) and (h) into one plain confirmation each with your recommendation, for example: "Vou deixar o histórico do git só com o seu nome, sem marcas de IA. Pode ser?" The identity (d) is always asked: it cannot be guessed.

**(a) How technical are you, and who decides the technical choices?**
- Ask in plain words how much they know about building software (for example "I build software", "I know a little", "I don't program"), and how technical choices should be made:
  - *Decide technical choices yourself and explain them briefly:* the agent picks stack, tools, libraries and settings, and says in one plain line what it picked and why.
  - *Explain the options and ask me:* the agent brings each real technical trade-off to the owner, with a recommendation.
- Why it matters: it decides which questions the owner hears for the rest of the project.
- Recommend *decide yourself* when the owner does not program, *explain and ask* when they build software and want to steer. Product choices (what it does, for whom, how it looks and feels) always stay with the owner.

**(b) Coaching or concise?**
- *Coaching:* explain the reasoning behind reviews and decisions, so the owner learns along the way.
- *Concise:* short answers and recorded decisions; explanations only when asked.
- Why it matters: it sets how long every message is and how many questions a review asks.
- Recommend *concise* for an owner who wants results, *coaching* when they say they want to learn.

**(c) Mode: discreet or open?**
- *Discreet:* work happens on the user's machine; commits carry only the user's identity; no AI marks in branches, commits or pull requests (the `commit-msg` hook installed with Quimera strips co-author and "generated with" lines).
- *Open:* agents may also work directly on the remote (cloud sessions, pull requests opened by agents), and AI marks are acceptable.
- Why it matters: it decides who appears as a contributor in the repository's history, which cannot be cleaned up later without rewriting it.
- Recommend *discreet* for employer, client or corporate repositories, and whenever the user is unsure; *open* is fine for personal projects where they do not mind.

**(d) Git identity: which name and email?**
- If the user's own instructions or memory record their usual identities (for example a name, a personal email for their own projects and an employer email for employer projects), offer them as suggestions, never as facts. Show what git currently returns next to the suggestion.
- Why it matters: git identity is per machine and per repository; a wrong email attaches commits to the wrong account and cannot be fixed without rewriting history.
- Never invent or infer an email. Never use the hosting service's private "noreply" address unless the user asks for it. Always get an explicit answer.

**(e) Quimera files: committed or local-only?**
- *Committed:* the kit and memory files live in the repository and travel with it to every computer and collaborator.
- *Local-only:* they stay on this machine through `.git/info/exclude` and are never pushed.
- Why it matters: local-only keeps the employer's repository free of your process files, but then the memory is not in the project's history: without its own history (below) it exists only on this disk.
- Recommend *local-only* only for employer or client repositories. Recommend *committed* for the user's own projects, discreet or not: the commit guard already keeps AI marks out of the history, and committed memory travels to every computer.
- If the user picks local-only, ask two follow-ups in the same way: keep the product documents (`docs/vision/`, `docs/studies/`, `docs/plans/`, `docs/reviews/`) out of git too? (recommend no, unless the repository belongs to someone else); and keep a private history of the memory on this machine? (recommend yes: without it a lost disk loses every decision).

**(f) What kind of product is it, who is it for, and in which languages will it be?**
- The product type, one of: web app or SaaS · landing page or visual showcase · game · mobile app · library or command-line tool · API · other. When there is a vision file, read the type from it and ask the owner to confirm.
- Why it matters: `vision-review` and `design-directions` ask different questions for each type; a game needs questions about its core loop and art, not about customer roles.
- Ask for the audience in the user's words (who uses it, in what situation). Then the product languages (for example Portuguese only; Portuguese and English).
- Why it matters: the audience shapes every design and copy decision; adding a second language late means touching every screen and message.
- Recommend a single language first unless the user names a real audience that needs the second one now.

**(g) Which language should agents use to talk to you?**
- Recommend Brazilian Portuguese if that is how the user has been writing. Files, code and commits stay in English regardless (QUIMERA.md, "Language").

**(h) Which models do you use here, and full or economic?**
- Ask which providers or models the user works with in this project (for example Claude, GPT, Gemini, DeepSeek, MiMo, or a mix such as "Claude plans and reviews, DeepSeek writes the code"), and whether the token budget is limited.
- Show the mapping from `.quimera/adapters/models.md` for what they named, in both profiles, with the effort for each role.
- Why it matters: it decides which model plans, writes and reviews, and how much each task costs. Economic keeps every review on the mid-size model and has plans spell out the exact change.
- Recommend *economic* when the budget is limited (an employer's quota, a small plan), *full* otherwise. If the user names models of their own, record those names; they win over the table.

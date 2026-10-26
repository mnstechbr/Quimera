# Models per provider

Which real model fills each Quimera tier, for each model provider, in the two model profiles. The tool adapters (`claude-code.md`, `codex.md`, …) say how to call a model in that tool; this file says which model to call. The two are separate because one tool can run another provider's models (for example DeepSeek or MiMo through a launcher that runs Claude Code against their endpoint).

**Checked on 2026-10-22.** Model names change every few months. The project profile's "Models" line wins over this file: when the user names their models at kickoff, use those. When a name below no longer exists, use the provider's current model of the same size and tell the user. Never move to a costlier model without the user's ok: if no model of the same size is offered, use the next smaller one and say so, or ask.

## How to read the tables

Skills name a tier (fast, standard, strongest). Each table says which model, at which effort, fills that tier in each model profile (QUIMERA.md, "Model profile"):

- **Full:** the strongest model plans and reviews risky work, a mid-size model implements.
- **Economic:** for limited token budgets. A mid-size model plans and reviews, the small model writes the code. Plans hand the implementer the exact change (`writing-plans`), and moving any step back up to a stronger model needs the user's ok.

Never use the maximum effort level. Models above the tiers (premium lines) only when the user asks.

## Anthropic (Claude)

| Tier | Full | Economic |
|---|---|---|
| strongest | Opus (`opus`) · high; xhigh only for very complex work | Sonnet (`sonnet`) · medium |
| standard | Sonnet (`sonnet`) · medium | Haiku (`haiku`) · medium |
| fast | Haiku (`haiku`) · low | Haiku (`haiku`) · low |

Above the tiers, only if the user asks: Fable and the Mythos tier. Effort levels as documented on 2026-10-22: low, medium, high, xhigh, max.

## OpenAI (GPT)

| Tier | Full | Economic |
|---|---|---|
| strongest | GPT-6.1 Sol (`gpt-6.1-sol`) · high; xhigh only for very complex work | GPT-6.1 Sol · medium |
| standard | GPT-6.1 Sol · medium | GPT-6 Luna (`gpt-6-luna`) · medium |
| fast | GPT-6 Luna · low | GPT-6 Luna · low |

- In the full profile, strongest and standard are the same model at different effort. OpenAI says GPT-6.1 Sol comes close to GPT-6 Astra on agentic coding at about a fifth of Astra's list price. GPT-5.6 Terra is left out: it is the previous generation, and its list price was close to Sol's.
- Above the tiers, only if the user asks: GPT-6 Astra (`gpt-6-astra`).
- Reasoning effort levels as documented on 2026-10-22: none, low, medium, high, xhigh, max.

## Google (Gemini)

| Tier | Full | Economic |
|---|---|---|
| strongest | Gemini 3.1 Pro (3.5 Pro once released) · high thinking | Gemini 3.6 Flash · medium |
| standard | Gemini 3.6 Flash · medium | Gemini 3.5 Flash-Lite · medium |
| fast | Gemini 3.5 Flash-Lite · low | Gemini 3.5 Flash-Lite · low |

- On 2026-10-22, Gemini 3.5 Pro had been announced and tested with partners but not released, and Gemini 3.1 Pro was still a preview.
- In the economic profile, if Flash-Lite struggles to write code, move code to Flash and tell the user.

## DeepSeek

| Tier | Full and economic |
|---|---|
| strongest | DeepSeek V4 Pro (`deepseek-v4-pro`); V4.1 Pro once released · thinking on |
| standard | DeepSeek V4.1 Flash (`deepseek-flash`) · thinking on |
| fast | DeepSeek V4.1 Flash · thinking off, where offered |

- Two sizes, so both profiles are the same: Pro plans and does **every** review (including ordinary ones that use the standard tier elsewhere), Flash writes the code and searches.
- On 2026-10-22, V4.1 Pro had been announced but not released; the API listed `deepseek-flash` and `deepseek-v4-pro`. In September DeepSeek announced that `deepseek-v4-pro` would temporarily answer with V4.1 Flash, and later reports said that plan was withdrawn. Before relying on Pro as the reviewer, check which model actually answers (the `model` field of a response, or DeepSeek's docs); if Pro is redirected to Flash, tell the user.
- DeepSeek says V4.1 Flash beats V4 Pro; that claim was not independently checked, so Pro stays the reviewer until the user decides otherwise.

## Xiaomi (MiMo)

| Tier | Full and economic |
|---|---|
| strongest | MiMo-V2.6 Pro · thinking on |
| standard | MiMo-V2.6 Flash · thinking on |
| fast | MiMo-V2.6 Flash · thinking off, where offered |

Like DeepSeek: two sizes, so both profiles are the same. Pro plans and does every review, Flash writes the code and searches.

## Mixing providers

A project may use more than one provider (for example a Claude session that hands implementation to a DeepSeek session). Write it in the profile's "Models" line, one role per provider, for example "plan and review: Anthropic; implement: DeepSeek". Keep the reviewer on a different model from the implementer when you can: a reviewer from another model family catches different mistakes.

## Sources

Checked on 2026-10-22, mostly from news coverage; prefer the provider's own model page when it differs.

- OpenAI: [GPT-6.1 Sol launch (ProPakistani)](https://propakistani.pk/2026/09/30/gpt-6-1-sol-brings-astra-level-performance-at-5x-lower-cost/), [GPT-6 Astra, Sol and Luna (Origami)](https://origami.sa/en/blog/gpt-6-astra-sol-luna-difference/), [GPT-6 in Codex (9to5Mac)](https://9to5mac.com/2026/09/22/openai-upgrading-chatgpt-and-codex-with-two-more-gpt-6-models/)
- DeepSeek: [V4.1 Flash release (Tproger)](https://tproger.ru/news/deepseek-vypustila-multimodalnuyu-model-v4-1-flash-i-nachala-za), [V4.1 Pro status (OrcaRouter)](https://www.orcarouter.ai/pt/blog/deepseek-v4-1-pro)
- Google: [Gemini 3.6 Flash, no 3.5 Pro (TechCrunch)](https://techcrunch.com/2026/07/21/google-releases-three-new-gemini-models-but-no-3-5-pro/), [Gemini 3.5 Pro status (Eesel)](https://www.eesel.ai/blog/gemini-3-5-pro)
- Xiaomi: [MiMo-V2.6 Flash (OpenRouter)](https://openrouter.ai/xiaomi/mimo-v2.6-flash), [MiMo-V2.6 release (Let's Data Science)](https://letsdatascience.com/news/xiaomi-releases-mimo-v26-open-weight-multimodal-models-d436ddef)

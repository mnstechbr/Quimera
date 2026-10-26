---
name: design-directions
description: "Use before the first screen of a product with a UI, when creating or changing a visual identity, before a major new surface (dashboard, onboarding, landing page), or when the user asks for design options. Also read it before building any later screen, to follow docs/DESIGN.md."
---

# Design directions

Turn "who is this for" into a visual system the user chooses with confidence. You propose; you do not wait to be told colors and fonts. The user wants opinionated directions fitted to the audience, with reasons, never a pile of random options.

Run the proposal and refinement on the strongest tier. Rendering a direction that is already defined can go to a subagent (tier: standard).

## Two files, two jobs

- `docs/DESIGN.md` owns **how it looks**: tokens, type, spacing, shape, motion, data display, component visuals.
- `docs/EXPERIENCE.md` owns **how it behaves**: surfaces, flows, states, interaction, copy tone, the product's languages, accessibility.

EXPERIENCE.md refers to DESIGN.md tokens by name and never restates values. Both win over any mockup.

## 1. Learn what exists

Before asking anything, look for:

- Brand assets: logo, brand guide, existing palette or fonts.
- Token files: CSS custom properties, Tailwind or theme config, `styles/tokens.*`, a design system package.
- `docs/DESIGN.md`, `docs/EXPERIENCE.md`, `docs/VISION.md` (audience, product), design entries in `docs/DECISIONS.md`.
- Existing screens and components, and any design skills installed in the project.

An existing brand binds you. Directions work inside it unless the user asks for a change, and no brand change ships without the user's approval of shown examples.

## 2. Understand the audience

Ask only what the files did not answer. One question at a time, each with your best guess and a line on why it matters. Usually three to five questions are enough:

1. **Who receives it**, and is the person who pays different from the person who uses it? (Register: a clinic owner and a teenager need different products.)
2. **Context of use:** where, when, how rushed, in what light, with what on their mind?
3. **Devices and widths:** phone in one hand, office monitor, tablet at a counter? Which one matters most?
4. **Feeling to leave:** what should someone say about it after one minute? Any product they love or hate as a reference?
5. **Content and data:** what does the main screen show, and how much of it is numbers?

Then scan for concerns that shape the system and confirm the ones that apply: accessibility needs, dark mode, languages and text expansion, motion sensitivity, offline use, content density, regulated or sensitive wording, notifications.

## 3. Propose two or three directions

Each direction is a complete personality applied to the same real screen, not a palette swap. Directions must differ in at least density, type character and motion register. For each:

- **Idea:** one sentence.
- **Why it fits this audience:** tie it to the answers from step 2.
- **Type pairing:** display and text faces, with the reason for the pairing, and a fallback stack.
- **Palette as tokens:** semantic names (`surface`, `surface-raised`, `text`, `text-muted`, `accent`, `danger`, `success`, `border`, `focus`) with hex values, light and dark if both are in scope, and the contrast ratio of the main text and accent pairs.
- **Spacing scale:** base unit and steps (for example 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64), plus page margins at 360 and 1440 px.
- **Motion:** what moves and why (feedback, continuity, orientation, delight), durations and easing, one signature moment, and what happens under `prefers-reduced-motion` (motion replaced by a fade or an instant change, never just removed if it carried meaning). The user loves motion design: make it meaningful, not decorative noise.
- **Data made meaningful:** how numbers become insight instead of a dump: the one figure that leads, comparisons and trends instead of raw lists, progressive disclosure, interaction (hover, filter, drill-down), and what the empty and first-use states teach.
- **Risks:** what could go wrong (readability, cost to build, fatigue, accessibility, how it ages).

Then **recommend one** and say why it beats the others for this audience. A hybrid is fine if you name exactly what comes from where.

## 4. Render them

When the tool can produce files the user can open, render the directions as self-contained HTML following `references/renderer.md`, with real content from the product, and show them to the user. Save them as `docs/studies/<YYYY-MM-DD>-design-directions.html`, with a short `docs/studies/<YYYY-MM-DD>-design-directions.md` beside it that records the directions, the recommendation and the user's choice. When rendering is not possible, describe each direction precisely enough that the user can picture the main screen: layout, the leading element, the colors on it, one motion moment.

Iterate in small steps. When the user asks for changes, change one thing at a time and show it again.

## 5. Refinement pass

Before finalizing the chosen direction, run the checklist in `references/refinement.md`: spacing, type scale and pairing, hierarchy, contrast, states, responsiveness from 360 to 1920 px, accessibility. If the project or tool has design skills installed (for example "impeccable" or "ui-ux-pro-max"), run this pass through them as well; they are welcome, not required. Fix what the pass finds and show the user what changed and why.

## 6. Record the choice

After the user picks and approves the refined direction:

1. Write `docs/DESIGN.md` from `templates/DESIGN.md`.
2. Write `docs/EXPERIENCE.md` from `templates/EXPERIENCE.md`. Key flows use a named person in a real situation, numbered steps, the moment that matters most, and the failure path.
3. Add a `docs/DECISIONS.md` entry: the chosen direction, why, and the directions rejected and why.
4. Record in `docs/MAP.md` where the tokens live in code.

One fact, one place: before code exists, token values live in DESIGN.md. Once the first implementation creates the token file, DESIGN.md names that file and keeps the rules and reasons; the values live in code.

## Later screens

For every screen or component after the system exists:

1. Read `docs/DESIGN.md` and `docs/EXPERIENCE.md` first. Use existing tokens and components; never hard-code a color, size or duration.
2. Design every state the surface can have: loading, empty, error, partial data, permission denied, success.
3. When the project has a way to capture screenshots (a browser automation tool or the agent's own browser), take them before and after the change at 360, 768, 1280 and 1920 px, in each color mode, and look at them. Report what you checked.
4. A pattern the system does not cover yet: propose it, get the user's agreement, then add it to DESIGN.md or EXPERIENCE.md.
5. Brand changes (logo, palette, type, voice) are never shipped without the user approving examples first.

## Common mistakes

- Asking the user to pick colors from nothing instead of proposing.
- Three directions that are the same layout in three palettes.
- Motion everywhere, or motion that ignores reduced-motion settings.
- Tables of raw numbers where one leading figure and a trend would tell the story.
- Lorem ipsum or invented features in mockups.
- Designing only the happy path at desktop width.

## Provenance

Adapted from BMAD-METHOD by BMad Code, LLC (MIT): `skills/bmad-ux/SKILL.md`, `assets/design-directions.md`, `assets/color-themes.md`, `assets/key-screens.md`, `references/design-md-spec.md`, `references/validate.md` and the DESIGN/EXPERIENCE examples, at commit 61e01f8. Changed: the stance is reversed (the agent proposes opinionated directions fitted to the audience instead of only eliciting); added motion and data-display requirements, a refinement pass and rules for later screens; dropped the memlog, scripts, config resolvers and ticket tree.

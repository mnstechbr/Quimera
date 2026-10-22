# Directions renderer

Brief for the agent (or subagent, tier: standard) that renders the directions. The parent passes: the audience summary, the two or three direction specs from step 3, real product content (names, numbers, sentences from the conversation and `docs/VISION.md`), and the output path.

## What to produce

One self-contained HTML file, `docs/studies/<YYYY-MM-DD>-design-directions.html`, with a switcher (tabs or a side-by-side view) between directions. For each direction:

- A header: name, the one-sentence idea, why it fits the audience, and the recommended badge on the one the parent recommends.
- The hero screen at near real size, in a phone frame and a desktop frame, with real content. No lorem ipsum and no invented features.
- One secondary state on the same screen: empty, loading or error, whichever matters most for this product.
- The data moment: how the main figures are shown and how the user interacts with them (hover detail, filter, drill-down).
- The signature motion moment, playable on load or on click, with a visible note of what it becomes under reduced motion.
- A token panel: color chips with hex values and contrast ratios of the main pairs, the type scale with a sample line per step, the spacing scale as bars.
- The risks, in two or three lines.

## Rules

- All CSS and JavaScript inline; no build step and nothing to install. Web fonts may be linked for the preview, always with a system fallback so the page still works offline.
- Tokens defined as CSS custom properties on `:root` per direction, so the user can lift them.
- Respect `prefers-reduced-motion` in the CSS and the scripts. Respect `prefers-color-scheme` if dark mode is in scope, and offer a manual toggle.
- The page itself must work from 360 px to 1920 px wide without horizontal scrolling.
- Every visible string follows the tone the user described, in the product's language.

## What to return to the parent

Only: the file path, one line per direction describing its personality, which screen and state were shown, and anything you could not render as specified. Do not paste the HTML back.

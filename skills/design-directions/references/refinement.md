# Refinement pass

Run on the chosen direction before writing `docs/DESIGN.md`, and again on any major new surface. For each item, note what you changed and why, so the user learns the reasoning.

## Spacing

- One base unit; every margin, padding and gap is a step of the scale. No one-off values.
- Related things sit closer than unrelated things (proximity carries grouping before borders do).
- Vertical rhythm is consistent between sections; generous space around the one element that leads.

## Type

- A modular scale (for example 1.2 or 1.25) with no more than six or seven steps in use.
- Body text 16 px or larger on mobile; line length 45 to 75 characters; line height around 1.4 to 1.6 for text and tighter for display.
- The pairing has a clear role split (character for display, legibility for text) and the faces do not fight: similar x-height or deliberate contrast, not near-duplicates.
- Numbers in tables and dashboards use tabular figures.

## Hierarchy

- Each screen has one thing that is clearly first. Squint at it: what you see first is what the user should do or know first.
- At most one primary action per view. Secondary actions look secondary.
- Weight, size, color and space each signal one thing; they are not all used at once for emphasis.

## Contrast and color

- WCAG AA at least: 4.5:1 for body text, 3:1 for large text, icons and input borders. Check both color modes.
- Color is never the only signal (errors also have an icon or text; charts also have labels or patterns).
- The accent is reserved for what deserves attention; danger and success are not reused for decoration.

## States

- Every surface has designed loading (skeletons shaped like the content), empty (explains and offers the first action), error (says what happened and what to do), partial and permission-denied states.
- Interactive elements have hover, focus-visible, active, disabled and busy states.

## Responsiveness

- Check at 360, 768, 1280 and 1920 px. Nothing overflows horizontally at 360 px.
- Touch targets at least 44 by 44 px on touch devices.
- Wide screens use the space on purpose (max line length, columns, side panels), not a stretched phone layout.

## Motion

- Each animation has a job: feedback, continuity between states, orientation, or one moment of delight.
- Durations roughly 120 to 200 ms for feedback, 200 to 400 ms for transitions; easing that decelerates on entry.
- Under `prefers-reduced-motion`, movement is replaced by opacity or an instant change, and nothing loops or parallaxes.
- Animate transform and opacity, not layout properties, so it stays smooth on weak phones.

## Accessibility

- Semantic structure: landmarks, one `h1`, headings in order, labels on every input, buttons for actions and links for navigation.
- Full keyboard path with a visible focus ring and a logical order; dialogs trap and return focus.
- Text resizes to 200 % without loss; content readable by a screen reader in the visual order.
- Charts have a text summary or an accessible table.

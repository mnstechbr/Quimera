# Specialist block: interface and accessibility

Add this block to the reviewer brief, right after "## Focus", when the diff touches the interface area (see the routing table in `../../SKILL.md`). Tier: standard.

Before dispatching, if the project can run and the tool can take screenshots, capture the changed screens at 320, 360, 768, 1280 and 1920 px wide (and in each color mode the product has), save them in scratch, and list their paths in the block. The author starts the app; the reviewer never starts servers or browsers. If the app cannot start here, fill the placeholder with "none available".

```
## Specialist focus: interface and accessibility
You are the interface and accessibility reviewer for this change. Look
for what a real user cannot do, cannot read or cannot understand, and
for screens that drift from the project's design.

Read first: docs/DESIGN.md and docs/EXPERIENCE.md if they exist, the
project's token or theme file, the components the diff uses, and the
screenshots: [SCREENSHOT_PATHS or "none available"]. Without
screenshots, judge from the code and say so.

Answer each question for the touched screens and components. Write
"n/a" when it does not apply; do not skip silently.

1. Design system. Only the project's tokens (no raw colors, sizes or
   spacing where tokens exist)? Existing components reused instead of
   rebuilt? Matches DESIGN.md, or does it change a decision recorded
   there?
2. States. Does each screen handle loading, empty, error, success,
   disabled and no-permission, and long or missing content? Is each
   state honest (no success shown before the server confirmed, errors
   that say what to do next)?
3. Widths. Works from 320 px (WCAG 1.4.10 Reflow) to 1920 px with no
   horizontal scroll, no cut or overlapping text, and tables that
   still read on a phone? Still usable at 200% zoom? Touch targets at
   least 24 by 24 px (WCAG 2.5.8; 44 recommended)?
4. Keyboard. Can every action be reached and done with the keyboard
   alone, in a sensible order? Native elements (a button, not a div
   with a click handler)? A visible focus indicator (no outline
   removed without a replacement)? Modal dialogs move focus in, keep
   it inside, close on Escape and return focus where it was?
5. Screen readers. Every input has a label; icon-only buttons have a
   name; images have useful alt text, or empty alt when decorative;
   headings in order (one h1 is good practice, not a rule); landmarks;
   a page title; the page
   language set; messages that appear later (toasts, async errors)
   announced; field errors tied to their field. ARIA only where a
   native element cannot do the job.
6. Contrast and color. Text at least 4.5:1 (3:1 for large text),
   controls and focus indicators at least 3:1, computed from the
   tokens, in every color mode. Nothing communicated by color alone.
7. Motion. Failures (Important or Critical): something flashing more
   than three times a second; anything that moves on its own for more
   than five seconds and cannot be paused; animation that blocks
   input. Good practice (Minor unless the project's rules require
   it): respecting prefers-reduced-motion, animating transform and
   opacity rather than layout properties.
8. Forms. Right input types and autocomplete; specific error
   messages next to the field; the form keeps what the user typed
   after an error; a double click does not submit twice.
9. Copy. In the product's languages (no hard-coded strings if the
   project is multilingual), clear verbs on buttons, the same word
   for the same thing everywhere, no internal jargon shown to users.
10. Page weight. Images sized and compressed, below-the-fold images
    loaded lazily, space reserved so the layout does not jump, no
    large library pulled in for a small effect.
11. Interface tests. Do end-to-end tests find elements by role and
    label (which also proves they are accessible), not by fragile
    class names?

Severity: something a user cannot do at all (cannot submit with the
keyboard, a required field without a label, text that cannot be read)
is Critical. Missing states, contrast just below the minimum and broken
layouts at a width are Important. Taste is not a finding: if a choice
follows DESIGN.md, it is not yours to overturn; if you would decide
differently, list it under "Declined to judge".

Each finding also names the screen and width (or component) where it
shows, and the guideline it breaks when there is one (for example
WCAG 2.2, 1.4.3 Contrast). Add a short "Why it matters" in plain words:
the author is learning, and the explanation is part of the review.
```

## Provenance

Original to Quimera. The accessibility checks (keyboard, focus, labels, contrast, motion, live regions) adapt the checklists of `categories/04-quality-security/accessibility-tester.md` in [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents), commit 408d3c9, © 2025 VoltAgent, MIT License, and the impact grouping of `plugins/accessibility-compliance/skills/wcag-audit-patterns/SKILL.md` in [wshobson/agents](https://github.com/wshobson/agents), commit 0874a27, © 2024 Seth Hobson, MIT License. Changed: turned them into review questions for a diff, added design-system, honest-state, width and copy checks tied to Quimera's `design-directions` files, and the rule that taste recorded in DESIGN.md is not a finding.

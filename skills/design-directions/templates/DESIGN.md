# Design · {{product}}

> How the product looks. Behavior, flows and copy live in `docs/EXPERIENCE.md`. This file and EXPERIENCE.md win over any mockup. Decided in D-NNN; mockups in `docs/studies/{{date}}-design-directions.html`.

## Brand and register

{{Two or three sentences: who it is for, the feeling it leaves, what kind of thing it is. Name what it must never feel like.}}

## Tokens

{{Before code exists: the values below. After: "Token values live in `{{path/to/tokens}}`." and keep only the roles and rules.}}

### Color

| Token | Light | Dark | Use for | Never use for |
|---|---|---|---|---|
| `surface` | {{#hex}} | {{#hex}} | {{page background}} | |
| `text` | | | | |
| `text-muted` | | | | |
| `accent` | | | | |
| `danger` | | | | |
| `focus` | | | | |

Checked contrast: {{text on surface 0.0:1 · accent on surface 0.0:1 · ...}}

### Type

- **Display:** {{face}}, fallback {{stack}}. **Text:** {{face}}, fallback {{stack}}. Why this pairing: {{reason}}.

| Step | Size / line height | Weight | Use |
|---|---|---|---|
| `display` | | | |
| `heading` | | | |
| `body` | | | |
| `small` | | | |

### Spacing and layout

- Base unit {{4 px}}; scale {{4 · 8 · 12 · 16 · 24 · 32 · 48 · 64}}.
- Page margins: {{16 px at 360}} · {{64 px at 1440}}. Max text width {{68ch}}. Breakpoints: {{list}}.
- Grid: {{columns and gutters}}.

### Shape and depth

- Radii: {{scale}} and when each is used. Elevation: {{shadow or tonal layering rules}}.

## Motion

- **Purpose:** {{what motion is for in this product}}.
- **Tokens:** durations {{fast 150 ms · base 250 ms · slow 400 ms}}; easing {{curves}}.
- **Signature moment:** {{the one place motion carries the brand}}.
- **Reduced motion:** {{what each animation becomes}}.

## Data display

- {{How the leading figure is chosen and shown; how trends and comparisons are drawn; chart types allowed; interaction (hover, filter, drill-down); number formatting and tabular figures.}}

## Components

| Component | Anatomy and visual rules | States |
|---|---|---|
| {{Button}} | | {{hover · focus · active · disabled · busy}} |

## Do and don't

- Do: {{rule}}
- Don't: {{rule}}

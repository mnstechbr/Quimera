# Experience · {{product}}

> How the product behaves. Visual rules and token values live in `docs/DESIGN.md`; refer to tokens by name only.

## Foundation

- **Audience:** {{who receives it, who pays, context of use}}.
- **Surfaces and devices:** {{phone web · desktop web · installed app}}; most important width: {{px}}.
- **UI system:** {{component library or "own components"}}; this file records only the behavior that differs from it.

## Surfaces

| Surface | Reached from | Purpose |
|---|---|---|
| {{Home}} | {{login, logo}} | {{what the person gets done here}} |

Every stated need has a surface, and every surface is reached by a flow below.

## Key flows

### {{Flow name}}

{{Named person and situation, e.g. "Ana, owner of a small bakery, checks yesterday's orders on her phone before opening at 6 a.m."}}

1. {{Step}}
2. {{Step}}
3. **Moment that matters:** {{the step where the product earns its place}}
4. **If it fails:** {{what the person sees and can do}}

## States

| Surface | Loading | Empty | Error | Other (offline, denied, partial) |
|---|---|---|---|---|
| | | | | |

## Interaction

- {{Keyboard shortcuts, touch gestures, feedback timing, optimistic updates, confirmation rules for destructive actions, undo.}}

## Voice and tone

| Do | Don't |
|---|---|
| {{"3 orders waiting"}} | {{"You have 3 pending items!"}} |

## Languages

- **Product languages:** {{pt-BR only | pt-BR and en}}; default {{locale}}.
- **Strings:** {{where translations live; how dates, numbers and currency are formatted per locale; text expansion allowance}}.

## Accessibility floor

- {{WCAG level target; keyboard path; screen reader behavior for dynamic content; focus management in dialogs; text alternatives for charts and images.}}

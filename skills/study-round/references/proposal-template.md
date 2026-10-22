# Proposal template

Every proposal subagent returns exactly this structure, as text. Concept level: no code, no file writes. Keep it under ~80 lines.

```markdown
## Proposal <letter> — <short name>

**Angle:** <the angle you were assigned, in one line>

### Approach
<One paragraph: what the user experiences and what changes for them. Not how it is engineered.>

### Architecture sketch
<The main parts and how data flows between them, 3–8 bullets or a small text diagram. Name kinds of components (web app, queue, worker, database, external API), not final library choices.>

### Data
<What is stored, who owns it, how long it is kept, what is sensitive (LGPD). What already exists and can be reused.>

### UX idea
<The core interaction. How interaction gives meaning to the data instead of dumping it on screen. Write "no user interface" if none.>

### Risks
- <risk> — <how likely, what it breaks, how to reduce it>

### Rabbit holes
- <the parts most likely to blow up scope>

### Effort size
<small (days) | medium (weeks) | large (months)> — <one line on why; this is a budget, not an estimate>

### Operating cost
<Rough monthly cost drivers per customer or per usage unit: AI calls, hosting, messages. Mark guesses [ASSUMPTION].>

### Deliberately leaves out
- <what this proposal does not do, and why that is acceptable>

### Assumptions
- <what must be true for this to work> [ASSUMPTION] unless sourced
```

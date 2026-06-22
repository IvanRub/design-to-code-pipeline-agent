# Architecture

## Spec-first principle
The **specification is the primary artifact; code is a derived artifact.** No agent generates
code from the raw human brief. Code is generated *only* from `spec.json`, and the validator
checks code *against* `spec.json` — never against the original prose. If the spec is wrong,
fix the spec and regenerate, do not patch the code.

## Layers (a generated component must respect these)
1. **Tokens** (`../../design-system/tokens.json`) — the only source of visual values. Code references
   them via CSS variables. Nothing downstream may invent a value.
2. **Primitives** (`../../design-system/components.json`) — `Button`, `Input`, `FormField`, etc.
   Compose these; never re-implement them.
3. **Composed component** — the thing we generate. It orchestrates primitives + tokens and
   owns the state machine for the feature.

## Dependency rules
- A component may depend on tokens and on catalog primitives. It may **not** import another
  feature component, fetch data, or hold global state.
- All visual states must be **prop-driven and reachable**. No state may be reachable only
  through internal effects/timers.
- Styling is **CSS Modules + token CSS variables only**. Raw colors (`#hex`, `rgb()`),
  hard-coded `px` for color/spacing, and inline literal styles are forbidden.

## Artifact contract between agents
Agents share state **only** through files in the run directory. An agent never assumes
another agent's reasoning — it reads the artifact and treats it as the full truth.

| Stage | Reads | Writes |
|------|-------|--------|
| parser | brief.md | `extraction.json` |
| states-analyst | extraction.json | `gaps.states.json` |
| a11y-auditor | extraction.json | `gaps.a11y.json` |
| spec-author | extraction.json, gaps.*.json | `spec.json` |
| code-generator | spec.json | `generated/*`, `generated.meta.json` |
| token-validator | generated.meta.json, tokens.json | `validation.tokens.json` |
| qa-reviewer | spec.json, generated.meta.json | `validation.qa.json` |
| assembler | all of the above | `output.json` |

# Code Hints — React 18 + TypeScript 5

## Types & null safety
- `strict: true`. No `any`, no non-null `!` assertions. Model optionality explicitly with `?`
  and discriminated unions for state: `type State = 'idle' | 'loading' | 'error' | 'success'`.
- Props interfaces are exported and named `<Component>Props`.
- Prefer a single `state` discriminant over many overlapping booleans when states are mutually
  exclusive (idle/loading/error). Use booleans only for orthogonal flags (`disabled`).

## React
- Function components only. No class components.
- Controlled inputs; all user-visible state derives from props or local `useState`/`useReducer`.
- Side effects isolated in `useEffect`; never put visual state behind a timer that the parent
  cannot drive (testability + the "reachable states" rule).
- Keys on lists are stable ids, never array index.

## Styling
- Import a `.module.css` and apply `styles.x`. Every value comes from a token CSS variable:
  `color: var(--color-text-primary);` `padding: var(--space-4);`
- Focus states must use `--color-focus-ring` and a visible outline (never `outline: none`
  without a replacement).

## Hallucination guardrails (hard rules)
- A CSS variable is legal **only** if it exists as a `cssVar` in `../../design-system/tokens.json`.
- An imported component is legal **only** if it exists in `../../design-system/components.json`.
- If you need a value that has no token, do NOT invent one — record it as a `constraint`/gap
  for the spec author. Never approximate with a raw literal.

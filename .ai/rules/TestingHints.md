# Testing Hints

## Strategy
- One `*.test.tsx` per component using **React Testing Library** + Vitest.
- Test **behavior and states**, not implementation. There must be at least one test per
  declared state in `spec.json` (`states_covered` must be provable from tests).
- Accessibility: include an `axe` smoke test (`expect(await axe(container)).toHaveNoViolations()`).

## Patterns
- Drive each state through props and assert the visible outcome:
  - `loading` → spinner present, submit disabled, `role="status"` announced.
  - `error` → `role="alert"` present, field `aria-invalid="true"`, message references the field.
  - `empty` → empty affordance shown, no error.
  - `disabled` → controls non-interactive, not focusable into a trap.
- Query by role/label (`getByRole`, `getByLabelText`), not by test id, unless unavoidable.

## Stories
- Every state gets a Storybook story (`*.stories.tsx`), named after the state. Stories are the
  manual pixel-perfect reference for QA and double as visual-regression fixtures.

## Mocks & fixtures
- No network in component tests. Pass data and callbacks via props.
- Fixtures live next to the test; keep them minimal and state-focused.

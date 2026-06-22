# Code Style

## Naming
- Components: `PascalCase`. Props: `camelCase`. CSS Module classes: `camelCase`.
- Files mirror the component: `PaymentForm/PaymentForm.tsx`, `index.ts` re-exports.
- Booleans read as predicates: `isLoading`, `hasError`, `disabled`.
- Event handlers: `onSubmit`, `onChange`; internal handlers `handleSubmit`.

## Formatting
- Prettier defaults: 2-space indent, single quotes, semicolons, trailing commas.
- One component per file. Named exports for components; default export only in `index.ts` barrel.

## Comments
- Comment *why*, not *what*. No restating code.
- Each exported component gets a one-line JSDoc summary describing its responsibility and the
  states it covers.

## Accessibility-as-style (non-negotiable defaults)
- Every interactive element is reachable and operable by keyboard.
- Inputs are associated with labels via `htmlFor`/`id`. Errors use `aria-describedby` and the
  field gets `aria-invalid`.
- Async status uses `role="status"` (polite) or `role="alert"` (assertive) appropriately.
- Decorative icons get `aria-hidden`; meaningful icons get an accessible name.

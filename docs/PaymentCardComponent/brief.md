# Brief: Payment Card Component

## Summary
A payment card component used in the merchant dashboard to display a customer's saved
payment method.

## Description (verbatim intent from input)
> Payment card component. Shows card number (masked: **** **** **** 1234), expiry date,
> cardholder name, card brand icon (Visa/Mastercard/Amex). Used in merchant dashboard to
> display saved payment methods. User can select a card or delete it.

## Component Type
`card` — a display card representing one saved payment method.

## Business Context
Merchant dashboard — list/grid of saved payment methods. Each card is one saved payment
method that a merchant/user can view, select, and delete.

## Content / Fields (explicitly stated in the brief)
- Masked card number, format: `**** **** **** 1234` (last 4 digits visible).
- Expiry date.
- Cardholder name.
- Card brand icon — one of: Visa, Mastercard, Amex.

## Interactions (explicitly stated in the brief)
- User can **select** a card.
- User can **delete** a card.

## States Implied by the Brief
- **Default** — the card is rendered with its data (number, expiry, name, brand icon).
- **Selected** — since the user "can select a card," a selected/unselected distinction is
  implied for the card as an interactive, selectable element.
- Delete is an action/affordance, not a separate visual state that the brief describes
  (e.g., no mention of a confirmation state, disabled state, loading state, or error state).

## Explicit Constraints From the Brief
- Card number must be masked, showing only the last 4 digits, in the format
  `**** **** **** 1234`.
- Must display: expiry date, cardholder name, brand icon.
- Brand icon must support at least: Visa, Mastercard, Amex.
- Must support a select interaction.
- Must support a delete interaction.

## Ambiguities / Open Questions for Downstream Agents (Gap Analysis)
The following are **not** specified in the brief and are intentionally left as gaps rather
than invented here:
- Is "select" a single-select (radio-like, one selected card at a time) or multi-select
  (checkbox-like)? The brief only says "select a card."
- Is delete a direct action (icon button) or does it require a confirmation step
  (e.g., modal, "are you sure?")?
- Is there a loading/skeleton state (e.g., while payment methods are fetched)?
- Is there an error state (e.g., failed to delete, invalid/expired card)?
- Is there a "default/primary" payment method indicator (common in this domain, but not
  mentioned in the brief)?
- Is there a disabled state (e.g., expired card cannot be selected)?
- No visual/token values (colors, spacing, radius, shadow, typography) are specified in the
  brief; visual styling will be derived from `design-system/tokens.json` defaults during
  spec authoring, not invented here.
- No explicit accessibility requirements stated (e.g., keyboard interaction for select/delete,
  labeling of masked number for screen readers) — flagged for the A11y Auditor.

## Next Step
This file feeds `sk-extract` → `extraction.json`. Gaps above should be resolved (or
explicitly deferred) by the States Analyst / A11y Auditor in step 2.

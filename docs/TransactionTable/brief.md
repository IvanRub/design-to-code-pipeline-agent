# Brief: Transaction Table

## Summary
A table component for displaying financial transactions in a fintech application.

## Columns
- Date
- Amount
- Status
- Merchant name
- Payment method

## Behavior
- **Sorting:** Supports sorting by any column.
- **Pagination:** Supports pagination with selectable page sizes of 25, 50, or 100 rows per page.
- **Row interaction:** Clicking a row opens transaction details (destination/target of the click is
  not specified in the brief — could be a modal, drawer, or navigation; needs clarification).

## Status values
- `pending`
- `completed`
- `failed`
- `refunded`

Each status value is displayed with a colored badge. The brief does not specify which color
corresponds to which status, nor does it reference a specific design-system badge component
(no `Badge` component exists in `design-system/components.json` at the time of extraction).

## Open questions (for clarification before/at spec stage)
1. What does "row click opens transaction details" navigate/open to — a modal, a side drawer, or a
   separate route/page? This affects component type classification and interaction model.
2. What color should each status badge use (pending / completed / failed / refunded)? The brief only
   says "colored badge" without mapping specific colors, and no `Badge` primitive currently exists in
   the component catalog.
3. Is there a loading state (initial data fetch) or an empty state (no transactions) expected? Not
   mentioned in the brief.
4. Is there a default sort column/direction, or is the table unsorted until the user interacts?
5. Should pagination controls be visible only when there is more than one page, and what is the
   default page size?

## Notes for downstream agents
- No specific tokens (colors, spacing, radii) are named in the brief; token selection for badges,
  table borders, and typography is left to later stages (gap analysis / spec authoring), grounded in
  `design-system/tokens.json`.
- No existing `Table` or `Badge` component is present in `design-system/components.json`. This
  should be flagged during gap analysis / spec authoring as a design-system gap, not silently
  invented here.

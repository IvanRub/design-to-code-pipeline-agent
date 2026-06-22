# Component brief: Card payment form

Part of the checkout flow (payment context, regulated). Figma:
https://figma.com/file/abc/checkout?node-id=42:17

A card with the title "Payment details" containing:
- Card number input
- Expiry (MM/YY) and CVC side by side
- A primary "Pay $49.00" submit button (brand blue)

When the user submits, the button shows a spinner and the form locks while we charge the card.
If the charge fails, show an error message under the card-number field in red.

Card padding 24px, the title uses the large heading size. Fields stack on mobile.

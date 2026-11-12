# Leo.art — December 2026 through February 2027

Confirmed Friday rotation: Resin Stained Glass begins December 4, 2026 (every other Friday). Junk Journal begins December 11, 2026 (opposite Fridays).

## Requested payment flow
1. Visitor submits a booking request.
2. Visitor pays a required deposit online through a Square-hosted deposit link (configure separately per class).
3. Studio verifies payment manually and confirms the booking.
4. Customer pays remaining balance either online through a separate Square invoice/link, or in person at the studio.

**Not production-ready:** Payment is not automatically linked to a reservation. Booking requests immediately consume seats even when deposit is unpaid; add expiring holds and signed Square webhooks before public launch. Deposit prices and full class prices are not set because they were not provided. See SQUARE-SETUP.md.

Start locally with Node.js 20+: `node server.js`.

Cancellation credit: eligible cancellations (48+ hours ahead) receive a future-class voucher for the full amount actually paid, including any balance paid online or in studio, after manual payment reconciliation. Voucher codes are not activated automatically.

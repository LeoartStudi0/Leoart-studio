# Leo.art — Square checkout setup

## What this version does
- Displays the real recurring classes in the December 2026, January 2027, February 2027 calendar.
- Lets visitors reserve seats for a specific date. Capacity: resin 12; other paid classes 25; trading card club unlimited.
- Shows a Square-hosted checkout button **after** a booking is saved, if a valid Square link is configured.
- Does NOT process cards on Leo.art, confirm Square payment, reconcile payment to booking, issue refunds, or automatically cancel unpaid bookings. Reservations are saved regardless of payment status. Do not market this as paid booking confirmation.

## Create Square payment links
1. In the studio owner's Square Dashboard, go to Payment Links / Online Checkout and create a payment link for each priced class. Set the correct price in Square, not in the website source. For parent + kid pricing, decide whether payment is per person or per pair; one reusable link may not match the number of seats selected.
2. Set the links as server environment variables (example commands below). Never put Square access tokens in HTML/JS.
3. Start Node 20+: `node server.js`; visit http://localhost:3000.
4. After each booking, visitors can click the Square checkout link. Staff must manually match Square payments to booking reference, attendee and class date, because these are reusable class-level links.

Example on macOS/Linux (replace URL placeholders with actual Square-hosted URLs):

```sh
export SQUARE_LINK_PAINT_SIP='https://square.link/u/REPLACE'
export SQUARE_LINK_RESIN='https://square.link/u/REPLACE'
export SQUARE_LINK_PARENT_KID='https://square.link/u/REPLACE'
export SQUARE_LINK_JUNK_JOURNAL='https://square.link/u/REPLACE'
# Optional if club charges a fee:
export SQUARE_LINK_TRADING_CARDS='https://square.link/u/REPLACE'
node server.js
```

## Friday rotation
Resin is confirmed to begin Friday December 4, 2026, and repeats every other Friday. Junk Journal starts Friday December 11, 2026, and runs on alternating Fridays. This anchor is now the default; you may override it with `RESIN_FIRST_FRIDAY`.

## Before going live
- Add real prices and verify Square links, including quantity/seat pricing.
- Implement a production database, email confirmation, admin management, backups, abuse controls and an explicit cancellation/refund policy.
- For automatic payment-linked bookings and seat release after abandoned checkouts, use Square Checkout API to create a unique payment link per reservation, verify signed Square payment webhooks server-side, and hold seats with an expiration. This demo does not do that.
- Configure HTTPS and reliable server hosting. Do not expose `booking-data.json` or Square credentials publicly.

## Deposit and balance policy
- Collect a **deposit online** through the configured Square deposit link. Deposit amounts and class prices have not been supplied; set them in Square after the owner decides.
- Offer the **remaining balance** either in studio (Square POS) or online (a separate Square invoice or balance-specific payment link sent by the studio).
- This prototype does not know how much was paid, how much remains, or whether a deposit succeeded. Staff must verify the deposit and reconcile it against the booking reference before confirming a booking.
- The server currently reduces available capacity as soon as a booking request is saved, even if payment is abandoned. **Do not launch publicly with this behavior** without an expiring seat hold, payment confirmation webhook, and an admin cancellation/release process.
- Decide deposit amount per class, whether the deposit is per attendee or per booking, and refund/cancellation policy before launch.

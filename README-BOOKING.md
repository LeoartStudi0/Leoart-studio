# Leo.art booking website

Requires Node.js 20 or newer. In a terminal, enter this folder and run:

```bash
node server.js
```

Open http://localhost:3000 (do not double-click index.html for live bookings).

Capacity is enforced **per class date** on the server: Resin 12, Paint & Sip 25, Parent + Kid 25, Junk Journal 25, Artist Trading Card Club unlimited. One seat = one attending person, including children. Club is the third Wednesday of each month; its start time is still TBD.

**Alternating Fridays:** The exact Resin/Junk Journal rotation has not been confirmed. To activate both Friday schedules, set `RESIN_FIRST_FRIDAY` to a confirmed Resin class Friday, e.g. `RESIN_FIRST_FRIDAY=2026-12-04 node server.js` **only if that date is correct**. Junk Journal will be offered on opposite Fridays. Without this, Friday classes show no dates, rather than guessing.

Reservations persist in `../booking-data.json`, outside the public website directory. The server rejects bookings that would exceed capacity, including near-simultaneous requests handled in its single process. Do not run multiple independent server processes against the same data file. Keep the data file private and backed up. For a real public deployment, use HTTPS, an appropriate database/transaction mechanism, spam protection, privacy policy, email confirmations, and admin cancellation/management tools. The present version confirms a saved reservation on-screen but **does not send emails, process payment, or notify the studio**. Don't advertise bookings publicly until those operational pieces are ready.

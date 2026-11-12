Leo.art calendar: December 2026, January 2027, February 2027.
Run: node server.js, then visit http://localhost:3000.
Calendar uses /api/calendar and existing /api/bookings.
Resin/Junk Journal rotation is deliberately pending until a confirmed Friday is provided.
To enable the alternating Fridays, set RESIN_FIRST_FRIDAY to a confirmed Friday (YYYY-MM-DD) in the server environment.
The first Resin Friday anchors the alternating pattern; Junk Journal uses opposite Fridays.
No online payments or automatic emails are included. Back up booking-data.json and secure production deployment before public use.

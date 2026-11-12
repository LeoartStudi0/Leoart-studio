# Leo.art — Square booking integration

The website buttons and calendar session selections now open the studio’s Square Appointments booking page:

https://app.squareup.com/appointments/book/zdpi3f3oegt2z6/LQR8EGEP7BJPE/start

## Before going live

1. Create the five actual group classes in Square, with the correct dates, times, prices, and capacity limits.
2. Configure deposit requirements for each class; verify the plan supports class booking and deposits.
3. Test checkout for 1 and multiple attendees, especially Parent + Kid (clarify whether $50 is per pair).
4. Confirm Square booking checkout displays the 48-hour cancellation / voucher policy. The 12-month credit process is not automatically implemented by this site.
5. Square must be the source of truth for seat availability. The calendar here is informational only and does not synchronize availability or auto-select the Square service/date.
6. Do not rely on the original server.js reservation endpoints for live bookings; visitors are directed to Square instead.

The Square page could not be inspected from this environment, so the existence/configuration of the classes is not verified.

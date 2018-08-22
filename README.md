# public-site-framework
Theme and assets for public site.

## Order Processing

This site uses Stripe for payment processing.  Ticket and subscription ordering
follow any of three different flows, depending on the payment method.  All of
the flows start the same way, with a "Buy Tickets" or "Buy Subscriptions" button
on the relevant page.  At the time the page loads, we check in the background
whether any advanced payment method is available (Apple Pay, Google Pay,
Microsoft Pay, browser pay).  If not, we'll fall back to basic payment card
processing.  (This background check takes a few seconds.  If the customer orders
before it finishes, we fall back to basic payment card processing in that case
as well.)

When the customer clicks "Buy Tickets" or "Buy Subscriptions", we launch a modal
dialog box to collect the additional information we need:  quantity, coupon
code, and additional donation.  This is where the flow splits, based on the
payment method:

* For basic payment card processing, the dialog also asks for name, email,
  address, and payment card information.  The payment card fields are in iframes
  hosted by Stripe, for PCI compliance.  When the user submits the form, we get
  a "source" from Stripe that represents the payment card, and submit that with
  the order details to our back end server.
* For Apple Pay, we replace the submit button with one hosted by Stripe in an
  iframe, that uses the Apple Pay logo.  When the user clicks it, Stripe gives
  us an event containing a "source".  We submit that with the order details to
  our back end server.
* For other advanced payment methods, when the user submits the form, we tell
  Stripe to work with the browser to get the payment details.  Stripe gives us
  back a "source", which we submit to our back end server along with the order
  details.

Donations work a little bit differently because the amount of the donation is
part of the form on the donation page itself, and we don't need a coupon code.

* For basic payment card processing, we do the same as above, except that the
  dialog doesn't ask for quantity, coupon code, or additional donation, and the
  button label is different.
* For Apple Pay, we replace the Donate button on the donations page with one
  hosted by Stripe in an iframe, that uses the Apple Pay logo.  This replacement
  will happen a few seconds after the page loads, which is ugly, but oh, well.
  Processing of clicks on it are as above.
* For other advanced payment methods, when the user clicks the Donate button, we
  go straight to Stripe.  We never open our modal dialog.

In all cases, the back-end server receives the order data.  It performs the
following steps:

1. Validate the order data.
2. Find a Customer in Stripe, with the same name, email, and address.  If not
   found, create one.
3. Create an Order in Stripe, with the order details.
4. Pay the Order in Stripe, using the "source".
6. Send an email confirmation of the order to the patron, bcc: to the office.

Note that the order data is not stored at all on the back-end server (other than
in a log file for backup purposes).  Reporting is done based on retrieving data
from Stripe's server.

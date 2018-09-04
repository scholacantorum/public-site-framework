# Order Processing

This document describes the order processing mechanism in the Schola Cantorum
public web site.  (In this document, "orders" also includes donations.)

## User Experience

Patrons placing orders online deal with five user experience elements:

1. The page on which they start the order.
2. The page on which they enter details and finalize the order.
3. The browser confirmation page, for browser-based payment methods.
4. The page that confirms we received the order and payment.
5. The email they receive confirming the order.

Technically, order fulfillment is also part of the user experience (i.e., the
stuff they receive in the mail, the will-call process, etc.), but it's not
discussed here.

### Entry Flow

The user experience on the page where they start the order is kept deliberately
minimal; a complex entry path to the ordering flow tends to discourage orders.
The goal is to get them into the order flow before being faced with decisions or
details.

* For subscription orders, there are no decisions at all, just a single button,
  labeled "Buy Subscriptions".  This appears both on the home page and on the
  Concerts page, during the part of the season in which subscriptions are sold.

* For ticket orders, the only thing they need to decide before starting the flow
  is which seating they want.  There's a button labeled "Buy Tickets" next to
  each seating.

* Donations are a special case because research shows it's better to get people
  to choose the donation amount before getting into order details.  So the
  Donate page has an entry field for the donation amount, followed by a "Donate"
  button.  (Note: in compliance with Apple's User Interface Guidelines, if the
  patron's device supports Apple Pay, an Apple-styled "Donate with Apple Pay"
  button is used instead.)

### Order Details Dialog

The order entry form is displayed in a modal popup dialog.  The page they
started on is still visible underneath, which gives a sense of continuity.  The
dialog is relatively narrow even on wide displays, to reinforce a sense of
simplicity.  All prices and amounts on the form are in whole-dollar units, again
to keep things looking simple.  The dialog has some mixture of the following
elements, top to bottom:

1. Title bar with close button.

   The title is something very basic, like "Ticket Order", "Subscription Order",
   or "Tax-Deductible Donation".  The close button always dismisses the dialog.

2. Heading line with description of the thing being ordered.

   For ticket sales, this contains the concert name and the date.  It's not
   intended to be complete information, but it is intended to be enough to be
   sure they chose the right one.

   For donations, a description would be redundant, this line is used for a
   "Thank you for your support" message instead.

3. Quantity selection line, showing per-unit price and extended amount.

   The quantity defaults to one, so they don't have to enter anything.  The
   per-unit price is suppressed when only one unit is being ordered.

   This line is not shown for donations.

4. Line allowing coupon code entry and showing resulting discount.

   When a correct coupon code is typed, the display automatically shifts to
   showing the discount, shown as a negative amount under the extended amount on
   the previous line.

   This line is not shown for donations.

5. Line allowing additional donation entry.

   The entry field here is sized and positioned so that their donation is part
   of the column of amounts formed by the previous lines.

   This line is not shown for donation orders.

6. Line showing order total, combining the above.

   This line is not shown for donation orders.

7. Entry fields for patron name and email address.

   This line is not shown if the browser supports Apple Pay, Google Pay, etc.,
   since we get that information from their browser in that case.

8. Entry fields for patron address, city, state, and zip code.

   This line is not shown if the browser supports Apple Pay, Google Pay, etc.,
   since we get that information from their browser in that case.  Also, this
   line is not shown for individual ticket orders; we don't mail anything for
   those, so we can't legally collect their address.  (Cal. Civ. Code 1747.08)
   
9. Entry field for payment card number, expiration date, CVC code, and possibly
   zip code.

   This line is not shown if the browser supports Apple Pay, Google Pay, etc.,
   since we get that information from their browser in that case.  For ticket
   orders, this line includes zip code since we didn't get it with the rest of
   their address and we need it for payment card verification.

10. Error message area.

    This area is normally empty, but will display problems with the order if any
    occur.  Problems with invalid content in form fields are usually delayed
    until they user tabs or clicks out of the field containing the invalid data.
    This area also displays a "Processing..." message while the order is being
    processed.

11. Payment and cancel buttons.

    The label on the payment button varies.  For Apple Pay orders, it is an
    Apple-branded Apple Pay button.  For donation orders, it is "Donate $XXX".
    For all other orders, it is "Pay $XXX".  The button is disabled if any of
    the form inputs is incomplete or invalid, or if the order is being
    processed.  The cancel button is disabled while the order is being
    processed, in order to avoid giving the impression that the processing can
    be stopped.

Note that this entire dialog is skipped in the case of a donation being
processed with Apple Pay, Google Pay, etc.  The Donate button on the Donate page
starts the order processing directly.

### Browser Confirmation Dialog

When payment is being handled through Apple Pay, Google Pay, a browser-saved
credit card, etc., lines 7–9 are not shown in the order details dialog.
However, after submitting that dialog, the next thing the patron sees is a
dialog shown by their browser, asking for confirmation of the order.  On modern
mobile devices, confirmation is usually given with a fingerprint or device
unlock code.  On browsers, confirmation is usually given with the CVC code of
the browser-saved card.

### Acknowledgement Dialog

Once the payment is successfully processed, the order details dialog is replaced
with an acknowledgement dialog, confirming that the order was successful.  This
dialog tries to extend the relationship by getting the patron to sign up for our
mailing lists and/or social media.

When signing up for our mailing lists from this dialog, they do not have to
re-enter their information; the information from their order is used.  We do not
sign them up for our mailing lists automatically, however, since that is of
dubious legality.

Once they dismiss this acknowledgement dialog, they are back on the same page
where they started the order process, maintaining the sense of continuity and
context.

This dialog is not shown in the case of a donation being processed with Apple
Pay, Google Pay, etc.  In those cases, the Donate button on the Donate page is
replaced with a line thanking them for their donation.

### Acknowledgement Email

Patrons always get an email acknowledging their order and giving them all of
the information they need about it.  For example, when tickets are purchased,
the email contains full logistical details of the performance.  The return
address on the email is Schola Cantorum's main email address, so that they can
simply reply to it with any questions.

## Order Management

This section describes how to manage the order process: creating and selling
new products, getting information about orders, and processing refunds.

The web site uses [Stripe](https://stripe.com/) as its payment processor,
and also as its primary storage and reporting source for historical order
information.  Google Sheets is used as a secondary storage and reporting source.

Like most payment processors, Stripe has a "Live" mode and a "Test" mode, whose
data are entirely separate.  Our production site (scholacantorum.org) uses
"Live" mode, and our sandbox site (new.scholacantorum.org) uses "Test" mode.
The two sites use different Google Sheets for tracking as well.

### Selling a New Product

To sell a new product, follow these steps:

1.  Define the product in Stripe (test mode).
2.  Define the SKUs for the product in Stripe (test mode).
3.  Add the product to a page on the web site (sandbox).
4.  Add a confirmation email blurb for the product on the web site (sandbox).
5.  Test it out.
6.  Repeat steps 1 and 2 in Stripe (live mode).
7.  Publish the sandbox site to production.

1\.  Define the product in Stripe (test mode).

Go to the [Test mode dashboard](https://dashboard.stripe.com/test/dashboard),
click on "Orders" in the sidebar, and then click on "Products" underneath it.
This shows the list of defined products.  "Donation" is a product, and there's a
product for each subscription and for each seating of each performance.  To add
a new product, click the "New" button at the top right.

In the "Create a product" dialog, only a few fields are important for us:

* The product "Name" is what gets displayed in line 2 of the order details
  dialog.

* If we are going to accept coupon codes to give discounts on this product,
  enter "coupon" in the "Attributes" field.  Otherwise, leave it blank.

* Put in a recognizable ID for the product.  The patterns currently in use are
  `subscription-YYYY-YY` for subscriptions and `ticket-YYYY-MM-DD` for concert
  and event tickets.

* Turn off the "Shippable" checkbox (unless of course the product you're adding
  actually is something shippable).

2\.  Define the SKUs for the product in Stripe (test mode).

Once you've added the product, you must add at least one SKU for the product.
Find the "Inventory" heading, and click the gray "Add SKU" link on the right
side of the page next to that heading.  In the Amount field, enter the full
price of the product (without coupon codes).  (Since the web site order form
does not display cents, make sure to use a whole dollar amount.)  In the "ID"
field, put in a recognizable ID for the SKU (usually the same as the ID for the
product).  If we're accepting coupon codes for the product, there will be a
"Coupon" field; put a single dash "-" in it to indicate that this SKU is used
when no coupon code is given.

If we are accepting coupon codes for the product, you now need to adding an
additional SKU for each coupon code.  In those SKUs, the "Amount" is the price
we want to charge when the code is given (again, a whole dollar amount).  The
"ID" must be something different, usually by adding a suffix (e.g.
`ticket-YYYY-MM-DD-sub` for the subscriber discount for a ticket).  The "Coupon"
field should contain the coupon code.

3\.  Add the product to a page on the web site (sandbox).

Once the product and SKU(s) are defined in Stripe, the next step is to update
the web site.  This is simply a matter of putting

    {{% ticketform ticket-YYYY-MM-DD %}}

or

    {{% subscriptionform subscription-YYYY-YY %}}

onto a page in the desired place.  The strings used in those tags are the
product IDs you defined in Step 1.  The only difference between using
`ticketform` and `subscriptionform` is the label on the button.

4\.  Add a confirmation email blurb for the product on the web site (sandbox).

In the `confirms` directory of the web site, create a file whose name is the
product ID you defined in step 1, with a `.md` extension.  In that file, put
whatever text you want to appear in the confirmation email when someone orders
the product.  See the existing files there for examples.  In this file, you can
use a few special codes:

* `QTY` renders as the quantity of product ordered.  If one unit was ordered,
  it renders as the word "one"; otherwise it renders as the number in digits.
* `(S)` and `(ES)` render as "s" and "es", respectively, if the quantity is
  greater than one.  They don't render at all if the quantity is one.
* `PRICE` renders as the price paid per unit, after applying coupon codes.
* `_EACH` renders as " each" if the quantity is greater than one, and doesn't
  render at all if the quantity is one.

Therefore, `QTY ticket(S) for $PRICE_EACH` renders as "one ticket for $28" or
"2 tickets for $28 each".

5\.  Test the new product.

Using the sandbox site (new.scholacantorum.org), place an order for your new
product.  If it accepts coupon codes, place orders with those too.  Use card
number 4242 4242 4242 4242 for testing.  Verify that everything works as
desired, including the resulting email.

6\.  Define the product and SKUs in Stripe (live mode).

Stripe live mode is entirely separate from Stripe test mode.  Turn off the
"Viewing test data" switch in the Stripe dashboard sidebar, and create the
exact same product and SKUs in live mode.

7\.  Publish the web site changes from the sandbox site to production.

Publish the changes by entering your publish password in the pink bar at the
top of the sandbox site.

### Changing or Stopping Sales of a Product

To change the price of a product, add or remove coupon codes, etc., make the
corresponding change in the Stripe dashboard (test mode).  Then make some
change — it doesn't matter what — to the sandbox web site, to get it to rebuild
with the new Stripe data.  Test out the changes, and then apply them to Stripe
in live mode, and then publish the sandbox.

To stop sales of a product, first remove it from the web site.  Then use the
Stripe dashboard (both live and test modes) to mark the SKUs and/or product
"inactive".  (You can't actually delete them if any sales were made with them.)

### Getting Order Information from Stripe

The Stripe dashboard has a wealth of information about orders and sales.  On
the Home tab, you can see graphs and analysis of sales over time.  On the
Orders tab, you can see all of the orders that have been processed.  On the
Balance tabe, you can see information about when Stripe deposits amounts to our
bank account.

Stripe uses complex order ID codes like `or_DWiZzcQvBFsqPp` to identify orders.
We use nice, simple order numbers.  You can find our order number in the
"Metadata" section of a Stripe order page.  You can also put an order number in
the search box and Stripe will find it.

### Getting Order Information from Google Sheets

Stripe's dashboard gives a lot of detailed information about orders, but it's
not too great at giving summaries like "show me all of the orders for the
November concert".  Also, Stripe can only track orders placed through it; it
can't track offline orders paid with checks or cash.  For both reasons, we use
Google Sheets as a second source for reporting data.

Every time an order is placed through the web site, or changed later (e.g. by
refunding part of it), the spreadsheet in Google Sheets automatically gets
updated.  You can use the filtering and rearranging tools in Google Sheets to
get whatever views of the data you need.  Also, you can add notes to the rows
in the sheet with comments if needed, and you can add additional rows to track
offline sales.

A few caveats:

* Don't change the column layout.  Adding new columns to the right is fine.
  Resizing and hiding columns is fine.  But don't remove any of the existing
  columns and don't add any new ones in between the existing columns.
* Don't make any changes to data entered by the automation.  They may get
  overwritten the next time the automation runs.  (You can freely change the
  "Office Notes" column or the columns to the right of that; they won't get
  overwritten.)
* Don't add new rows with anything that looks like a Stripe order ID (e.g.
  `or_DWiZzcQvBFsqPp`) in the "ProcessorOrderNumber" column.  It might get
  overwritten.

### Processing Refunds

Refunds are handled through the Stripe dashboard.  Find the order you want to
refund in the Stripe dashboard (e.g. by searching).

If you want to refund the entire order, click on the pencil icon next to "PAID"
at the top right of the order page, and change the order status to "Canceled".

If you want to refund just part of an order, click the pencil icon next to the
product you want to refund, and choose one of the options there.

When you refund an order (completely or partially), additional lines will be
added to the Google spreadsheet, with negative numbers, to reflect the refund.

## Implementation Details

This section describes how it all works, for the benefit of people who might
have to fix bugs or make changes in the mechanism.

### Selling a New Product

First, let's follow the flow of selling a new product, given above, and look at
what's happening behind the scenes.  For illustrative purposes, we'll assume the
new product is the tickets for the 2019-03-16 Carmina Burana concert.

1\. Define the product in Stripe (test mode).

The office staff will define the `ticket-2019-03-16` product and the
`ticket-2019-03-16` and `ticket-2019-03-16-sub` SKUs in the Stripe dashboard
(test mode).  Whenever a product or SKU definition is changed in test mode,
Stripe is configured to POST the new definition to
https://new.scholacantorum.org/backend/sku-updated.  The sku-updated program is
a CGI program written in Go; the source code is at
`public-site-backend/sku-updated`.  sku-updated calls Stripe and collects all of
the product and SKU data (for both live and test modes) and places it in
`~/schola6p/data/products.json`.

3\. Add the product to a page on the web site.

In this case, the office staff will add

    {{% ticketform ticket-2019-03-16 %}}

to `public-site/concerts/carmina-burana/seating1.md`.  When this change is
committed to Github, it invokes a webhook (described elsewhere) that causes the
sandbox site to be rebuilt.  When the page for the Carmina Burana concert is
built, Hugo starts by finding the correct template for the page, which is
`public-site-framework/layouts/concerts/single.html`.  At the top of this
template is an instruction

    {{ .Scratch.Set "payForm" "ticket" -}}

which says, in effect, "this page needs to contain an (initially hidden) order
form appropriate for ticket orders".  (Similar instructions appear in the
templates for event pages, the concert list page, and the home page.  An
instruction with a different form, but the same effect, appears in the metadata
of the Donate page.)

Elsewhere in the concert page template, the files for each of the seatings get
injected, and that's when Hugo comes across the `ticketform` shortcode in
`seating1.md`.  The template for this shortcode is in
`public-site-framework/layouts/shortcodes/ticketform.html`.  It takes the
product ID given in the shortcode (`ticket-2019-03-16`) and looks it up in the
`products.json` file to find the product name, price, and coupon details.  It
then generates a "Buy Tickets" button with those details attached as `data-*`
attributes.

The concert page template puts everything inside a definition of a "main" block.
This tells Hugo to insert the concert page details into the body of the basic
site layout template, `public-site-framework/layouts/_default/baseof.html`.  At
the bottom of that template is an instruction

    {{ partial "payform" . }}

which injects the contents of
`public-site-framework/layouts/partials/payform.html`.  This template checks for
a setting of the `payForm` variable, and finds that it was set to "ticket", so
it adds an (initially hidden) ticket order form to the page.  Since it's a
ticket order form, it knows it should include all of the UI elements of the
order form described above, except for \#8, the patron's address.  We don't use
that for individual ticket orders, so it's illegal to request it.  (Subscription
order forms would have an address but would omit a coupon code.  Donation forms
omit quantity, coupon code, and additional donation fields.)

As a result, the generated concert page has a "Buy Tickets" button with all of
the product-specific data attached to it, and an initially hidden ticket order
form.

4\. Add a confirmation email blurb for the product on the web site.

When this change is committed to Github, it invokes the same webhook that again
causes the sandbox site to be rebuilt.  The `confirms` directory of the site is
built just like everything else, but with one key exception:  its template
(`public-site-framework/layouts/confirms/single.html`) does *not* put everything
inside a definition of a "main" block, so the basic site layout template is not
used.  Instead, the resulting HTML files for the confirm "pages" contain just
the HTML-formatted text from their source files and nothing else.

These files are part of the generated web site, and someone could browse to them
if they wanted to, but there are no links to them so that's unlikely.  These
files are actually used later when building the order confirmation emails.

### Placing an Order

Next, lets follow the user experience flow of purchasing a product, also given
above, and look at what's happening.  For illustrative purposes, we'll assume
the patron is purchasing two tickets to the 2019-03-16 Carmina Burana concert,
using a coupon code to get a subscriber discount, and adding in a $100 donation.

1\. The page on which they start the order.

In this case, the page on which they start the order is the page for the Carmina
Burana concert, `/concerts/carmina-burana/index.html`, which was built as
described above.

When the page loads, the Javascript code
(`public-site-framework/assets/orders.js`) will notice the presence of "Buy
Tickets" buttons on the page, and will add event handlers to them.  The event
handlers extract the product data from the `data-*` attributes on the button,
and invoke the order flow by calling the `scholaGetPayment` function, described
below.

Meanwhile, also on page load, other Javascript code
(`public-site-framework/assets/payform.js`) detects the presence of the hidden
order form on the page.  As a result, it does three things:

1. It asks Stripe's Javascript library whether browser-based payments are
   available in the current browser.  This includes Apple Pay, Google Pay,
   Microsoft Pay, and any browser that supports the Payment Requests API and
   has a saved payment card.  This is an asynchronous check which takes a few
   seconds.  (If the user is really fast and starts an order before the check
   completes, we assume the answer is "no".)

   As a special case, if the check determines that Apple Pay is supported and
   the order button is a Donate button, we replace it with an Apple-branded
   "Donate with Apple Pay" button to conform to their requirements.

2. It asks Stripe's Javascript library to create a payment card entry field in
   the order form.  We'll use that if the above check fails.  Stripe hosts this
   entry field on their own servers, and presents it on our form inside of an
   iframe, so we never see the customer's card information at all.  This call is
   also asynchronous and also takes a few seconds, so we start it early.

3. It defines the `scholaGetPayment` function referenced above.

When the `scholaGetPayment` function is invoked, it will usually open the modal
order dialog, as described below.  However, as a special case, if browser-based
payments are supported and the order form is a donation form, no modal dialog is
needed and `scholaGetPayment` immediately initiates the browser payment flow.

2\. The page on which they enter details and finalize the order.

In our ticket order case, we do need the modal dialog, so `scholaGetPayment`
shows it.  It injects the product name and price into the relevant parts of
the form.  If browser-based payments are being used, it hides the name, email,
address, and payment card entry fields.

While the user is editing the form, `scholaGetPayment` continually keeps the
order totals up to date, shows field validation errors when appropriate, ensures
the "Pay" (or "Donate") button is enabled only when the form is complete, etc.
Of particular note, it watches for entry of a valid coupon code into that field,
and when it sees one, it replaces the coupon code entry line with a line showing
the resulting discount.

When the user clicks the "Pay" or "Donate" button, `scholaGetPayment` talks to
Stripe to get a payment "source".  If browser-based payments are in use, this
will cause the browser confirmation dialog to appear.  If not, the source comes
from the payment card information entered into the field that Stripe is hosting.
Either way, we get back a short string that references the payment information
stored on Stripe's servers.  We then submit it, along with the rest of the order
details, to `/backend/to-stripe`.

`/backend/to-stripe` is another CGI program written in Go; the source code is at
`public-site-backend/to-stripe`.  This program does several things:

1. It assigns an order number to the proposed order, so we don't have to deal
   with Stripe's gibberish order ID strings.
2. It validates the order data, and logs it.
3. It finds an existing Customer on Stripe's server with the same name and email
   address; or failing that, creates one.
4. It creates an Order on Stripe's server for that Customer, with the details of
   the desired order.
5. It pays for that Order using the payment "source" string.
6. It sends a confirmation email to the patron, with a bcc: to the office; see
   below.  (This last step is actually done by invoking a separate send-email
   program, so that we don't have to wait for it.  Sending email can be slow.)

If any problems occur during that sequence, they are returned to the browser and
`scholaGetPayment` displays them in the order dialog.  If the sequence is
successful, to-stripe returns the Stripe order ID to the browser, and
`scholaGetPayment` moves on to the acknowledgement page.

Sidebar: Updating the Google Sheet

When any order is updated in test mode, Stripe is configured to pass the new
order details in a POST call to
`https://new.scholacantorum.org/backend/order-updated`.  This is yet another
CGI program written in Go.  It takes the order data and updates the Google
spreadsheet with it.  This happens when a new order is paid; it also happens
later if a refund is issued.  The program finds all lines in the spreadsheet
that have the same Stripe order ID.  It adjusts the quantities and totals of
those lines as needed, adds new lines as needed, and removes lines as needed.
New lines are always added at the bottom of the sheet.

4\. The page that confirms we received the order and payment.

`scholaGetPayment` hides the order details form that has been used to this
point, and reveals a different part of the modal dialog used for
acknowledgements.  This part shows a static text confirmation that their order
was received.  It then gives links for them to connect further with Schola:
joining our email list, joining our postal mail list, following us on Facebook,
and following us on Twitter.  The latter two are just links to our Facebook and
Twitter pages, that open in a new browser window.

The link to join our email list goes to another CGI program, `email-signup`, and
passes it the order ID of the completed order.  email-signup talks to Stripe to
get the patron's name and email address, and then sends that to MailChimp.

The link to join our postal mail list appears only if the order form required an
address (i.e., not for individual ticket sales).  It goes to a CGI program,
`mail-signup`, which retrieves the patron's name and postal address from Stripe
and sends an email to the office telling them to add that address to our postal
mail list.  (Note, this is the same CGI program used by the Mailing Lists page
of the site.)

5\. The email they receive confirming the order.

As noted above, the email is sent by the to-stripe program when it finishes
processing the order.  The actual email is assembled from a few pieces:

1. The Schola logo as letterhead.
2. A generic salutation using their name as they gave it on the order form.
3. The text of `/confirms/ticket-2019-03-16/index.html` as generated by Hugo,
   with the special codes described above interpolated.
4. If an additional donation was included, the text of
   `/confirms/donation/index.html`, again with special codes interpolated.
5. If the item quantity was more than one, or an additional donation was
   included, a paragraph stating the total amount of the charge.
6. A generic closing with Schola's contact information.

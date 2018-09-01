// scholaGetPayment is a function in global scope.  It will be assigned to a
// closure in the code below, if there is a payment form on the page.
var scholaGetPayment;

// scholaUpdatePaymentHook is a hook called by updatePaymentRequest when it
// needs to know the correct order details.  This allows the Donate form to
// provide the donation amount when Apple Pay is in use.
var scholaUpdateOrderHook;

// scholaPaymentAcceptedHook is a hook called when a payment is accepted.  It is
// used by the Donate form to display a confirmation.
var scholaPaymentAcceptedHook;

window.addEventListener('load', function () {
    var payform = document.getElementById('pay-form');
    if (!payform) return;

    var paymessage = document.getElementById('pay-message');
    var paybutton = document.getElementById('pay-button');
    var paycancel = document.getElementById('pay-cancel');
    var payqtytext = document.getElementById('pay-qty-text');
    var payqtyamount = document.getElementById('pay-qty-amount');

    // paymentRequest is a Stripe PaymentRequest object, used for Apple Pay,
    // Google Pay, etc.  canMakePayment is the return its canMakePayment method:
    // null for "no", an object with irrelevant details for "yes".
    var paymentRequest;
    var canMakePayment;

    // emptyFields is a set of names of form fields that are incompletely filled
    // out.  (Only the keys of the object are relevant.)  When it is not empty,
    // the Pay button is disabled.
    var emptyFields = {};

    // errorFields is a map from form field names to error messages about
    // invalid data in those fields.  When it is not empty, the error messages
    // are shown and the Pay button is disabled.
    var errorFields = {};

    // payFormState records the state of the form: "entry", "processing",
    // "rejected", or "accepted".
    var payFormState;

    // orderDetails tracks the details of the order in progress.  It is an
    // object with all of the keys passed to scholaGetPayment (which see), plus:
    //   - qty = quantity currently entered on form
    //   - addDonate = additional donation currently entered on form
    //   - effectivePrice = price per unit after coupon applied
    //   - effectiveProduct = product code after coupon applied
    //   - total = order total including coupon and additional donation
    var orderDetails;

    // Set the payment message and the state and labels of the buttons
    // appropriately for the state of the dialog.
    function setFormState(state, message) {

        // When we are given a state, that's our new state.  Otherwise, we
        // normally stay in the state we were previously in.  But the "rejected"
        // state is transient, lasting only until the next call of this method.
        if (state) {
            payFormState = state;
        } else if (payFormState === 'rejected') {
            payFormState = 'entry';
        }

        // When processing, both buttons are disabled and a message is shown.
        if (payFormState === 'processing') {
            paymessage.textContent = 'Processing, please wait...'
            paymessage.className = '';
            paymessage.style.display = 'block';
            paybutton.style.display = 'block';
            paybutton.setAttribute('disabled', 'disabled');
            paycancel.setAttribute('disabled', 'disabled');
            return;
        }

        // When rejected, the error is shown (with a default), and the Pay
        // button is disabled.
        if (payFormState === 'rejected') {
            paymessage.className = 'pay-message-bad';
            paymessage.style.display = 'block';
            paymessage.textContent = message || 'We apologize that we are unable to process your payment at this time.  Please try again later, or call the Schola Cantorum office at 650-254‑1700.';
            paybutton.style.display = 'block';
            paybutton.setAttribute('disabled', 'disabled');
            paycancel.removeAttribute('disabled');
            return;
        }

        // When accepted, the success is shown, the Pay button is hidden, and
        // the Cancel button turns into a Close button.
        if (payFormState === 'accepted') {
            paymessage.className = 'pay-message-good';
            paymessage.style.display = 'block';
            paymessage.textContent = 'Thank you.  We have received your payment and emailed you a confirmation.';
            paybutton.style.display = 'none';
            paycancel.removeAttribute('disabled');
            paycancel.textContent = 'Close';
            return;
        }

        // From here down, we're in the "entry" state.
        paybutton.style.display = 'block';
        paycancel.removeAttribute('disabled');
        paycancel.textContent = 'Cancel';

        // If there are any field errors, display them and disable the Pay
        // button.
        var errors = [];
        for (var id in errorFields) {
            errors.push(errorFields[id]);
        }
        if (errors.length) {
            paymessage.style.display = 'block';
            paymessage.textContent = errors.join('\n');
            paymessage.className = 'pay-message-bad';
            paybutton.setAttribute('disabled', 'disabled');
            return;
        }

        // If there are any incomplete fields, disable the Pay button.
        paymessage.style.display = 'none';
        var found = false;
        for (var id in emptyFields) {
            found = true;
        }
        if (found) {
            paybutton.setAttribute('disabled', 'disabled');
        } else {
            paybutton.removeAttribute('disabled');
        }

        // Calculate the amounts to display in the dynamic parts of the form.
        if (orderDetails.donate) {
            paybutton.textContent = 'Donate $' + orderDetails.donate;
        } else {
            var qty = parseInt(payform.qty.value);
            if (isNaN(qty) || qty < 1) {
                payqtytext.textContent = orderDetails.noun[1];
                payqtyamount.textContent = '';
                paybutton.textContent = 'Pay Now';
            } else {
                var donate = parseInt(payform.donate.value);
                if (isNaN(donate) || donate < 0) donate = 0;
                var price = orderDetails.price;
                var product = orderDetails.product;
                var h = btoa(payform.coupon.value.trim().toUpperCase());
                for (var i in orderDetails.coupons) {
                    if (h === i) {
                        price = orderDetails.coupons[i].price;
                        product = orderDetails.coupons[i].product;
                    }
                }
                if (qty > 1) {
                    payqtytext.textContent = orderDetails.noun[1] + ' at $' + price;
                } else {
                    payqtytext.textContent = orderDetails.noun[0];
                }
                payqtyamount.textContent = '$' + (qty * price);
                paybutton.textContent = 'Pay $' + (qty * price + donate);
                orderDetails.qty = qty;
                orderDetails.total = qty * price + donate;
                orderDetails.addDonate = donate;
                orderDetails.effectivePrice = price;
                orderDetails.effectiveProduct = product;
            }
        }
    }

    // Common parts of the three sendToServer functions.
    function sendToServer(params, success, failure) {
        if (orderDetails.donate) {
            params.donation = orderDetails.donate;
            params.total = orderDetails.donate;
        } else {
            params.donation = orderDetails.addDonate;
            params.product = orderDetails.effectiveProduct;
            params.quantity = orderDetails.qty;
            params.coupon = payform.coupon.value.trim().toUpperCase();
            params.total = orderDetails.total;
        }
        fetch('/backend/to-stripe', {
            body: JSON.stringify(params),
            headers: { 'Content-Type': 'application/json' },
            method: "POST",
        }).then(function (result) {
            if (result.ok) {
                success();
                if (scholaPaymentAcceptedHook) scholaPaymentAcceptedHook();
            } else if (result.status === 400) {
                result.text().then(function (err) {
                    failure(err);
                })
            } else {
                failure();
            }
        }).catch(function (err) {
            failure();
        })
    }

    // Send the payment information to the back end.
    function sendFormToServer(sourceID) {
        var params = {
            name: payform.name.value,
            email: payform.email.value,
            address: payform.address.value,
            city: payform.city.value,
            state: payform.state.value,
            zip: payform.zip.value,
            paySource: sourceID,
        }
        sendToServer(params, function () {
            setFormState('accepted');
        }, function (err) {
            setFormState('rejected', err);
        });
    }

    // Send the payment information to the back end.
    function sendPRToServer(pay) {
        var params = {
            name: pay.payerName,
            email: pay.payerEmail,
            address: pay.shippingAddress.addressLine.join(', '),
            city: pay.shippingAddress.city,
            state: pay.shippingAddress.region,
            zip: pay.shippingAddress.postalCode,
            paySource: pay.source.id,
        };
        sendToServer(params, function () {
            pay.complete('success');
            if (!scholaPaymentAcceptedHook)
                setFormState('accepted');
        }, function () {
            pay.complete('fail');
            if (!scholaPaymentAcceptedHook)
                setFormState('rejected', err);
        });
    }

    // Handle a change to the card number, expiry date, or CVC code.
    function onCardEntryChange(evt) {
        if (evt.error) {
            errorFields[evt.elementType] = evt.error.message;
        } else {
            delete errorFields[evt.elementType];
        }
        if (evt.complete) {
            delete emptyFields[evt.elementType];
        } else {
            emptyFields[evt.elementType] = true;
        }
        setFormState();
    }

    // Handle a change to the item quantity.
    function onQtyChange() {
        var v = payform.qty.value.trim();
        if (v === '') {
            emptyFields.qty = true;
            delete errorFields.qty;
        } else {
            delete emptyFields.qty;
            n = parseInt(v)
            if (isNaN(n) || n < 1) {
                errorFields.qty = 'Please enter a valid quantity.';
            } else {
                delete errorFields.qty;
            }
        }
        setFormState();
    }

    // Handle a change to the coupon code.
    function onCouponChange() {
        var v = payform.coupon.value.trim().toUpperCase();
        if (v === '') {
            delete errorFields.coupon;
        } else {
            var h = btoa(v);
            var p;
            for (var i in orderDetails.coupons) {
                if (h === i) p = orderDetails.coupons[i];
            }
            if (p) {
                delete errorFields.coupon;
            } else {
                errorFields.coupon = 'This coupon code is not recognized.';
            }
        }
        setFormState();
    }

    // Handle a change to the donation amount.
    function onDonateChange() {
        var v = payform.donate.value.trim();
        if (v === '') return;
        n = parseInt(v)
        if (isNaN(n) || n < 0) {
            errorFields.donate = 'Please enter a valid donation amount.';
        } else {
            delete errorFields.donate;
        }
        setFormState();
    }

    // Handle a change to any of the name, email, address, city, state, or zip
    // fields.  Basically we just want to know if they have contents.
    function onPayerChange(evt) {
        var v = evt.target.value.trim();
        if (v === '') {
            emptyFields[evt.target.name] = true;
        } else {
            delete emptyFields[evt.target.name];
        }
        setFormState();
    }

    // Handle a change to the state.
    function onStateChange() {
        var v = payform.state.value.trim();
        if (v === '') {
            emptyFields.state = true;
        } else {
            delete emptyFields.state;
            if (v.match(/^[A-Za-z]{2}$/)) {
                delete errorFields.state;
            } else {
                errorFields.state = 'Please enter a 2-letter state code.';
            }
        }
        setFormState();
    }

    // Handle a change to the zip code.
    function onZipChange() {
        var v = payform.zip.value.trim();
        if (v === '') {
            emptyFields.zip = true;
        } else {
            delete emptyFields.zip;
            if (v.match(/^[0-9]{5}(?:-[0-9]{4})?$/)) {
                delete errorFields.zip;
            } else {
                errorFields.zip = 'Please enter a 5- or 9-digit zip code.';
            }
        }
        setFormState();
    }

    function updatePaymentRequest() {
        var od;
        if (scholaUpdateOrderHook) {
            var od = scholaUpdateOrderHook(orderDetails);
            if (!od) return false;
            orderDetails = od;
            orderDetails.total = orderDetails.donate;
        }
        var update = {
            total: {
                amount: orderDetails.total * 100,
                label: orderDetails.title,
                pending: false,
            }
        }
        if (!orderDetails.donate) {
            var label = orderDetails.description;
            if (orderDetails.qty > 1)
                label += ' (' + orderDetails.qty + ' at $' + orderDetails.effectivePrice + ')';
            update.displayItems = [{
                amount: orderDetails.effectivePrice * 100 * orderDetails.qty,
                label: label,
            }];
            var donate = parseInt(payform.donate.value);
            if (!isNaN(donate) && donate > 0) {
                update.displayItems.push({
                    amount: 100 * donate,
                    label: 'Tax-Deductible Donation',
                });
            }
        }
        paymentRequest.update(update);
        return true;
    }

    function sendCardSource() {
        stripe.createSource(cardnum, {
            owner: {
                name: payform.name.value,
                email: payform.email.value,
                address: {
                    line1: payform.address.value,
                    city: payform.city.value,
                    state: payform.state.value,
                    postal_code: payform.zip.value,
                    country: 'US',
                },
            }
        }).then(function (result) {
            if (result.error) {
                setFormState('rejected', result.error.message);
            } else {
                sendFormToServer(result.source.id);
            }
        });
    }

    // Handle the "Pay Now" button.
    function onPayFormSubmit(evt) {
        evt.preventDefault();
        if (paybutton.getAttribute('disabled')) return;
        setFormState('processing');
        if (canMakePayment) {
            if (!updatePaymentRequest()) return;
            paymentRequest.show();
        } else {
            sendCardSource();
        }
    }

    // Replace the payment button with an Apple Pay button.  If there's a div
    // for it on the base page, we assume we're handling a donation and style
    // the button that way.  (HACK!)
    function setApplePayButton() {
        var apdiv = document.getElementById('applepaydiv');
        var args = { paymentRequest: paymentRequest };
        if (apdiv) {
            args.style = { paymentRequestButton: { type: 'donate' } };
        } else {
            apdiv = document.getElementById('pay-apple');
        }
        var apbut = elements.create('paymentRequestButton', args);
        apbut.mount(apdiv);
        apbut.on('click', function (evt) {
            if (!updatePaymentRequest())
                evt.preventDefault();
        })
    }

    // Set up the card entry fields on the form.  Note: I'd prefer to use
    // Stripe's single "card" entry field rather than the three separate
    // cardNumber, cardExpiry, and cardCvc fields, but it doesn't render
    // properly at the narrow size we use.
    var stripe = Stripe('{{ .Site.Params.stripeKey }}');
    var elements = stripe.elements();
    var cardnum = elements.create('cardNumber', { style: { base: { fontSize: '16px' } }, placeholder: 'Payment Card Number' });
    var cardexp = elements.create('cardExpiry', { style: { base: { fontSize: '16px' } } });
    var cardcvc = elements.create('cardCvc', { style: { base: { fontSize: '16px' } } });
    cardnum.mount('#pay-cardnum');
    cardexp.mount('#pay-cardexp');
    cardcvc.mount('#pay-cardcvc');

    // Set event handlers on the three card entry fields, to set the form state.
    cardnum.on('change', onCardEntryChange);
    cardexp.on('change', onCardEntryChange);
    cardcvc.on('change', onCardEntryChange);

    // Set event handlers on the other fields, to set the form state.
    payform.qty.addEventListener('input', onQtyChange);
    payform.coupon.addEventListener('change', onCouponChange);
    payform.donate.addEventListener('input', onDonateChange);
    payform.name.addEventListener('input', onPayerChange);
    payform.email.addEventListener('input', onPayerChange);
    payform.address.addEventListener('input', onPayerChange);
    payform.city.addEventListener('input', onPayerChange);
    payform.state.addEventListener('change', onStateChange);
    payform.zip.addEventListener('change', onZipChange);
    payform.addEventListener('submit', onPayFormSubmit);

    // Find out whether the payment request API is supported.
    paymentRequest = stripe.paymentRequest({
        country: 'US', currency: 'usd',
        total: { amount: 100, label: 'Test', pending: true },
        requestPayerName: true, requestPayerEmail: true, requestShipping: true,
        shippingOptions: [{ id: 'default', label: 'U.S. Mail', amount: 0 }],
    });
    paymentRequest.canMakePayment().then(function (can) {
        if (orderDetails) return; // already processing
        canMakePayment = can;
        if (can && can.applePay) {
            setApplePayButton();
        }
    });
    paymentRequest.on('source', sendPRToServer);
    paymentRequest.on('cancel', function () { $('#pay-dialog').modal('hide'); })

    // scholaGetPayment is the global function called to launch the payment
    // process.  It takes an object with the following keys:
    //   - donate = the dollar amount to donate, for a donation order, or null
    //     for a regular purchase
    //   - title = payment form title
    //   - description = description of item being ordered
    //   - product = product code for the item being ordered
    //   - price = dollar price of one unit of the item being ordered
    //   - noun = array with two strings, the singular and plural single-word
    //     forms of the item being purchased
    //   - coupons = object whose keys are base64-encoded coupon codes and whose
    //     values are objects with two keys:
    //     - price = price to use when that coupon code is applied
    //     - product = product code to use when that coupon code is applied
    scholaGetPayment = function (args) {
        orderDetails = args;

        // Special case for donation with payment request, because we don't
        // raise any modal dialog.
        if (args.donate && canMakePayment) {
            orderDetails.total = orderDetails.donate;
            if (updatePaymentRequest())
                paymentRequest.show();
            return;
        }

        // Clear the payment form.
        payFormState = 'entry';
        emptyFields = {};
        if (args.donate) {
            document.getElementById('pay-qty-row').style.display = 'none';
            document.getElementById('pay-coupon-row').style.display = 'none';
        } else {
            document.getElementById('pay-qty-row').style.display = 'flex';
            payform.qty.value = '1';
            document.getElementById('pay-coupon-row').style.display = 'flex';
            payform.coupon.value = '';
            payform.donate.value = '';
        }
        if (canMakePayment) {
            document.getElementById('pay-cardpmt').style.display = 'none';
        } else {
            document.getElementById('pay-cardpmt').style.display = 'block';
            payform.name.value = '';
            emptyFields.name = true;
            payform.email.value = '';
            emptyFields.email = true;
            payform.address.value = '';
            emptyFields.address = true;
            payform.city.value = '';
            emptyFields.city = true;
            payform.state.value = '';
            emptyFields.state = true;
            payform.zip.value = '';
            emptyFields.zip = true;
            cardnum.clear();
            emptyFields.cardNumber = true;
            cardexp.clear();
            emptyFields.cardExpiry = true;
            cardcvc.clear();
            emptyFields.cardCvc = true;
        }
        errorFields = {};
        setFormState();

        // Set seed data.
        document.getElementById('pay-title').textContent = args.title;
        document.getElementById('pay-item').textContent = args.description;
        if (args.donate) {
            paybutton.value = 'Donate $' + args.donate;
        } else {
            payqtytext.textContent = args.noun[0];
            payqtyamount.textContent = '$' + args.price;
            paybutton.textContent = 'Pay $' + args.price;
        }

        // Launch the modal dialog.
        $('#pay-dialog').modal({ backdrop: 'static' });
    };

});

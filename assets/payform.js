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

    // References to all of the form controls and divs.  Note that some of these
    // may not exist, depending on which payment form is on the page.
    var paytitle = document.getElementById('pay-title');
    var payitem = document.getElementById('pay-item');
    var payqty = document.getElementById('pay-qty');
    var payqtytext = document.getElementById('pay-qty-text');
    var payqtyamount = document.getElementById('pay-qty-amount');
    var paycouponrow = document.getElementById('pay-coupon-row');
    var paycoupon = document.getElementById('pay-coupon');
    var paydiscountrow = document.getElementById('pay-discount-row');
    var paydiscount = document.getElementById('pay-discount');
    var paydonate = document.getElementById('pay-donate');
    var paytotal = document.getElementById('pay-total');
    var paydivider = document.getElementById('pay-divider');
    var paycardpmt = document.getElementById('pay-cardpmt');
    var payname = document.getElementById('pay-name');
    var payemail = document.getElementById('pay-email');
    var payaddress = document.getElementById('pay-address');
    var paycity = document.getElementById('pay-city');
    var paystate = document.getElementById('pay-state');
    var payzip = document.getElementById('pay-zip');
    var paymessage = document.getElementById('pay-message');
    var payapple = document.getElementById('pay-apple');
    var paybutton = document.getElementById('pay-button');
    var paycancel = document.getElementById('pay-cancel');

    // paymentRequest is a Stripe PaymentRequest object, used for Apple Pay,
    // Google Pay, etc.  canMakePayment is the return its canMakePayment method:
    // null for "no", an object with irrelevant details for "yes".
    var paymentRequest;
    var canMakePayment;

    // payFormState records the state of the form: "entry", "processing",
    // "rejected", or "accepted".
    var payFormState;

    // hasBeenFocused is a set of names of form fields that have received focus.
    // It is used to control whether errors are displayed when those fields are
    // empty.
    var hasBeenFocused = {};

    // cardComplete is a flag indicating that the card number entry field has
    // complete card details in it.
    // cardError is a string giving a validation error for the card number, or
    // null if the card number is valid.
    // cardFocused is a boolean indicating that the card entry field currently
    // has focus.
    var cardComplete = false;
    var cardError = null;
    var cardFocused = false;

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
        if (typeof state === 'string') {
            payFormState = state;
        } else if (payFormState === 'rejected') {
            payFormState = 'entry';
        }

        // Start a new calculation of the form totals and messages.
        orderDetails.total = 0;
        orderDetails.effectivePrice = orderDetails.price;
        orderDetails.effectiveProduct = orderDetails.product;
        var errors = [];
        var valid = true;

        // Handle the quantity row.
        if (payqty) {
            var qty = parseInt(payqty.value);
            if (isNaN(qty) || qty < 1) {
                payqtytext.textContent = orderDetails.noun[1];
                payqtytext.classList.remove('pay-qty-plural');
                payqtyamount.textContent = '';
                orderDetails.qty = 0;
                valid = false;
                if (document.activeElement !== payqty)
                    errors.push('Please enter a valid quantity.');
            } else {
                if (qty > 1) {
                    payqtytext.textContent = orderDetails.noun[1] + ' at $' + orderDetails.price + ' each';
                    // note the second and third spaces in that string are non-breaking
                    payqtytext.classList.add('pay-qty-plural');
                } else {
                    payqtytext.textContent = orderDetails.noun[0];
                    payqtytext.classList.remove('pay-qty-plural');
                }
                orderDetails.total = qty * orderDetails.price;
                payqtyamount.textContent = '$' + orderDetails.total;
                orderDetails.qty = qty;
            }
            if (payFormState === 'processing' || payFormState === 'accepted') {
                payqty.setAttribute('disabled', 'disabled');
            } else {
                payqty.removeAttribute('disabled');
            }
        }

        // Handle the incoming donation if any.
        if (orderDetails.donate)
            orderDetails.total += orderDetails.donate;

        // Handle the coupon row.
        if (paycouponrow) {
            var code = btoa(paycoupon.value.trim().toUpperCase());
            var found = false;
            for (var coupon in orderDetails.coupons) {
                if (coupon === code) {
                    found = true;
                    paycouponrow.style.display = 'none';
                    paydiscountrow.style.display = 'flex';
                    orderDetails.effectivePrice = orderDetails.coupons[coupon].price;
                    orderDetails.effectiveProduct = orderDetails.coupons[coupon].product;
                    paydiscount.textContent = '−' + (orderDetails.qty * (orderDetails.price - orderDetails.effectivePrice));
                    orderDetails.total = orderDetails.qty * orderDetails.effectivePrice;
                    break;
                }
            }
            if (!found) {
                if (code != '') {
                    valid = false;
                    if (document.activeElement !== paycoupon)
                        errors.push('The coupon code is not recognized.');
                }
                if (payFormState === 'processing' || payFormState === 'accepted') {
                    paycoupon.setAttribute('disabled', 'disabled');
                } else {
                    paycoupon.removeAttribute('disabled');
                }
            }
        }

        // Handle the additional donation row.
        if (paydonate) {
            var donate = paydonate.value;
            orderDetails.addDonate = 0;
            if (donate !== '') {
                donate = parseInt(donate);
                if (isNaN(donate) || donate < 0) {
                    valid = false;
                    if (document.activeElement !== paydonate)
                        errors.push('Please enter a valid donation amount.');
                } else {
                    orderDetails.addDonate = donate;
                    orderDetails.total += donate;
                }
            }
            if (payFormState === 'processing' || payFormState === 'accepted') {
                paydonate.setAttribute('disabled', 'disabled');
            } else {
                paydonate.removeAttribute('disabled');
            }
        }

        // Handle the total row.
        if (paytotal) {
            paytotal.textContent = '$' + orderDetails.total;
        }

        // If we're taking a card payment, handle those rows.
        if (!canMakePayment) {

            // Handle the name row.
            if (payname.value.trim() === '') {
                valid = false;
                if (document.activeElement !== payname && hasBeenFocused[payname.name])
                    errors.push('Please provide your name.');
            }
            if (payFormState === 'processing' || payFormState === 'accepted') {
                payname.setAttribute('disabled', 'disabled');
            } else {
                payname.removeAttribute('disabled');
            }

            // Handle the email row.
            if (!payemail.value.trim().match(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)) {
                // That's the same regexp used by input type="email".
                valid = false;
                if (document.activeElement !== payemail && hasBeenFocused[payemail.name])
                    errors.push('Please provide a valid email address.');
            }
            if (payFormState === 'processing' || payFormState === 'accepted') {
                payemail.setAttribute('disabled', 'disabled');
            } else {
                payemail.removeAttribute('disabled');
            }

            // Handle the address, city, state, and zip code fields.
            if (payaddress) {
                if (payaddress.value.trim() === '') {
                    valid = false;
                    if (document.activeElement !== payaddress && hasBeenFocused[payaddress.name])
                        errors.push('Please provide your mailing address.');
                }
                if (payFormState === 'processing' || payFormState === 'accepted') {
                    payaddress.setAttribute('disabled', 'disabled');
                } else {
                    payaddress.removeAttribute('disabled');
                }

                if (paycity.value.trim() === '') {
                    valid = false;
                    if (document.activeElement !== paycity && hasBeenFocused[paycity.name])
                        errors.push('Please provide your mailing address city.');
                }
                if (payFormState === 'processing' || payFormState === 'accepted') {
                    paycity.setAttribute('disabled', 'disabled');
                } else {
                    paycity.removeAttribute('disabled');
                }

                if (payFormState === 'processing' || payFormState === 'accepted') {
                    paystate.setAttribute('disabled', 'disabled');
                } else {
                    paystate.removeAttribute('disabled');
                }

                if (!payzip.value.trim().match(/^[0-9]{5}(?:-[0-9]{4})?$/)) {
                    valid = false;
                    if (document.activeElement !== payzip && hasBeenFocused[payzip.name])
                        errors.push('Please provide your 5- or 9-digit zip code.');
                }
                if (payFormState === 'processing' || payFormState === 'accepted') {
                    payzip.setAttribute('disabled', 'disabled');
                } else {
                    payzip.removeAttribute('disabled');
                }
            }

            // Handle the card number.
            if (cardError) {
                valid = false;
                errors.push(cardError);
            } else if (!cardComplete) {
                valid = false;
                if (!cardFocused && hasBeenFocused.card)
                    errors.push(cardError || 'Please provide your payment card information.');
            }
            if (payFormState === 'processing' || payFormState === 'accepted') {
                card.update({ disabled: true });
            } else {
                card.update({ disabled: false });
            }
        }

        // Fill in the message area.
        if (errors.length) {
            paymessage.style.display = 'block';
            paymessage.textContent = errors.join('\n');
            paymessage.className = 'pay-message-bad';
            valid = false;
        } else if (payFormState === 'processing') {
            paymessage.textContent = 'Processing, please wait...'
            paymessage.className = '';
            paymessage.style.display = 'block';
        } else if (payFormState === 'rejected') {
            paymessage.className = 'pay-message-bad';
            paymessage.style.display = 'block';
            paymessage.textContent = message || 'We apologize that we are unable to process your payment at this time.  Please try again later, or call the Schola Cantorum office at 650-254‑1700.';
        } else if (payFormState === 'accepted') {
            paymessage.className = 'pay-message-good';
            paymessage.style.display = 'block';
            paymessage.textContent = 'Thank you.  We have received your payment and emailed you a confirmation.';
        } else {
            paymessage.style.display = 'none';
        }

        // Set the submit button state.
        if (orderDetails.donate) {
            paybutton.textContent = 'Donate $' + orderDetails.total;
        } else if (orderDetails.total !== 0) {
            paybutton.textContent = 'Pay $' + orderDetails.total;
        } else {
            paybutton.textContent = 'Pay Now';
        }
        switch (payFormState) {
            case 'entry':
                if (valid) {
                    payapple.style.display = 'block';
                    paybutton.removeAttribute('disabled');
                    if (applepaybutton) applepaybutton.update({ disabled: true });
                    break;
                } // else fall through
            case 'processing':
            case 'rejected':
                payapple.style.display = 'block';
                paybutton.setAttribute('disabled', 'disabled');
                if (applepaybutton) applepaybutton.update({ disabled: true });
                break;
            case 'accepted':
                payapple.style.display = 'none';
                break;
        }

        // Set the cancel button state.
        switch (payFormState) {
            case 'entry':
            case 'rejected':
                paycancel.textContent = 'Cancel';
                paycancel.removeAttribute('disabled');
                break;
            case 'processing':
                paycancel.textContent = 'Cancel';
                paycancel.setAttribute('disabled', 'disabled');
                break;
            case 'accepted':
                paycancel.textContent = 'Close';
                paycancel.removeAttribute('disabled');
                break;
        }
    }

    // When a required field loses focus, we set a flag indicating that errors
    // for it being empty should be enabled.
    function enableEmptyErrors(evt) {
        if (evt.relatedTarget === paycancel) return; // don't block canceling the dialog
        hasBeenFocused[evt.target.name] = true;
        setFormState();
    }

    // Common parts of the two sendToServer functions.
    function sendToServer(params, success, failure) {
        if (orderDetails.donate) {
            params.donation = orderDetails.donate;
            params.total = orderDetails.donate;
        } else {
            params.donation = orderDetails.addDonate;
            params.product = orderDetails.effectiveProduct;
            params.quantity = orderDetails.qty;
            if (paycoupon) params.coupon = paycoupon.value.trim().toUpperCase();
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
            name: payname.value,
            email: payemail.value,
            payType: 'cardEntry',
            paySource: sourceID,
        }
        if (payaddress) {
            params.address = payaddress.value;
            params.city = paycity.value;
            params.state = paystate.value;
            params.zip = payzip.value;
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
            payType: canMakePayment.applePay ? 'applePay' : 'paymentAPI',
            paySource: pay.source.id,
        };
        if (pay.shippingAddress) {
            params.address = pay.shippingAddress.addressLine.join(', ');
            params.city = pay.shippingAddress.city;
            params.state = pay.shippingAddress.region;
            params.zip = pay.shippingAddress.postalCode;
        }
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
            cardError = evt.error.message;
        } else {
            cardError = null;
        }
        cardComplete = evt.complete;
        setFormState();
    }

    // Handle the card number field's loss of focus.
    function onCardEntryFocus(evt) { cardFocused = true; setFormState(); }
    function onCardEntryBlur(evt) { cardFocused = false; hasBeenFocused.card = true; setFormState(); }

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
        var params = {
            owner: {
                name: payname.value,
                email: payemail.value,
            }
        };
        if (payaddress) {
            params.owner.address = {
                line1: payaddress.value,
                city: paycity.value,
                state: paystate.value,
                postal_code: payzip.value,
                country: 'US',
            };
        };
        stripe.createSource(card, params).then(function (result) {
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
        setFormState();
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
    var applepaybutton;
    function setApplePayButton() {
        var apdiv = document.getElementById('applepaydiv');
        var args = { paymentRequest: paymentRequest };
        if (apdiv) {
            args.style = { paymentRequestButton: { type: 'donate' } };
        } else {
            apdiv = payapple;
        }
        applepaybutton = elements.create('paymentRequestButton', args);
        applepaybutton.mount(apdiv);
        applepaybutton.on('click', function (evt) {
            if (!updatePaymentRequest())
                evt.preventDefault();
        })
    }

    // Set up the card entry field on the form.
    var stripe = Stripe('{{ .Site.Params.stripeKey }}');
    var elements = stripe.elements();
    var card = { style: { base: { fontSize: '16px' } } };
    if (payaddress) card.hidePostalCode = true;
    card = elements.create('card', card);
    card.mount('#pay-card');
    card.on('change', onCardEntryChange);
    card.on('focus', onCardEntryFocus);
    card.on('blur', onCardEntryBlur);

    // Set event handlers on the other fields, to set the form state.
    if (payqty) {
        payqty.addEventListener('input', setFormState);
        payqty.addEventListener('focusin', function () { payqty.select(); });
        payqty.addEventListener('focusout', setFormState);
        $('#pay-dialog').on('shown.bs.modal', function () { payqty.select(); payqty.focus(); });
    } else {
        $('#pay-dialog').on('shown.bs.modal', function () { payname.focus(); });
    }
    if (paycoupon) {
        paycoupon.addEventListener('input', setFormState);
        paycoupon.addEventListener('focusout', setFormState);
    }
    if (paydonate) {
        paydonate.addEventListener('input', setFormState);
        paydonate.addEventListener('focusout', setFormState);
    }
    payname.addEventListener('input', setFormState);
    payname.addEventListener('focusout', enableEmptyErrors);
    payemail.addEventListener('input', setFormState);
    payemail.addEventListener('focusout', enableEmptyErrors);
    if (payaddress) {
        payaddress.addEventListener('input', setFormState);
        payaddress.addEventListener('focusout', enableEmptyErrors);
        paycity.addEventListener('input', setFormState);
        paycity.addEventListener('focusout', enableEmptyErrors);
        paystate.addEventListener('change', setFormState);
        payzip.addEventListener('input', setFormState);
        payzip.addEventListener('focusout', enableEmptyErrors);
    }
    payform.addEventListener('submit', onPayFormSubmit);
    paycancel.addEventListener('click', function () { $('#pay-dialog').modal('hide'); })

    // Find out whether the payment request API is supported.
    paymentRequest = {
        country: 'US', currency: 'usd',
        total: { amount: 100, label: 'Test', pending: true },
        requestPayerName: true, requestPayerEmail: true,
    };
    if (payaddress) {
        paymentRequest.requestShipping = true;
        paymentRequest.shippingOptions = [{ id: 'default', label: 'U.S. Mail', amount: 0 }];
    }
    paymentRequest = stripe.paymentRequest(paymentRequest);
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
        hasBeenFocused = {};
        cardComplete = false;
        cardError = null;
        cardFocused = false;
        if (payqty) payqty.value = '1';
        if (paycoupon) {
            paycoupon.value = '';
            paycouponrow.style.display = 'flex';
            paydiscountrow.style.display = 'none';
        }
        if (paydonate) paydonate.value = '';
        if (canMakePayment) {
            if (paydivider) paydivider.style.display = 'none';
            paycardpmt.style.display = 'none';
        } else {
            if (paydivider) paydivider.style.display = 'block';
            paycardpmt.style.display = 'block';
            payname.value = '';
            payemail.value = '';
            if (payaddress) {
                payaddress.value = '';
                paycity.value = '';
                paystate.value = 'CA';
                payzip.value = '';
            }
            card.clear();
        }
        setFormState();

        // Set seed data.
        paytitle.textContent = args.title;
        payitem.textContent = args.description;

        // Launch the modal dialog.
        $('#pay-dialog').modal({ backdrop: 'static' });
    };

});

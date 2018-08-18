window.addEventListener('load', function () {
    var orderforms = document.getElementsByClassName('orderform');
    if (orderforms.length > 0) {
        // var stripe = Stripe('pk_test_QPwvhWbGaakWn7DGcco8J5Nd');
        var stripe = Stripe('pk_live_UlmbLJo2rx9WQyhVibmTWpxa');
        var elements = stripe.elements();
        var payform = document.getElementById('pay-form');
        var card = elements.create('card', { hidePostalCode: true, style: { base: { fontSize: '16px' } } })
        var errorDiv = document.getElementById('pay-error');
        var confirmDiv = document.getElementById('pay-confirm');
        var payButton = document.getElementById('pay-button');
        var payCancel = document.getElementById('pay-cancel');
        card.addEventListener('change', function (evt) {
            if (evt.error) {
                errorDiv.textContent = evt.error.message;
            } else {
                errorDiv.textContent = '';
            }
        });
        card.mount('#pay-card');
        for (var i = 0; i < orderforms.length; i++) {
            var orderform = orderforms[i];
            orderform.addEventListener('submit', function (evt) {
                evt.preventDefault();
                orderform = evt.target;
                var oproduct = orderform.product.value;
                var odesc = orderform.desc.value;
                var oqty = parseInt(orderform.qty.value);
                var oprice = parseInt(orderform.price.value);
                if (oproduct.substr(0, 13) === 'subscription.') {
                    if (isNaN(oqty) || oqty < 1) {
                        return;
                    }
                    document.getElementById('pay-title').textContent = 'Subscription Order';
                    if (oqty > 1) {
                        document.getElementById('pay-desc').innerHTML = odesc + 's <span id="pay-calc">(' + oqty + ' at $' + oprice + ' each)</span>';
                    } else {
                        document.getElementById('pay-desc').innerText = odesc;
                    }
                    document.getElementById('pay-total').textContent = '$' + (oqty * oprice);
                    payform.qty.value = oqty;
                    payform.product.value = oproduct;
                } else if (oproduct.substr(0, 7) === 'ticket.') {
                    if (isNaN(oqty) || oqty < 1) {
                        return;
                    }
                    document.getElementById('pay-title').textContent = 'Ticket Order';
                    if (oqty > 1) {
                        document.getElementById('pay-desc').innerHTML = odesc + ' <span id="pay-calc">(' + oqty + ' at $' + oprice + ' each)</span>';
                    } else {
                        document.getElementById('pay-desc').innerText = odesc;
                    }
                    document.getElementById('pay-total').textContent = '$' + (oqty * oprice);
                    payform.qty.value = oqty;
                    payform.product.value = oproduct;
                } else if (oproduct === 'donation') {
                    if (isNaN(oqty) || oqty < 1) {
                        return;
                    }
                    document.getElementById('pay-title').textContent = 'Donation';
                    document.getElementById('pay-desc').innerText = 'Donation';
                    document.getElementById('pay-total').textContent = '$' + oqty;
                    payform.qty.value = oqty;
                    payform.product.value = oproduct;
                }
                payButton.style.display = 'inline';
                payCancel.textContent = 'Cancel';
                confirmDiv.textContent = '';
                errorDiv.textContent = '';
                $('#paydialog').modal({ backdrop: 'static' });
            });
        }
        payform.addEventListener('submit', function (evt) {
            evt.preventDefault();
            stripe.createSource(card, {
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
                    errorDiv.textContent = result.error.message;
                } else {
                    payform.token.value = result.source.id;
                    fetch('/orders/to-stripe', {
                        body: new FormData(payform),
                        method: "POST",
                    }).then(function (result) {
                        if (result.ok) {
                            confirmDiv.textContent = 'Thank you.  We have received your payment and emailed you a confirmation.';
                            payButton.style.display = 'none';
                            payCancel.textContent = 'Close';
                        } else if (result.status === 400) {
                            result.text().then(function (err) {
                                errorDiv.textContent = err;
                            })
                        } else {
                            errorDiv.textContent = 'We apologize that we are unable to process your payment at this time.  Please try again later, or call the Schola Cantorum office at 650-254-1700.';
                        }
                    }).catch(function (err) {
                        errorDiv.textContent = 'We apologize that we are unable to process your payment at this time.  Please try again later, or call the Schola Cantorum office at 650-254-1700.';
                    })
                }
            });
        });
    }

    var physmailform = document.getElementById('physmailform');
    if (physmailform) {
        physmailform.addEventListener('submit', function (evt) {
            evt.preventDefault();
            var submit = document.getElementById('physmailsubmit');
            var confirmDiv = document.getElementById('physmailconfirm');
            var errorDiv = document.getElementById('physmailerror');
            submit.setAttribute('disabled', 'disabled');
            confirmDiv.textContent = '';
            errorDiv.textContent = '';
            fetch('/backend/mail-signup', {
                body: new FormData(physmailform),
                method: 'POST',
            }).then(function (result) {
                if (result.ok) {
                    confirmDiv.textContent = 'Thank you.  We will add you to our list.';
                } else {
                    errorDiv.textContent = 'We apologize that we were unable to store your information.  Please try again later, or call the Schola Cantorum office at (650) 254-1700.';
                    submit.removeAttribute('disabled');
                }
            }).catch(function (err) {
                errorDiv.textContent = 'We apologize that we were unable to store your information.  Please try again later, or call the Schola Cantorum office at (650) 254-1700.';
                submit.removeAttribute('disabled');
            })
        })
    }
});

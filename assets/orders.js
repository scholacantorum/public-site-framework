window.addEventListener('load', function () {
    var orderforms = document.getElementsByClassName('orderform');
    if (orderforms.length > 0) {
        var stripe = Stripe('{{ .Site.Params.stripeKey }}');
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
                var oqty = parseInt(orderform.qty.value);
                if (isNaN(oqty) || oqty < 1) {
                    return;
                }
                document.getElementById('pay-title').textContent = 'Donation';
                document.getElementById('pay-desc').innerText = 'Donation';
                document.getElementById('pay-total').textContent = '$' + oqty;
                payform.qty.value = oqty;
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
                    var params = {
                        name: payform.name.value,
                        email: payform.email.value,
                        address: payform.address.value,
                        city: payform.city.value,
                        state: payform.state.value,
                        zip: payform.zip.value,
                        donation: parseInt(payform.qty.value),
                        total: parseInt(payform.qty.value),
                        paySource: result.source.id,
                    }
                    fetch('/backend/to-stripe', {
                        body: JSON.stringify(params),
                        headers: {
                            'Content-Type': 'application/json',
                        },
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
});

window.addEventListener('load', function () {
    var orderforms = document.getElementsByClassName('orderform');
    if (orderforms.length === 0)
        return;

    var payform = document.getElementById('pay-form');
    var errorDiv = document.getElementById('pay-error');
    var confirmDiv = document.getElementById('pay-confirm');
    var payButton = document.getElementById('pay-button');
    var payCancel = document.getElementById('pay-cancel');
    var payDetails;
    var payFormState;

    function setPayFormState(state, message) {
        switch (state) {
            case 'inputerr':
                if (payFormState !== 'idle' && payFormState !== 'inputerr')
                    return; // disregard input changes during/after processing
                if (message) {
                    payButton.style.display = 'inline';
                    payButton.removeAttribute('disabled');
                    payCancel.textContent = 'Cancel';
                    payCancel.removeAttribute('disabled');
                    confirmDiv.textContent = '';
                    errorDiv.textContent = message;
                    break;
                }
                state = 'idle'; // and fall through
            case 'idle':
                payButton.style.display = 'inline';
                payButton.removeAttribute('disabled');
                payCancel.textContent = 'Cancel';
                payCancel.removeAttribute('disabled');
                confirmDiv.textContent = '';
                errorDiv.textContent = '';
                break;
            case 'processing':
                payButton.style.display = 'inline';
                payButton.setAttribute('disabled', 'disabled');
                payCancel.textContent = 'Cancel';
                payCancel.setAttribute('disabled', 'disabled');
                confirmDiv.textContent = 'Processing, please wait...';
                errorDiv.textContent = '';
                break;
            case 'rejected':
                payButton.style.display = 'inline';
                payButton.removeAttribute('disabled');
                payCancel.textContent = 'Cancel';
                payCancel.removeAttribute('disabled');
                confirmDiv.textContent = '';
                if (!message) {
                    message = 'We apologize that we are unable to process your payment at this time.  Please try again later, or call the Schola Cantorum office at 650-254-1700.';
                }
                errorDiv.textContent = message;
                break;
            case 'accepted':
                payButton.style.display = 'none';
                payButton.setAttribute('disabled', 'disabled');
                payCancel.textContent = 'Close';
                payCancel.removeAttribute('disabled');
                confirmDiv.textContent = 'Thank you.  We have received your payment and emailed you a confirmation.';
                errorDiv.textContent = '';
                break;
        }
        payFormState = state;
    }

    var stripe = Stripe('{{ .Site.Params.stripeKey }}');
    var elements = stripe.elements();
    var card = elements.create('card', { hidePostalCode: true, style: { base: { fontSize: '16px' } } })
    card.addEventListener('change', function (evt) {
        if (evt.error) {
            setPayFormState('inputerr', evt.error.message)
        } else {
            setPayFormState('inputerr');
        }
    });
    card.mount('#pay-card');

    function getPayment(title, description, amount, details) {
        document.getElementById('pay-title').textContent = title;
        document.getElementById('pay-desc').innerText = description;
        document.getElementById('pay-total').textContent = '$' + amount;
        payform.name.value = '';
        payform.email.value = '';
        payform.address.value = '';
        payform.city.value = '';
        payform.state.value = '';
        payform.zip.value = '';
        card.clear();
        payDetails = details;
        setPayFormState('idle');
        $('#paydialog').modal({ backdrop: 'static' });
    }

    function sendToServer(sourceID) {
        var params = $.extend({
            name: payform.name.value,
            email: payform.email.value,
            address: payform.address.value,
            city: payform.city.value,
            state: payform.state.value,
            zip: payform.zip.value,
            paySource: sourceID,
        }, payDetails);
        fetch('/backend/to-stripe', {
            body: JSON.stringify(params),
            headers: { 'Content-Type': 'application/json' },
            method: "POST",
        }).then(function (result) {
            if (result.ok) {
                setPayFormState('accepted');
            } else if (result.status === 400) {
                result.text().then(function (err) {
                    setPayFormState('rejected', err);
                })
            } else {
                setPayFormState('rejected');
            }
        }).catch(function (err) {
            setPayFormState('rejected');
        })
    }

    payform.addEventListener('submit', function (evt) {
        evt.preventDefault();
        if (!payform.name.value || !payform.email.value || !payform.address.value || !payform.city.value || !payform.state.value ||
            !payform.zip.value) {
            setPayFormState('inputerr', 'Please fill in all fields.');
            return;
        }
        setPayFormState('processing');
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
                setPayFormState('rejected', result.error.message);
            } else {
                sendToServer(result.source.id);
            }
        });
    });

    var donationform = document.getElementById('donationform');
    if (donationform) {
        donationform.addEventListener('submit', function (evt) {
            evt.preventDefault();
            var amount = parseInt(donationform.amount.value);
            if (isNaN(amount) || amount < 1) {
                return;
            }
            getPayment('Donation', 'Donation', amount, {
                donation: amount,
                total: amount,
            });
        });
    }

});

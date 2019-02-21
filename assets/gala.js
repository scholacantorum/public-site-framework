window.addEventListener('load', function () {
    var galaForm = document.getElementById('galaForm');
    if (!galaForm) return;

    // References to all of the form controls and divs.
    var galaQty = document.getElementById('galaQty');
    var galaQtyText = document.getElementById('galaQtyText');
    var galaQtyAmount = document.getElementById('galaQtyAmount');
    var galaQtyError = document.getElementById('galaQtyError');
    var galaGuestList = document.getElementById('galaGuestList');
    var hostName = document.getElementById('hostName');
    var hostEmail = document.getElementById('hostEmail');
    var hostAddress = document.getElementById('hostAddress');
    var hostCity = document.getElementById('hostCity');
    var hostState = document.getElementById('hostState');
    var hostZip = document.getElementById('hostZip');
    var galaHostError = document.getElementById('galaHostError');
    var galaPaymentCardError = document.getElementById('galaPaymentCardError');
    var galaCardSource = document.getElementById('galaCardSource');
    var galaButtons = document.getElementById('galaButtons');
    var galaSubmit = document.getElementById('galaSubmit');
    var galaConfirm = document.getElementById('galaConfirm');
    var galaPaymentError = document.getElementById('galaPaymentError');

    // Form data.
    var qty = 1;
    var qtyValid = true;
    var namePresent = false;
    var emailPresent = false;
    var emailValid = false;
    var addressPresent = false;
    var cityPresent = false;
    var statePresent = false
    var stateValid = false;
    var zipPresent = false;
    var zipValid = false;
    var cardError = null;
    var cardComplete = false;
    var submitted = false;
    var paymentError = null;

    // Update the state of the form based on the form data.
    function updateForm(submitting) {
        var valid = true;

        // Update the quantity row.
        if (!qtyValid) {
            galaQty.classList.add('galaErrorBorder');
            galaQtyText.textContent = 'seats';
            galaQtyAmount.textContent = '';
            galaQtyError.style.display = 'inline-block';
            valid = false;
        } else {
            galaQty.classList.remove('galaErrorBorder');
            galaQtyError.style.display = 'none';
            galaQtyAmount.textContent = '$' + (165*qty);
            if (qty > 1) {
                galaQtyText.textContent = 'seats at\u00A0$165\u00A0each';
            } else {
                galaQtyText.textContent = 'seat';
            }
        }

        // Ensure the proper number of guest lines.
        if (qtyValid) {
            for (var i = 2; i <= qty; i++) {
                var div = document.getElementById('guest'+i);
                if (div) {
                    div.style.display = 'flex';
                } else {
                    div = document.createElement('div');
                    div.id = 'guest' + i;
                    div.className = 'galaGuest';
                    var head = document.createElement('div');
                    head.className = 'galaGuestHead';
                    head.textContent = 'Guest #' + (i-1);
                    div.appendChild(head);
                    var input = document.createElement('input');
                    input.id = 'guestName' + i;
                    input.name = 'name' + i;
                    input.className = 'galaGuestName form-control';
                    input.setAttribute('placeholder', 'Name (if known)');
                    div.appendChild(input);
                    input = document.createElement('input');
                    input.id = 'guestEmail' + i;
                    input.name = 'email' + i;
                    input.className = 'galaGuestEmail form-control';
                    input.setAttribute('placeholder', 'Email (if known)');
                    div.appendChild(input);
                    galaGuestList.appendChild(div);
                }
            }
            for (var i = qty+1; ; i++) {
                var div = document.getElementById('guest'+i);
                if (!div) break;
                div.style.display = 'none';
            }
        }

        // Ensure the presence of the name and email and validity of the email.
        if (submitted && (!namePresent || !emailPresent || !emailValid || !addressPresent || !cityPresent || !statePresent
            || !stateValid || !zipPresent || !zipValid)) {
            galaHostError.style.display = 'block';
            valid = false;
        } else {
            galaHostError.style.display = 'none';
        }
        if (emailPresent && !emailValid) {
            galaHostError.textContent = 'Please provide a valid email address.'
        } else if (statePresent && !stateValid) {
            galaHostError.textContext = 'Please provide a valid two-letter state code.'
        } else if (zipPresent && !zipValid) {
            galaHostError.textContent = 'Please provide a valid nine-digit zip code.'
        } else {
            galaHostError.textContent = 'Please provide your name and addresses.'
        }
        if (submitted && !namePresent) {
            hostName.classList.add('galaErrorBorder');
        } else {
            hostName.classList.remove('galaErrorBorder');
        }
        if (submitted && (!emailPresent || !emailValid)) {
            hostEmail.classList.add('galaErrorBorder');
        } else {
            hostEmail.classList.remove('galaErrorBorder');
        }
        if (submitted && !addressPresent) {
            hostAddress.classList.add('galaErrorBorder');
        } else {
            hostAddress.classList.remove('galaErrorBorder');
        }
        if (submitted && !cityPresent) {
            hostCity.classList.add('galaErrorBorder');
        } else {
            hostCity.classList.remove('galaErrorBorder');
        }
        if (submitted && (!statePresent || !stateValid)) {
            hostState.classList.add('galaErrorBorder');
        } else {
            hostState.classList.remove('galaErrorBorder');
        }
        if (submitted && (!zipPresent || !zipValid)) {
            hostZip.classList.add('galaErrorBorder');
        } else {
            hostZip.classList.remove('galaErrorBorder');
        }

        // Ensure the completeness and validity of the payment card.
        if (cardError) {
            galaPaymentCardError.style.display = 'block';
            galaPaymentCardError.textContent = cardError;
            valid = false;
        } else if (!cardComplete && submitted) {
            galaPaymentCardError.style.display = 'block';
            galaPaymentCardError.textContent = 'Please provide your payment card information.';
            valid = false;
        } else {
            galaPaymentCardError.style.display = 'none';
        }

        if (paymentError) {
            galaPaymentError.style.display = 'block';
            galaPaymentError.textContent = paymentError;
            valid = false;
        } else {
            galaPaymentError.style.display = 'none';
        }

        if (!submitting || !valid) {
            galaSubmit.removeAttribute('disabled');
            galaProcessing.textContent = '';
            return valid;
        }
        galaSubmit.setAttribute('disabled', 'disabled');
        galaProcessing.textContent = 'Processing...';
        return true;
    }

    galaQty.addEventListener('input', function() {
        var tryqty = galaQty.value.replace(/[^0-9]/, '').replace(/^0*/, '');
        galaQty.value = tryqty;
        if (tryqty === '') {
            qtyValid = false;
        } else {
            qtyValid = true;
            qty = parseInt(tryqty);
        }
        updateForm();
    })

    hostName.addEventListener('input', function() {
        namePresent = hostName.value.trim() !== '';
        updateForm();
    });
    hostEmail.addEventListener('input', function() {
        emailPresent = hostEmail.value.trim() !== '';
        updateForm();
    });
    hostEmail.addEventListener('change', function() {
        emailValid = hostEmail.value.trim().match(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/);
        // That's the same regexp used by input type="email".
        updateForm();
    });
    hostAddress.addEventListener('input', function() {
        addressPresent = hostAddress.value.trim() !== '';
        updateForm();
    });
    hostCity.addEventListener('input', function() {
        cityPresent = hostCity.value.trim() !== '';
        updateForm();
    });
    hostState.addEventListener('input', function() {
        statePresent = hostState.value.trim() !== '';
        updateForm();
    });
    hostState.addEventListener('change', function() {
        hostState.value = hostState.value.toUpperCase()
        stateValid = hostState.value.trim().match(/^[A-Z][A-Z]$/);
        updateForm();
    });
    hostZip.addEventListener('input', function() {
        zipPresent = hostZip.value.trim() !== '';
        updateForm();
    });
    hostZip.addEventListener('change', function() {
        zipValid = hostZip.value.trim().match(/^[0-9]{5}$/);
        updateForm();
    });

    var stripe = Stripe('{{ .Site.Params.stripeKey }}');
    var elements = stripe.elements();
    var card = { style: { base: { fontSize: '16px' } }, hidePostalCode: true };
    card = elements.create('card', card);
    card.mount('#galaPaymentCard');
    card.on('change', function(evt) {
        cardError = evt.error ? evt.error.message : null;
        cardComplete = evt.complete;
        updateForm();
    });

    galaForm.addEventListener('submit', function(evt) {
        evt.preventDefault();
        submitted = true;
        paymentError = false;
        if (!updateForm(true)) return;
        stripe.createSource(card, {
            owner: {
                name: hostName.value.trim(),
                email: hostEmail.value.trim(),
                address: {
                    line1: hostAddress.value.trim(),
                    city: hostCity.value.trim(),
                    state: hostState.value.trim(),
                    postal_code: hostZip.value.trim()
                }
            }
        }).then(function (result) {
            if (result.error) {
                paymentError = result.error.message;
                updateForm();
            } else {
                galaCardSource.value = result.source.id;
                var data = new FormData(galaForm);
                fetch('http://localhost:9000/register', {
                    method: 'POST',
                    body: data
                }).then(function(result) {
                    switch (result.status) {
                    case 204:
                        galaButtons.style.display = 'none';
                        galaConfirm.style.display = 'block';
                        break;
                    case 400:
                        result.text().then(function(text) {
                            paymentError = text;
                            updateForm();
                        })
                        break;
                    default:
                        console.error(result.statusText);
                        paymentError = 'We apologize that we are unable to process your payment at this time.  Please try again later, or call the Schola Cantorum office at 650-254‑1700.';
                        updateForm();
                    }
                }).catch(function(err) {
                    console.error(err);
                    paymentError = 'We apologize that we are unable to process your payment at this time.  Please try again later, or call the Schola Cantorum office at 650-254‑1700.';
                    updateForm();
                });
            }
        });
    });

    galaQty.value = 1;
    updateForm();
});

window.addEventListener('load', function () {
    var galaForm = document.getElementById('galaForm');
    if (!galaForm) return;

    // References to all of the form controls and divs.
    var galaQty = document.getElementById('galaQty');
    var galaQtyText = document.getElementById('galaQtyText');
    var galaQtyAmount = document.getElementById('galaQtyAmount');
    var galaQtyError = document.getElementById('galaQtyError');
    var galaGuestList = document.getElementById('galaGuestList');
    var guestName1 = document.getElementById('guestName1');
    var guestEmail1 = document.getElementById('guestEmail1');
    var galaGuestError = document.getElementById('galaGuestError');
    var galaPaymentCardError = document.getElementById('galaPaymentCardError');
    var galaCardSource = document.getElementById('galaCardSource');
    var galaSaveYes1 = document.getElementById('galaSaveYes1');
    var galaSaveNo1 = document.getElementById('galaSaveNo1');
    var galaSaveError1 = document.getElementById('galaSaveError1');
    var galaSave1 = document.getElementById('galaSave1');
    var galaSaveGuests = document.getElementById('galaSaveGuests');
    var galaSaveYes2 = document.getElementById('galaSaveYes2');
    var galaSaveNo2 = document.getElementById('galaSaveNo2');
    var galaSaveError2 = document.getElementById('galaSaveError2');
    var galaSave2 = document.getElementById('galaSave2');
    var galaSaveViewDetails = document.getElementById('galaSaveViewDetails');
    var galaSaveSafetyDetails = document.getElementById('galaSaveSafetyDetails');
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
    var cardError = null;
    var cardComplete = false;
    var saveSelf = null;
    var saveGuests = null;
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
                    head.textContent = 'Guest #' + i;
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
        if (submitted && (!namePresent || !emailPresent || !emailValid)) {
            galaGuestError.style.display = 'block';
            valid = false;
        } else {
            galaGuestError.style.display = 'none';
        }
        if (!namePresent && !emailPresent) {
            galaGuestError.textContent = 'Please provide your name and email address.';
        } else if (!namePresent && !emailValid) {
            galaGuestError.textContext = 'Please provide your name and a valid email address.';
        } else if (!namePresent) {
            galaGuestError.textContent = 'Please provide your name.';
        } else if (!emailPresent) {
            galaGuestError.textContent = 'Please provide your email address.';
        } else {
            galaGuestError.textContent = 'Please provide a valid email address.';
        }
        if (submitted && !namePresent) {
            guestName1.classList.add('galaErrorBorder');
        } else {
            guestName1.classList.remove('galaErrorBorder');
        }
        if (submitted && (!emailPresent || !emailValid)) {
            guestEmail1.classList.add('galaErrorBorder');
        } else {
            guestEmail1.classList.remove('galaErrorBorder');
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

        // Show or hide the saveGuests line based on quantity.  Mark the
        // selected options.
        if (qtyValid) {
            galaSaveGuests.style.display = (qty > 1) ? 'flex' : 'none';
        }
        if (saveSelf === true) {
            galaSaveYes1.classList.add('galaSaveSelected');
            galaSaveNo1.classList.remove('galaSaveSelected');
            galaSave1.value = 'true';
        } else if (saveSelf === false) {
            galaSaveYes1.classList.remove('galaSaveSelected');
            galaSaveNo1.classList.add('galaSaveSelected');
            galaSave1.value = 'false';
        }
        if (saveGuests === true) {
            galaSaveYes2.classList.add('galaSaveSelected');
            galaSaveNo2.classList.remove('galaSaveSelected');
            galaSave2.value = 'true';
        } else if (saveGuests === false) {
            galaSaveYes2.classList.remove('galaSaveSelected');
            galaSaveNo2.classList.add('galaSaveSelected');
            galaSave2.value = 'false';
        }
        if (submitted && saveSelf === null) {
            galaSaveError1.style.display = 'block';
            galaSaveYes1.classList.add('galaErrorBorder');
            galaSaveNo1.classList.add('galaErrorBorder');
            valid = false;
        } else {
            galaSaveError1.style.display = 'none';
            galaSaveYes1.classList.remove('galaErrorBorder');
            galaSaveNo1.classList.remove('galaErrorBorder');
        }
        if (submitted && qtyValid && qty > 1 && saveGuests === null) {
            galaSaveError2.style.display = 'block';
            galaSaveYes2.classList.add('galaErrorBorder');
            galaSaveNo2.classList.add('galaErrorBorder');
            valid = false;
        } else {
            galaSaveError2.style.display = 'none';
            galaSaveYes2.classList.remove('galaErrorBorder');
            galaSaveNo2.classList.remove('galaErrorBorder');
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

    guestName1.addEventListener('input', function() {
        namePresent = guestName1.value.trim() !== '';
        updateForm();
    });
    guestEmail1.addEventListener('input', function() {
        emailPresent = guestEmail1.value.trim() !== '';
        updateForm();
    });
    guestEmail1.addEventListener('change', function() {
        emailValid = guestEmail1.value.trim().match(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/);
        // That's the same regexp used by input type="email".
        updateForm();
    });

    var stripe = Stripe('{{ .Site.Params.stripeKey }}');
    var elements = stripe.elements();
    var card = { style: { base: { fontSize: '16px' } } };
    card = elements.create('card', card);
    card.mount('#galaPaymentCard');
    card.on('change', function(evt) {
        cardError = evt.error ? evt.error.message : null;
        cardComplete = evt.complete;
        updateForm();
    });

    function galaSaveFocusHandler(evt) {
        galaSaveYes1.style.zIndex = 0;
        galaSaveNo1.style.zIndex = 0;
        galaSaveYes2.style.zIndex = 0;
        galaSaveNo2.style.zIndex = 0;
        evt.target.style.zIndex = 1;
    }
    galaSaveYes1.addEventListener('click', function(evt) { evt.preventDefault(); saveSelf = true; updateForm(); });
    galaSaveNo1.addEventListener('click', function(evt) { evt.preventDefault(); saveSelf = false; updateForm(); });
    galaSaveYes2.addEventListener('click', function(evt) { evt.preventDefault(); saveGuests = true; updateForm(); });
    galaSaveNo2.addEventListener('click', function(evt) { evt.preventDefault(); saveGuests = false; updateForm(); });
    galaSaveYes1.addEventListener('focus', galaSaveFocusHandler);
    galaSaveNo1.addEventListener('focus', galaSaveFocusHandler);
    galaSaveYes2.addEventListener('focus', galaSaveFocusHandler);
    galaSaveNo2.addEventListener('focus', galaSaveFocusHandler);
    galaSaveViewDetails.addEventListener('click', function(evt) {
        evt.preventDefault();
        galaSaveSafetyDetails.style.display = 'block';
    });

    galaForm.addEventListener('submit', function(evt) {
        evt.preventDefault();
        submitted = true;
        paymentError = false;
        if (!updateForm(true)) return;
        stripe.createSource(card, {
            owner: {
                name: guestName1.value.trim(),
                email: guestEmail1.value.trim(),
            }
        }).then(function (result) {
            if (result.error) {
                paymentError = result.error.message;
                updateForm();
            } else {
                galaCardSource.value = result.source.id;
                var data = new FormData(galaForm);
                fetch('https://gala.scholacantorum.org/backend/ticket', {
                    method: 'POST',
                    body: data
                }).then(function(result) {
                    switch (result.status) {
                    case 200:
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

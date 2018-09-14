window.addEventListener('load', function () {
    var mondonform = document.getElementById('mondon-form');
    if (!mondonform) return;

    // References to all of the form controls and divs.
    var mondonamount = document.getElementById('mondon-amount');
    var mondoncount = document.getElementById('mondon-count');
    var mondonlastdate = document.getElementById('mondon-last-date');
    var mondonname = document.getElementById('mondon-name');
    var mondonemail = document.getElementById('mondon-email');
    var mondonaddress = document.getElementById('mondon-address');
    var mondoncity = document.getElementById('mondon-city');
    var mondonstate = document.getElementById('mondon-state');
    var mondonzip = document.getElementById('mondon-zip');
    var mondonbutton = document.getElementById('mondon-button');
    var mondonmessage = document.getElementById('mondon-message');

    // mondonFormState records the state of the form: "entry", "processing", or
    // "rejected", or "accepted".
    var mondonFormState = 'entry';

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

    // Set the message and the state and labels of the buttons appropriately for
    // the state of the form.
    function setFormState(state, message) {

        // When we are given a state, that's our new state.  Otherwise, we
        // normally stay in the state we were previously in.  But the "rejected"
        // state is transient, lasting only until the next call of this method.
        if (typeof state === 'string') {
            mondonFormState = state;
        } else if (mondonFormState === 'rejected') {
            mondonFormState = 'entry';
        }

        // Start a new calculation of the form messages and validity.
        var errors = [];
        var valid = true;

        // Handle the amount row.
        var amount = parseInt(mondonamount.value);
        if (isNaN(amount) || amount < 1) {
            valid = false;
            if (document.activeElement !== mondonamount && hasBeenFocused[mondonamount.name])
                errors.push('Please enter a valid donation amount.');
        }
        if (mondonFormState === 'processing' || mondonFormState === 'accepted') {
            mondonamount.setAttribute('disabled', 'disabled');
        } else {
            mondonamount.removeAttribute('disabled');
        }

        // Handle the count row.
        var count = mondoncount.value;
        if (count !== '') {
            count = parseInt(count);
            if (isNaN(count) || count < 1) {
                valid = false;
                if (document.activeElement !== mondoncount)
                    errors.push('Please enter a valid number of months.');
            }
        }
        if (mondonFormState === 'processing' || mondonFormState === 'accepted') {
            mondoncount.setAttribute('disabled', 'disabled');
        } else {
            mondoncount.removeAttribute('disabled');
        }

        // Handle the last date.
        if (count === '' || isNaN(count) || count < 1) {
            mondonlastdate.style.display = 'none';
        } else {
            mondonlastdate.style.display = 'block';
            var date = new Date();
            var year = date.getFullYear();
            var month = date.getMonth() + count - 1;
            var day = date.getDate();
            day = (day > 28 && count > 1) ? 28 : day
            if (month >= 12) { year += Math.floor(month / 12); month %= 12 }
            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
                'November', 'December'];
            mondonlastdate.textContent = 'Last donation on ' + months[month] + ' ' + day + ', ' + year + '.';
        }

        // Handle the name row.
        if (mondonname.value.trim() === '') {
            valid = false;
            if (document.activeElement !== mondonname && hasBeenFocused[mondonname.name])
                errors.push('Please provide your name.');
        }
        if (mondonFormState === 'processing' || mondonFormState === 'accepted') {
            mondonname.setAttribute('disabled', 'disabled');
        } else {
            mondonname.removeAttribute('disabled');
        }

        // Handle the email row.
        if (!mondonemail.value.trim().match(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)) {
            // That's the same regexp used by input type="email".
            valid = false;
            if (document.activeElement !== mondonemail && hasBeenFocused[mondonemail.name])
                errors.push('Please provide a valid email address.');
        }
        if (mondonFormState === 'processing' || mondonFormState === 'accepted') {
            mondonemail.setAttribute('disabled', 'disabled');
        } else {
            mondonemail.removeAttribute('disabled');
        }

        // Handle the address, city, state, and zip code fields.
        if (mondonaddress.value.trim() === '') {
            valid = false;
            if (document.activeElement !== mondonaddress && hasBeenFocused[mondonaddress.name])
                errors.push('Please provide your mailing address.');
        }
        if (mondonFormState === 'processing' || mondonFormState === 'accepted') {
            mondonaddress.setAttribute('disabled', 'disabled');
        } else {
            mondonaddress.removeAttribute('disabled');
        }

        if (mondoncity.value.trim() === '') {
            valid = false;
            if (document.activeElement !== mondoncity && hasBeenFocused[mondoncity.name])
                errors.push('Please provide your mailing address city.');
        }
        if (mondonFormState === 'processing' || mondonFormState === 'accepted') {
            mondoncity.setAttribute('disabled', 'disabled');
        } else {
            mondoncity.removeAttribute('disabled');
        }

        if (mondonFormState === 'processing' || mondonFormState === 'accepted') {
            mondonstate.setAttribute('disabled', 'disabled');
        } else {
            mondonstate.removeAttribute('disabled');
        }

        if (!mondonzip.value.trim().match(/^[0-9]{5}(?:-[0-9]{4})?$/)) {
            valid = false;
            if (document.activeElement !== mondonzip && hasBeenFocused[mondonzip.name])
                errors.push('Please provide your 5- or 9-digit zip code.');
        }
        if (mondonFormState === 'processing' || mondonFormState === 'accepted') {
            mondonzip.setAttribute('disabled', 'disabled');
        } else {
            mondonzip.removeAttribute('disabled');
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
        if (mondonFormState === 'processing' || mondonFormState === 'accepted') {
            card.update({ disabled: true });
        } else {
            card.update({ disabled: false });
        }

        // Set the button visibility.
        mondonbutton.style.display = (mondonFormState === 'accepted') ? 'none' : 'inline-block';

        // Set the button state.
        if (mondonFormState === 'entry' && valid && errors.length === 0) {
            mondonbutton.removeAttribute('disabled');
        } else {
            mondonbutton.setAttribute('disabled', 'disabled');
        }

        // Fill in the message area.
        if (errors.length) {
            mondonmessage.style.display = 'block';
            mondonmessage.textContent = errors.join('\n');
            mondonmessage.className = 'mondon-message-bad';
        } else if (mondonFormState === 'processing') {
            mondonmessage.textContent = 'Processing, please wait...'
            mondonmessage.className = '';
            mondonmessage.style.display = 'block';
        } else if (mondonFormState === 'rejected') {
            mondonmessage.className = 'mondon-message-bad';
            mondonmessage.style.display = 'block';
            mondonmessage.textContent = message || 'We apologize that we are unable to process your donation at this time.  Please try again later, or call the Schola Cantorum office at 650-254‑1700.';
        } else if (mondonFormState === 'accepted') {
            mondonmessage.className = 'mondon-message-good';
            mondonmessage.style.display = 'block';
            mondonmessage.textContent = 'Thank you.  We have started your monthly donation.'
        } else {
            mondonmessage.style.display = 'none';
        }
    }

    // When a required field loses focus, we set a flag indicating that errors
    // for it being empty should be enabled.
    function enableEmptyErrors(evt) {
        hasBeenFocused[evt.target.name] = true;
        setFormState();
    }

    // Common parts of the two sendToServer functions.
    function sendToServer(sourceID) {
        var count = parseInt(mondoncount.value);
        var params = {
            name: mondonname.value,
            email: mondonemail.value,
            address: mondonaddress.value,
            city: mondoncity.value,
            state: mondonstate.value,
            zip: mondonzip.value,
            payType: 'cardEntry',
            paySource: sourceID,
            donation: parseInt(mondonamount.value),
            total: parseInt(mondonamount.value),
            count: isNaN(count) ? -1 : count,
        }
        fetch('/backend/to-stripe', {
            body: JSON.stringify(params),
            headers: { 'Content-Type': 'application/json' },
            method: "POST",
        }).then(function (result) {
            if (result.ok) {
                result.text().then(function (t) {
                    setFormState('accepted');
                    ga('send', 'event', 'order', 'success');
                });
            } else if (result.status === 400) {
                result.text().then(function (err) {
                    ga('send', 'event', 'order', 'backend-reject');
                    setFormState('rejected', err);
                })
            } else {
                ga('send', 'event', 'order', 'backend-failure');
                setFormState('rejected');
            }
        }).catch(function (err) {
            ga('send', 'event', 'order', 'backend-down');
            setFormState('rejected');
        })
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

    // Handle the "Start Donations" button.
    function onMondonFormSubmit(evt) {
        evt.preventDefault();
        setFormState();
        if (mondonbutton.getAttribute('disabled')) return;
        setFormState('processing');
        var params = {
            owner: {
                name: mondonname.value,
                email: mondonemail.value,
                address: {
                    line1: mondonaddress.value,
                    city: mondoncity.value,
                    state: mondonstate.value,
                    postal_code: mondonzip.value,
                    country: 'US'
                }
            }
        };
        stripe.createSource(card, params).then(function (result) {
            if (result.error) {
                setFormState('rejected', result.error.message);
            } else {
                sendToServer(result.source.id);
            }
        });
    }

    // Set up the card entry field on the form.
    var stripe = Stripe('{{ .Site.Params.stripeKey }}');
    var elements = stripe.elements();
    var card = elements.create('card', { style: { base: { fontSize: '16px' } }, hidePostalCode: true });
    card.mount('#mondon-card');
    card.on('change', onCardEntryChange);
    card.on('focus', onCardEntryFocus);
    card.on('blur', onCardEntryBlur);

    // Set event handlers on the other fields, to set the form state.
    mondonamount.addEventListener('input', setFormState);
    mondonamount.addEventListener('focusout', enableEmptyErrors);
    mondoncount.addEventListener('input', setFormState);
    mondoncount.addEventListener('focusout', setFormState);
    mondonname.addEventListener('input', setFormState);
    mondonname.addEventListener('focusout', enableEmptyErrors);
    mondonemail.addEventListener('input', setFormState);
    mondonemail.addEventListener('focusout', enableEmptyErrors);
    mondonaddress.addEventListener('input', setFormState);
    mondonaddress.addEventListener('focusout', enableEmptyErrors);
    mondoncity.addEventListener('input', setFormState);
    mondoncity.addEventListener('focusout', enableEmptyErrors);
    mondonstate.addEventListener('change', setFormState);
    mondonzip.addEventListener('input', setFormState);
    mondonzip.addEventListener('focusout', enableEmptyErrors);
    mondonform.addEventListener('submit', onMondonFormSubmit);

    // Set the initial form state.
    setFormState();
});

window.addEventListener('load', function () {
    var emaillistform = document.getElementById('emaillistform');
    if (emaillistform) {
        emaillistform.addEventListener('submit', function (evt) {
            evt.preventDefault();
            var email = emaillistform.email.value;
            var fname = emaillistform.fname.value;
            var lname = emaillistform.lname.value;
            if (!email.trim() || !fname.trim() || !lname.trim()) return;
            var submit = document.getElementById('emaillistsubmit');
            var confirmDiv = document.getElementById('emaillistconfirm');
            var errorDiv = document.getElementById('emaillisterror');
            submit.setAttribute('disabled', 'disabled');
            confirmDiv.textContent = '';
            errorDiv.textContent = '';
            fetch('/backend/email-signup', {
                body: new FormData(emaillistform),
                method: 'POST',
            }).then(function (result) {
                switch (result.status) {
                    case 304:
                        confirmDiv.textContent = 'You are already subscribed to our email list.';
                        break;
                    case 200:
                    case 202:
                        confirmDiv.textContent = 'MailChimp has sent you an email requesting confirmation.';
                        break;
                    default:
                        errorDiv.textContent = 'We apologize that we were unable to store your information.  Please try again later, or call the Schola Cantorum office at (650) 254‑1700.';
                        submit.removeAttribute('disabled');
                }
            }).catch(function (err) {
                errorDiv.textContent = 'We apologize that we were unable to store your information.  Please try again later, or call the Schola Cantorum office at (650) 254‑1700.';
                submit.removeAttribute('disabled');
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
                    errorDiv.textContent = 'We apologize that we were unable to store your information.  Please try again later, or call the Schola Cantorum office at (650) 254‑1700.';
                    submit.removeAttribute('disabled');
                }
            }).catch(function (err) {
                errorDiv.textContent = 'We apologize that we were unable to store your information.  Please try again later, or call the Schola Cantorum office at (650) 254‑1700.';
                submit.removeAttribute('disabled');
            });
        });
    }
});

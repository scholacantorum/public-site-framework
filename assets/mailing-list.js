window.addEventListener('load', function () {
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
            })
        })
    }
});

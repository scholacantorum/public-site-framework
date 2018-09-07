document.addEventListener('load', function () {
    var publishform = document.getElementById('publishform');
    if (publishform) {
        publishform.addEventListener('submit', function (evt) {
            evt.preventDefault();
            var submit = document.getElementById('publishsubmit');
            var confirmDiv = document.getElementById('publishconfirm');
            var errorDiv = document.getElementById('publisherror');
            submit.setAttribute('disabled', 'disabled');
            confirmDiv.style.display = 'none';
            errorDiv.style.display = 'none';
            fetch('/backend/publish-site', {
                body: new FormData(publishform),
                method: 'POST',
            }).then(function (result) {
                switch (result.status) {
                    case 200:
                        confirmDiv.textContent = 'Published.';
                        confirmDiv.style.display = 'block';
                        break;
                    case 400:
                        errorDiv.textContent = 'The site could not be built.  Check for syntax errors in any changed files.';
                        errorDiv.style.display = 'block';
                        break;
                    case 401:
                        errorDiv.textContent = 'Invalid password.';
                        errorDiv.style.display = 'block';
                        break;
                    default:
                        errorDiv.textContent = 'A processing error occurred.  Please report this error.';
                        errorDiv.style.display = 'block';
                        break;
                }
                if (!result.ok) {
                    submit.removeAttribute('disabled');
                }
            }).catch(function (err) {
                errorDiv.textContent = 'A processing error occurred.  Please report this error.';
                errorDiv.style.display = 'block';
                submit.removeAttribute('disabled');
            });
        });
    }
});

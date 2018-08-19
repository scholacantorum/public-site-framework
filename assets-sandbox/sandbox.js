window.addEventListener('load', function () {
    var publishform = document.getElementById('publishform');
    publishform.addEventListener('submit', function (evt) {
        evt.preventDefault();
        var submit = document.getElementById('publishsubmit');
        var confirmDiv = document.getElementById('publishconfirm');
        var errorDiv = document.getElementById('publisherror');
        submit.setAttribute('disabled', 'disabled');
        confirmDiv.textContent = '';
        errorDiv.textContent = '';
        fetch('/backend/publish-site', {
            body: new FormData(publishform),
            method: 'POST',
        }).then(function (result) {
            switch (result.status) {
            case 200:
                confirmDiv.textContent = 'Published.';
                break;
            case 400:
                errorDiv.textContent = 'The site could not be built.  Check for syntax errors in any changed files.';
                break;
            case 401:
                errorDiv.textContent = 'Invalid password.';
                break;
            default:
                errorDiv.textContent = 'A processing error occurred.  Please report this error.';
                break;
            }
            if (!result.ok) {
                submit.removeAttribute('disabled');
            }
        }).catch(function (err) {
            errorDiv.textContent = 'A processing error occurred.  Please report this error.';
            submit.removeAttribute('disabled');
        });
    });
});

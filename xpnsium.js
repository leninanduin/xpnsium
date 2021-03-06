//TODO: encrypt email
// Saves options to chrome.storage
function save_options() {
    var email = document.getElementById('email').value;
    chrome.storage.sync.set({
        'user_email': email
    }, function() {
        // Update status to let user know options were saved.
        var status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 750);
    });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    chrome.storage.sync.get({
        'user_email': ''
    }, function(items) {
        // console.log(items);
        document.getElementById('email').value = items.user_email;
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',save_options);
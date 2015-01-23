
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
        getTopHistoy();
        document.getElementById('email').value = items.user_email;
    });
}

function getTopHistoy(){
    // To look for history items visited in the last week,
    // subtract a week of microseconds from the current time.
    var microsecondsPerWeek = 1000 * 60 * 25;
    var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;

    // Track the number of callbacks from chrome.history.getVisits()
    // that we expect to get.  When it reaches zero, we have all results.
    var numRequestsOutstanding = 0;

    chrome.history.search({
        'text': '',              // Return every history item....
        'startTime': oneWeekAgo  // that was accessed less than one week ago.
    },
    function(historyItems) {
        console.log(historyItems);
        // // For each history item, get details on all visits.
        // for (var i = 0; i < historyItems.length; ++i) {
        //     var url = historyItems[i].url;
        //     var processVisitsWithUrl = function(url) {
        //         // We need the url of the visited item to process the visit.
        //         // Use a closure to bind the  url into the callback's args.
        //         return function(visitItems) {
        //             processVisits(url, visitItems);
        //         };
        //     };

        //     chrome.history.getVisits({url: url}, processVisitsWithUrl(url));
        //     numRequestsOutstanding++;
        // }
        // if (!numRequestsOutstanding) {
        //     onAllVisitsProcessed();
        // }
    });
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',save_options);
// Legacy support for pre-event-pages.
var oldChromeVersion = !chrome.runtime;
var chrome_data = {user_email:""};

function onInit() {
    console.log('onInit');
    localStorage.requestFailureCount = 0;  // used for exponential backoff
    chrome.storage.sync.get({
        'user_email': ''
    }, function(items) {
        console.log(items);
        if (items.user_email) {
            chrome_data.user_email = items.user_email;
            askForNewCashOperation();
        } else{
            console.log("there is no user email, scheduling init...");
            chrome.alarms.create("init", {delayInMinutes:1})
        }
    });
    // if (!oldChromeVersion) {
    //   // TODO(mpcomplete): We should be able to remove this now, but leaving it
    //   // for a little while just to be sure the refresh alarm is working nicely.
    //   chrome.alarms.create('watchdog', {periodInMinutes:5});
    // }
}

function onAlarm(alarm) {
  console.log('Got alarm', alarm);
  // |alarm| can be undefined because onAlarm also gets called from
  // window.setTimeout on old chrome versions.
  if (alarm && alarm.name == 'watchdog') {
    onWatchdog();
  } else if (alarm && alarm.name == 'init') {
    onInit();
  } else if (alarm && alarm.name == 'ask') {
    askForNewCashOperation();
  }
}

function onWatchdog() {
  chrome.alarms.get('ask', function(alarm) {
    if (alarm) {
      console.log('Ask alarm exists. Yay.');
    } else {
      console.log('Ask alarm doesn\'t exist!? ' +
                  'Refreshing now and rescheduling.');
      askForNewCashOperation();
    }
  });
}

function askForNewCashOperation() {
    console.log("askForNewCashOperation()");
    if(chrome_data.user_email) {
        $.ajax({
            url: "http://localhost:5000/has_new_operations",
            method: "POST",
            data: chrome_data,
            success: function( receivedData ){
                console.log(receivedData);
                //TODO: parse response time, get search history and send it to the server
                //reschedule petition
                chrome.alarms.create("ask", {delayInMinutes:1})
            }
        });
    }else{
        chrome.alarms.create("init", {delayInMinutes:1})
    }
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

if (oldChromeVersion) {
    onInit();
} else {
    chrome.runtime.onInstalled.addListener(onInit);
    chrome.alarms.onAlarm.addListener(onAlarm);
}
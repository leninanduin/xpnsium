// Legacy support for pre-event-pages.
var oldChromeVersion = !chrome.runtime;
var chrome_data = {user_email:""};
var server_url = "http://localhost:5000";
var debug = 1;
function _log(a){
    if (debug){
        console.log(a);
    }
}
function onInit() {
    localStorage.requestFailureCount = 0;  // used for exponential backoff
    chrome.storage.sync.get({
        'user_email': ''
    }, function(items) {
        if (items.user_email) {
            chrome_data.user_email = items.user_email;
            askForNewCashOperation(false);
        } else{
            _log("there is no user email, scheduling init...");
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
  _log('Got alarm', alarm);
  // |alarm| can be undefined because onAlarm also gets called from
  // window.setTimeout on old chrome versions.
  if (alarm && alarm.name == 'watchdog') {
    onWatchdog();
  } else if (alarm && alarm.name == 'init') {
    onInit();
  } else if (alarm && alarm.name == 'ask') {
    askForNewCashOperation(false);
  }
}

function onWatchdog() {
  chrome.alarms.get('ask', function(alarm) {
    if (alarm) {
      _log('Ask alarm exists. Yay.');
    } else {
      _log('Ask alarm doesn\'t exist!? ' +
                  'Refreshing now and rescheduling.');
      askForNewCashOperation(false);
    }
  });
}

function askForNewCashOperation(alarm) {
    if(chrome_data.user_email) {
        _log('asking for new operations...');
        $.ajax({
            url: server_url+"/has_new_operations",
            method: "POST",
            data: chrome_data,
            success: function( rsO ){
                if (rsO.rowCount>0){
                    for (var i in rsO.rows) {
                        //TODO: put all this in a separate function
                        //search history items and post them to the server
                        ( function (operation) {
                            _log(operation);
                            var hItems = {_length:0};
                            chrome.history.search({
                                'text': '',
                                'startTime': operation.t_start,
                                'endTime': operation.t_end,
                            },
                            function(historyItems) {
                                for (var i in historyItems) {
                                    var h = historyItems[i];
                                    var a = document.createElement('a');
                                    a.setAttribute('href', h.url);

                                    if(hasOwnProperty(hItems, a.hostname)){
                                        hItems[a.hostname].push(h);
                                    }else{
                                        hItems[a.hostname] = [h];
                                        hItems._length++;
                                    }
                                }

                                if (hItems._length > 0){
                                    _log('we have history items, auth_num: ' + operation.auth_num);
                                    _log(hItems);
                                    $.ajax({
                                        url: server_url+"/save_browser_events",
                                        method: "POST",
                                        data: { authNum: operation.auth_num, historyItems: hItems },
                                        success: function( rs ){
                                            _log('history items saved successfully');
                                            _log(rs);
                                        },
                                        complete: function(xhr, s){
                                            _log('complete save_browser_events: '+s);
                                        }
                                    });
                                }
                            });
                        })(rsO.rows[i]);
                    }
                }

                if(alarm){
                    //reschedule petition
                    chrome.alarms.create("ask", {delayInMinutes:1})
                }
            },
            complete: function(xhr, s){
                _log('complete has_new_operations: '+s);
            }
        });
    }else{
        chrome.alarms.create("init", {delayInMinutes:1})
    }
}

function hasOwnProperty(obj, prop) {
    var proto = obj.__proto__ || obj.constructor.prototype;
    return (prop in obj) &&
        (!(prop in proto) || proto[prop] !== obj[prop]);
}

if (oldChromeVersion) {
    onInit();
} else {
    chrome.runtime.onInstalled.addListener(onInit);
    chrome.alarms.onAlarm.addListener(onAlarm);
}
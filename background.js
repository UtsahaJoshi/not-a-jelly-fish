// initialize variables
var currentTab;
var focusTab;
var tempFocusTab;
var tab;
var hour;
var min;
var sec;
var intervalTimerLabel;
var goBack;
var url = chrome.runtime.getURL("../html/fail.html");

var resetAllNow = () => {
  focusTab = null;
  tempFocusTab = null;
  tab = null;
  hour = null;
  min = null;
  sec = null;
  intervalTimerLabel = null;
  goBack = null;
}

var removeTab = async (tabId) => {
  await chrome.tabs.remove(tabId);
  tab = null;
}

var resetTime = () => {
  hour = null;
  min = null;
  sec = null;
}

var createFailTab = async () => {
  var tab =  await chrome.tabs.create({url, active: true });
  return tab;
}

var focusOnTab = async (focusTab) => {
  await chrome.tabs.update(focusTab, {selected: true});
}

// on remove tab
chrome.tabs.onRemoved.addListener(async function(tabid) {

  //if the focus tab is removed
  if (tabid === focusTab) {

    //reset focusTab
    focusTab = null;

    //reset time
    resetTime();

    clearInterval(intervalTimerLabel);

    // if fail.html is open when focus tab is closed, close it too
    if (tab) {
      // remove tab
      await removeTab(tab.id);
    }

    // create tab for fail.html
    await createFailTab();

    chrome.runtime.sendMessage("START");
  }

  // if the fail.html tab is removed
  if (tab && tabid === tab.id) {

    //reset tab variable
    tab = null;

    //allow to go back if fail.html tab closed
    if (focusTab || tempFocusTab) {
      goBack = true;
    }
  }
 })

// event listener for activated tab
chrome.tabs.onActivated.addListener(async function(activeInfo) {

  // get currentTab
  currentTab = activeInfo.tabId;

  //if fail.html tab is not created
  if (!tab) {
    //if goBack is true then go back to focus tab
    if (goBack){
      await focusOnTab(focusTab || tempFocusTab);
      goBack = false;
      tempFocusTab = null;
    }
    else {
      // if current tab is not focus tab, open new tab with fail.html
      if (currentTab != focusTab && focusTab) {
        tab = await createFailTab();
      }
    }
  }
  // if fail.html is open focus on it
  if (tab) {
    await focusOnTab(tab.id);
  }
});

//start the timer in background
startTimer = async () => {
  intervalTimerLabel = setInterval(async function() {
    sec--;
    if (sec < 0) {
      sec = 59;
      min--;
    }
    if (min < 0) {
      min = 59;
      hour--;
    }

    //  send current time data to interact.js
    chrome.runtime.sendMessage({hour: hour, min: min, sec: sec});

    //if time ends
    if (hour + sec + min == 0) {
      clearInterval(intervalTimerLabel);
      resetAllNow();
      chrome.runtime.sendMessage("START");
    }

    // if current tab is focus tab and fail.html is there
    if (tab && currentTab === focusTab) {
      await removeTab(tab.id);
      tab = null;
    }

    // go to fail.html if it is there
    if (tab) {
      await focusOnTab(tab.id);
    }
  }, 1000);
}

// event listeners for onMessage 
chrome.runtime.onMessage.addListener(
  async function(mssg) {
    if (mssg.focusTab) {
      focusTab = currentTab;
    } else if (mssg.startPage){
      if (hour + min + sec > 0) {
        chrome.runtime.sendMessage({hour: hour, min: min, sec: sec});
      } else {
        chrome.runtime.sendMessage("START");
      }
    } else if (mssg === "STOP"){
      resetTime();
      tempFocusTab = focusTab;
      focusTab = null;
      if (intervalTimerLabel) {
        clearInterval(intervalTimerLabel);
      }
    } else if (mssg.goBack){
      goBack = true;
      if (tab) {
        await removeTab(tab.id);
        tab = null;
      }
    } else if(mssg.stopTimer){
      tab = await createFailTab();
    } else {
      if (!hour && !min && !sec) {
        hour = mssg.hour;
        min = mssg.min;
        sec = mssg.sec;
        startTimer();
      }
    }
  }
);
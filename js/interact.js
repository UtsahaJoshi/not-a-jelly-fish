var hour;
var min;
var sec;
var button;
var timerInput;
var timerInputAndLabel;
var timerLabel;

// send mssg to start page on initialization, get time data if timer is running
chrome.runtime.sendMessage({startPage: true});

document.addEventListener('DOMContentLoaded', () => {
  button = document.getElementById("start-focus");
  timerInput = document.getElementById("userInput");
  timerInputAndLabel = document.getElementById("timerInputLabel");
  timerLabel = document.getElementById("timerLabel");
  if (button) {
    button.addEventListener("click", () => {
      button.innerText = (button.innerText === "START") ? "STOP" : "START";
      chrome.runtime.sendMessage({focusTab: true});
      startTimer(button.innerText);
      if (button.innerText === "START") {
        chrome.runtime.sendMessage({stopTimer: true});
      }
    });
  }
});

//reset all
var resetAllNow = () => {
  hour = null;
  min = null;
  sec = null;
  timerInput.value = 25;
}

//start pop up
var startPopUP = () => {
  if (!hour && !min && !sec) {
    timerInputAndLabel.style.display = "block";
    timerLabel.style.display = "none";
  } else {
    timerLabel.style.display = "block";
    timerInputAndLabel.style.display = "none";
  }
}

//reset time
var resetTime = () => {
  hour = null;
  min = null;
  sec = null;
}

var getLabelForTime = (time) => {
  return (time < 10) ? "0" + time : time;
}

// start the timer
var startTimer = (startOrStop) => {
  var totalTime = timerInput.value;
  timerInputAndLabel.style.display = "none";
  if (startOrStop === "START") {
    timerLabel.style.display = "none";
    timerLabel.innerHTML = "";
    timerInputAndLabel.style.display = "block";
    chrome.runtime.sendMessage("STOP");
    resetTime();
  }
  else {
    timerLabel.style.display = "block";

    // get time from the input one time initially
    if (hour !== 0 && !hour && min !== 0 && !min && sec !== 0 && !sec) {
      hour = totalTime / 60;
      min = Math.floor((hour - Math.floor(hour)) * 60);
      sec = 0;
      hour = Math.floor(hour);
      //send time data to background.js
      chrome.runtime.sendMessage({hour: hour, min: min, sec: sec});
    }

    //if time ends
    if (hour + sec + min == 0) {
      resetAllNow();
      window.open('../html/success.html', '_blank');
    }

    //get proper time labels for timer display
    var hourLabel = getLabelForTime(hour);
    var minLabel = getLabelForTime(min);
    var secLabel = getLabelForTime(sec);
    timerLabel.innerHTML = hourLabel + ":" + minLabel + ":" + secLabel;
  }
}

chrome.runtime.onMessage.addListener(
  function(mssg) {
    if (mssg === "START") {
      resetTime();
      button.innerText = "START";
      startPopUP();
      startTimer("START");
    } else 
    {
      hour = mssg.hour;
      min = mssg.min;
      sec = mssg.sec;
      button.innerText = "STOP";
      startPopUP();
      startTimer("STOP");
    }
  }
);
var backBtn = document.getElementById("back-btn");

backBtn.addEventListener("click", () => {
  chrome.runtime.sendMessage({goBack: true});
});
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('popup.html', {
    'bounds': {
      'width': 660,
      'height': 800
    }
  });
});
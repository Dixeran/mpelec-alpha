module.exports = {
  OSC: {
    width: 800,
    height: 450,
    minWidth: 800,
    minHeight: 450,
    frame: false,
    transparent: true,
    backgroundColor: "#FFFFFFFF",
    //use pure white when loading, change it to transparent when loaded.
    titleBarStyle: "hidden",
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      webviewTag: true
    }
  },
  PWIN: {
    frame: false,
    backgroundColor: "#000000",
    show: false,
    resizable: false,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
      webviewTag: true
    }
  }
};

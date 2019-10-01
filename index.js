const electron = require("electron");
const addon = require("bindings")("addon");
const PSTATE = require("./src_electron/PlayState");
const WindowConfig = require("./src_electron/WindowConfig");
require("./src_electron/AppEvent")(addon);
const IPC = require('./src_electron/IPC_client');

global.shared = {
  forms: {
    osc: null,
    pwin: null,
    aux: null,
    window_state: 'normal' // normal, maximized, minimized, fullscreen
  },
  play_state: PSTATE.NONE,
  play_detail: null
}

// Disable hw to fix transparent issue
// however disable hw will cause transparent window un-resizable
// so I use a aux window to prevent system's native minimize/normalize
// Also, call pwin.show() will cause a black mask, ALWAYS use pwin.restore() instead.
// electron.app.disableHardwareAcceleration();

electron.app.on("ready", function () {
  let _aux = new electron.BrowserWindow({
    show: false
  });
  _aux.minimize();
  _aux.on('restore', () => {
    _aux.hide();
    shared.forms.osc.show();
    if (shared.play_state !== PSTATE.NONE) shared.forms.pwin.restore();
    else _aux.minimize();
  });
  shared.forms.aux = _aux;

  // create hidden play window
  let win = new electron.BrowserWindow({
    ...WindowConfig.PWIN
  });
  shared.forms.pwin = win;
  let hwnd_pwin = win.getNativeWindowHandle().readInt32LE();
  addon.init(hwnd_pwin);

  // create main window
  let osc = new electron.BrowserWindow({
    ...WindowConfig.OSC,
    parent: win
  });
  shared.forms.osc = osc;
  let hwnd_osc = osc.getNativeWindowHandle().readInt32LE();
  // bind window movement
  addon.bind_window(hwnd_osc, hwnd_pwin);

  osc.loadURL("http://localhost:8080").then(() => {
    // prevent black bakcgournd when offscreen
    let _size = osc.getSize();
    osc.setSize(_size[0] - 1, _size[1] - 1);
    _size = osc.getSize();
    osc.setSize(_size[0] + 1, _size[1] + 1);
    osc.setBackgroundColor("#00FFFFFF");
    IPC.init();
    console.log("ready to play");
  });
})

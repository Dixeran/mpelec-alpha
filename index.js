const electron = require("electron");
const addon = require("bindings")("addon");
const PSTATE = require("./src_electron/PlayState");
const WindowConfig = require("./src_electron/WindowConfig");
require("./src_electron/AppEvent")(addon);
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
  _aux.on('restore', () => {
    _aux.hide();
    shared.forms.osc.show();
    if (shared.play_state !== PSTATE.NONE) shared.forms.pwin.restore();
  });
  shared.forms.aux = _aux;

  // create hidden play window
  let win = new electron.BrowserWindow({
    ...WindowConfig.PWIN
  });
  shared.forms.pwin = win;
  let hwnd = win.getNativeWindowHandle().readInt32LE();
  addon.init(hwnd);

  // create main window
  let osc = new electron.BrowserWindow({
    ...WindowConfig.OSC,
    parent: win
  });
  shared.forms.osc = osc;

  // bind window event
  osc.on("move", () => {
    win.setBounds(osc.getBounds());
  });
  osc.on("resize", () => {
    win.setBounds(osc.getBounds());
  });

  osc.loadURL("http://localhost:8080").then(() => {
    // prevent black bakcgournd when offscreen
    let _size = osc.getSize();
    osc.setSize(_size[0] - 1, _size[1] - 1);
    _size = osc.getSize();
    osc.setSize(_size[0] + 1, _size[1] + 1);
    osc.setBackgroundColor("#00FFFFFF");
    console.log("ready to play");
  });
})

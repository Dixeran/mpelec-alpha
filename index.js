const electron = require("electron");
const path = require("path");
const addon = require("bindings")("addon");
const PSTATE = require("./src_electron/PlayState");
const WindowConfig = require("./src_electron/WindowConfig");
require("./src_electron/AppEvent")(addon);
const IPC = require("./src_electron/IPC_client");
if (!process.defaultApp) {
  // after build
  require("dotenv").config({
    path: path.resolve(__dirname, ".env")
  });
}

global.shared = {
  forms: {
    osc: null,
    pwin: null,
    aux: null,
    window_state: "normal" // normal, maximized, minimized, fullscreen
  },
  play_state: PSTATE.NONE,
  play_detail: {
    path: undefined,
    filename: undefined,
    temp_path: undefined,
    hash_tag: undefined // calculate from path-filename
  },
  __dirname: __dirname
};

// Disable hw to fix transparent issue
// however disable hw will cause transparent window un-resizable
// so I use a aux window to prevent system's native minimize/normalize
// Also, call pwin.show() will cause a black mask, ALWAYS use pwin.restore() instead.
// electron.app.disableHardwareAcceleration();

electron.app.on("ready", function() {
  let _aux = new electron.BrowserWindow({
    show: false
  });
  _aux.minimize();
  _aux.on("restore", () => {
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
  addon.init(hwnd_pwin, __dirname);

  // create main window
  let osc = new electron.BrowserWindow({
    ...WindowConfig.OSC,
    parent: win
  });
  shared.forms.osc = osc;
  let hwnd_osc = osc.getNativeWindowHandle().readInt32LE();
  // bind window movement
  addon.bind_window(hwnd_osc, hwnd_pwin);

  if (process.env.NODE_ENV === "deployment") {
    osc.loadFile(__dirname + "/src/mpview/dist/spa/index.html").then(loaded);
  } else {
    osc.loadURL("http://localhost:8080").then(loaded);
  }

  function loaded() {
    // prevent black bakcgournd when offscreen
    let _size = osc.getSize();
    osc.setSize(_size[0] - 1, _size[1] - 1);
    _size = osc.getSize();
    osc.setSize(_size[0] + 1, _size[1] + 1);
    osc.setBackgroundColor("#00FFFFFF");
    console.log("path:");
    console.log(addon.get_path());
    IPC.init();
    console.log("ready to play");

    // use argv to open file
    let args;
    if (process.defaultApp) args = process.argv.slice(2);
    // when dev
    else args = process.argv.slice(1);

    file = args[0];
    if (file) {
      addon.play(file);
      osc.webContents.send("playback-start");
      shared.play_state = PSTATE.PLAY;
      // TODO: fit video size.
      win.restore();
      _aux.hide();
      osc.focus();
      // TODO: add rest files to playlist.
    }
  }
});

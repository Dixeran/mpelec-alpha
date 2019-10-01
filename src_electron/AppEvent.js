const {
  ipcMain,
  app,
  BrowserWindow
} = require("electron");
const PSTATE = require("./PlayState");
const IPC = require("./IPC_client");

let mem_bounds = undefined;

module.exports = function (addon) {
  ipcMain.on("close", (e, arg) => {
    IPC.quit();
    app.quit();
  });

  // window size controls
  function setWindowState(state) {
    let {
      osc,
      pwin,
      aux
    } = shared.forms;

    const old_state = shared.forms.window_state;
    if (state === "maximized") {
      console.log("maximize");

      if (old_state === "fullscreen") {
        osc.setFullScreen(false);
        pwin.setBounds(osc.getBounds());
        shared.forms.window_state = "maximized";
        return;
      } else if (old_state === "maximized") {
        setWindowState("normal");
        return;
      }

      mem_bounds = osc.getBounds();
      if (shared.play_state === PSTATE.NONE) {
        // we shouldn't call pwin.maximize() when it's playing
        pwin.maximize();
        osc.setBounds(pwin.getBounds());
        pwin.hide();
        shared.forms.window_state = "maximized";
      } else {
        osc.maximize();
        pwin.setBounds(osc.getBounds());
      }
      shared.forms.window_state = "maximized";
    } else if (state === "minimized") {
      console.log("minimized");
      if (old_state !== "fullscreen") {
        // come from fullscreen needn't to store old bounds.
        mem_bounds = osc.getBounds();
      }
      osc.hide();
      pwin.hide();
      aux.minimize();
      shared.forms.window_state = "minimized";
    } else if (state === "normal") {
      console.log("normal");
      osc.setBounds(mem_bounds);
      pwin.setBounds(osc.getBounds());
      shared.forms.window_state = "normal";
    } else if (state === "fullscreen") {
      console.log("fullscreen");
      // store current bounds
      mem_bounds = osc.getBounds();

      osc.setFullScreen(true);
      shared.forms.window_state = "fullscreen";
      pwin.setBounds(osc.getBounds());
    }
  }

  ipcMain.on("maximize", () => {
    setWindowState("maximized");
  });

  ipcMain.on("fullscreen", () => {
    let {
      osc
    } = shared.forms;
    setWindowState("fullscreen");
    osc.webContents.send("fullscreen");
  });

  ipcMain.on("minimize", () => {
    setWindowState("minimized");
  });

  ipcMain.on("open-file", (event, arg) => {
    let {
      osc,
      pwin,
      aux
    } = shared.forms;
    let {
      path
    } = arg;

    addon.play(path);
    osc.webContents.send("playback-start");
    shared.play_state = PSTATE.PLAY;
    // TODO: fit video size.
    pwin.restore();
    aux.hide();
  });

  ipcMain.on("playback-stop", () => {
    let {
      pwin,
      aux
    } = shared.forms;

    shared.play_state = PSTATE.NONE;
    pwin.hide();
    aux.minimize();
  });
};

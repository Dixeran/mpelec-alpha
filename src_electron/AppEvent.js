const {
  ipcMain,
  app
} = require('electron');
const PSTATE = require("./PlayState");

module.exports = function () {
  ipcMain.on('close', (e, arg) => {
    app.quit();
  });

  ipcMain.on('maximize', () => {
    let {
      osc,
      pwin,
    } = shared.forms;

    if (shared.forms.is_maximized) {
      osc.setSize(1024, 768);
      shared.forms.is_maximized = false;
    } else {
      osc.maximize();
      shared.forms.is_maximized = true;
    }

    if (shared.play_state !== PSTATE.NONE) {
      // pwin is playing
      if (pwin.isMaximized()) {
        pwin.unmaximize();
        pwin.setSize(1024, 768);
      } else pwin.maximize();
    }
  });

  ipcMain.on('minimize', () => {
    shared.forms.osc.minimize();
    if (shared.play_state !== PSTATE.NONE) {
      shared.forms.pwin.minimize();
    }
  })
}

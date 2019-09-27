const electron = require("electron");
const addon = require("bindings")("addon");

electron.ipcMain.on('close', (event, ary) => {
  electron.app.quit();
});

electron.app.on("ready", function () {
  let osc = new electron.BrowserWindow({
    webPreferences: {
      nodeIntegration: true
    },
    frame: false,
    transparent: true,
    backgroundColor: "#00FFFFFF",
  });

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
    console.log("ready to play");
  });

  let _bound = osc.getBounds();
  let win = new electron.BrowserWindow({
    width: _bound.width,
    height: _bound.height,
    x: _bound.x,
    y: _bound.y,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    },
    backgroundColor: "#000000",
    show: false,
    skipTaskbar: true
  });
  let hwnd = win.getNativeWindowHandle().readInt32LE();
  const mpv_handle = addon.init(hwnd);
  console.log(mpv_handle);
  addon.play();
  console.log("start play");
  win.show();
})

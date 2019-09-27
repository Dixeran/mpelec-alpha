const electron = require("electron");
const addon = require("bindings")("addon");

electron.app.on("ready", function() {
  let win = new electron.BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    },
    backgroundColor: "#000000"
  });
  let hwnd = win.getNativeWindowHandle().readInt32LE();
  addon.play(hwnd);

  let win_bound = win.getBounds();
  let osd = new electron.BrowserWindow({
    x: win_bound.x,
    y: win_bound.y,
    width: win_bound.width,
    height: win_bound.height,
    webPreferences: {
      nodeIntegration: true
    },
    frame: false,
    transparent: true,
    backgroundColor: "#00FFFFFF",
    skipTaskbar: true
  });

  osd.on("move", () => {
    win.setBounds(osd.getBounds());
  });

  osd.on("resize", () => {
    win.setBounds(osd.getBounds());
  });

  osd.loadURL("http://localhost:8080").then(() => {
    // prevent black bakcgournd when offscreen
    let _size = osd.getSize();
    osd.setSize(_size[0] - 1, _size[1] - 1);
    _size = osd.getSize();
    osd.setSize(_size[0] + 1, _size[1] + 1);

    win.hide();
    setTimeout(function() {
      win.show();
    }, 2000);
  });
  // osd.loadFile("./src/mpview/dist/spa/index.html");
});

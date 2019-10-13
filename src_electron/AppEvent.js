const { ipcMain, app, BrowserWindow } = require("electron");
const PSTATE = require("./PlayState");
const IPC = require("./IPC_client");
const Path = require("path");
const Crypto = require("crypto");
const Fs = require("fs");

let mem_bounds = undefined;
let tmb;

module.exports = function(addon) {
  ipcMain.on("close", (e, arg) => {
    IPC.quit();
    app.quit();
  });

  // window size controls
  function setWindowState(state) {
    let { osc, pwin, aux } = shared.forms;

    const old_state = shared.forms.window_state;
    if (state === "maximized") {
      console.log("maximize");

      if (old_state === "fullscreen") {
        osc.setFullScreen(false);
        // pwin.setBounds(osc.getBounds());
        shared.forms.window_state = "maximized";
        return;
      } else if (old_state === "maximized") {
        setWindowState("normal");
        return;
      }

      mem_bounds = osc.getBounds();
      if (shared.play_state === PSTATE.NONE) {
        // we shouldn't call pwin.maximize() when it's playing
        aux.maximize();
        osc.setBounds(aux.getBounds());
        aux.hide();
        shared.forms.window_state = "maximized";
      } else {
        osc.maximize();
        osc.focus();
        // pwin.setBounds(osc.getBounds());
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
      osc.focus();
      // pwin.setBounds(osc.getBounds());
      shared.forms.window_state = "normal";
    } else if (state === "fullscreen") {
      console.log("fullscreen");
      // store current bounds
      if (old_state !== "fullscreen") {
        mem_bounds = osc.getBounds();
        osc.setFullScreen(true);
        osc.focus();
        shared.forms.window_state = "fullscreen";
      } else setWindowState("normal");
    }
  }

  ipcMain.on("maximize", () => {
    setWindowState("maximized");
  });

  ipcMain.on("fullscreen", () => {
    let { osc } = shared.forms;
    setWindowState("fullscreen");
  });

  ipcMain.on("minimize", () => {
    setWindowState("minimized");
  });

  ipcMain.on("open-file", (event, arg) => {
    let { path } = arg;
    openfile(path);
  });

  ipcMain.on("open-list-file", (ev, _filename) => {
    // concat the dir of playlist and the filename
    let vpath = Path.resolve(shared.play_detail.path, _filename);
    addon.play(vpath);
  });

  ipcMain.on("playback-start", () => {
    // TODO: Get path from mpv, if newly, curb all file at same folder;
    // Update playlist, send to View.
    // else update current playing file.
    IPC.get_property("path").then(_path => {
      const location = Path.resolve(_path, "../"); // video location
      const filename = Path.basename(_path); // video filename

      if (location !== shared.play_detail.path) {
        // play at different folder
        shared.play_detail.path = location;
        const ext = Path.extname(filename);
        let playlist = [];
        Fs.readdir(location, (err, files) => {
          if (err) console.error(err);
          files.forEach(file => {
            if (Path.extname(file) === ext) playlist.push(file);
          });
          playlist.sort((a, b) => {
            return addon.cmp_str_logical(a, b);
          });
          console.log(playlist);
          shared.forms.osc.webContents.send("set-playlist", {
            list: playlist,
            current: filename
          });
        });
        // TODO: read history from temp file
        let sha1_location = Crypto.createHash("sha1")
          .update(location)
          .digest("hex");
        let temp_path = Path.resolve(app.getPath("userData"), sha1_location);
        shared.play_detail.temp_path = temp_path;
        console.log("temp path : ");
        console.log(temp_path);
        Fs.readFile(Path.resolve(temp_path, "./history.json"), (err, data) => {
          if (!err) {
            history = JSON.parse(data);
            shared.forms.osc.webContents.send("set-history", history);
          }
        });
      } else {
        shared.forms.osc.webContents.send("set-playlist", {
          current: filename
        }); // update current file only
      }
      shared.play_detail.path = location;
      shared.play_detail.filename = filename;

      let sha1_filename = Crypto.createHash("sha1")
        .update(filename)
        .digest("hex");
      shared.play_detail.hash_tag = sha1_filename;
    });
  });

  ipcMain.on("playback-stop", () => {
    let { pwin, aux } = shared.forms;
    shared.play_state = PSTATE.NONE;
    pwin.hide();
    aux.minimize();
  });

  ipcMain.on("set-history", (ev, pos_percent) => {
    let { temp_path } = shared.play_detail;
    const record_path = Path.resolve(temp_path, "./history.json");
    console.log(record_path);
    let data = {
      filename: shared.play_detail.filename,
      time_pos_percent: pos_percent
    };
    if (!Fs.existsSync(temp_path)) {
      Fs.mkdir(temp_path, { recursive: true }, err => {
        if (err) console.error(err);
      });
    }
    Fs.writeFile(record_path, JSON.stringify(data), err => {
      if (err) console.error(err);
    });
    ev.reply("saved-history");
  });

  ipcMain.on("request-thumbs", () => {
    console.log("req thumb");
    tmb = new BrowserWindow({
      width: 240,
      height: 135,
      frame: true,
      show: false
    });
    thw = tmb.getNativeWindowHandle().readInt32LE();

    IPC.get_property("path").then(_path => {
      console.log(_path);
      let dir = Path.resolve(_path, "../");
      addon.gen_thumbs(
        function(env, arg) {
          console.log("thumb gend");
          console.log(env);
          console.log(arg);
          tmb.destroy();
        },
        _path,
        dir,
        thw
      );
    });
  });
};

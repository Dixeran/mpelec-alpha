<template>
  <q-page padding @mousemove.native="check_visible($event)">
    <!-- mouse event area -->
    <div
      class="event-area row justify-center items-center"
      ref="event_area"
      @click="mouse_event($event, 'click')"
      @dblclick="mouse_event($event, 'dblclick')"
    >
      <div class="pause-indicator" v-if="!is_playing">
        <q-icon name="pause"></q-icon>
      </div>

      <!-- context menu -->
      <CtxMenu
        v-model="ctx_show"
        :tracks="metadata.tracks"
        @set_track="set_track"
      />
    </div>

    <!-- control panel -->
    <div class="row justify-center control-wrapper">
      <div class="control-panel" :class="{ hide: !loaded || !is_visible }">
        <!-- seek bar -->
        <SeekBar :playback_detail="playback_detail" @seek="seek" />

        <!-- bottom controls -->
        <BottomBar
          :is_playing="is_playing"
          :playback_detail="playback_detail"
          @restart="restart"
          @pause="pause"
          @stop="stop"
          @set_volume="set_volume"
          @request_thumbs="get_thumbs"
        />
      </div>

      <!-- annoying tips -->
      <div class="annoy" v-if="tip.show">{{ tip.content }}</div>

      <!-- activate playlist -->
      <div
        class="playlist-toggle"
        :class="{ hide: !loaded || !is_visible }"
        @click="$emit('show_list')"
      >
        <q-icon name="list"></q-icon>
      </div>
    </div>
  </q-page>
</template>

<script>
import SeekBar from "components/SeekBar.vue";
import BottomBar from "components/BottomBar.vue";
import CtxMenu from "components/CtxMenu.vue";
const { remote, ipcRenderer } = window.require("electron");
const fs = window.require("fs");
const path = window.require("path");
const IPC = remote.require("./src_electron/IPC_client");

let input_conf = [];
// FUCK!! getAppPath = process.cwd().
// let __dirname = remote.app.getAppPath();
// use path.resolve(__dirname, {relative path}) instead.
const __dirname = remote.getGlobal("shared").__dirname;

export default {
  data() {
    return {
      loaded: false,
      is_visible: true,
      is_playing: true,
      ctx_show: false,
      playback_detail: {
        title: undefined,
        volume: undefined,
        time_pos: 0,
        duration: 0,
        size: {
          width: undefined,
          height: undefined
        }
      },
      metadata: {
        tracks: {
          video: [],
          audio: [],
          sub: []
        }
      },
      tip: {
        content: "",
        show: false,
        tick: undefined
      }
    };
  },
  components: {
    SeekBar,
    BottomBar,
    CtxMenu
  },
  methods: {
    init() {
      IPC.once("end-file", () => {
        // failed before file-loaded
        if (!this.loaded) {
          this.$emit("stop");
        }
      });

      IPC.observe_property("volume");
      IPC.on("volume-change", vol => {
        this.playback_detail.volume = vol;
      });

      IPC.observe_property("media-title");
      IPC.on("media-title-change", _title => {
        if (!_title) {
          this.$emit(
            "end_file",
            this.playback_detail.time_pos / this.playback_detail.duration
          );
          return;
        }
        // media title change means video change
        this.playback_detail.title = _title;
        ipcRenderer.send("playback-start");
        IPC.get_property("pause").then(is_pause => {
          if (is_pause) this.is_playing = false;
        });

        IPC.get_property("track-list").then(tracks => {
          console.log(tracks);
          tracks.forEach(tr => {
            this.metadata.tracks[tr.type].push(tr);
          });
        });
      });

      IPC.observe_property("duration");
      IPC.on("duration-change", dur => {
        this.playback_detail.duration = dur;
      });

      IPC.observe_property("time-pos");
      IPC.on("time-pos-change", _time_pos => {
        // throttle
        _time_pos = Math.round(_time_pos);
        if (_time_pos !== this.playback_detail.time_pos) {
          this.playback_detail.time_pos = _time_pos;
        }
      });

      IPC.observe_property("volume");
      IPC.on("volume-change", _volume => {
        this.playback_detail.volume = _volume;
        this.annoy("Set volume: " + _volume + "%");
      });

      IPC.on("pause", () => {
        this.is_playing = false;
      });
      IPC.on("unpause", () => {
        this.is_playing = true;
      });

      IPC.once("playback-restart", () => {
        this.loaded = true;
      });
    },
    check_visible(ev) {
      this.is_visible = ev.clientY > window.innerHeight - 100;
    },
    annoy(msg) {
      if (this.tip.tick) {
        this.tip.show = false;
        clearTimeout(this.tip.tick);
      }

      this.tip.content = msg;
      this.tip.show = true;
      let that = this;
      this.tip.tick = setTimeout(function() {
        that.tip.show = false;
      }, 3000);
    },
    pause() {
      IPC.set_property("pause", [true]);
    },
    restart() {
      IPC.set_property("pause", [false]);
    },
    seek(e) {
      let target_bound = e.target.getBoundingClientRect();
      let pos_persent = (e.clientX - target_bound.left) / target_bound.width;
      let pos_sec = pos_persent * this.playback_detail.duration;
      IPC.send_command("seek", [pos_sec, "absolute"]);
    },
    stop() {
      document.removeEventListener("keydown", this.handle_key_event);
      window.removeEventListener("wheel", this.wheel_event);
      IPC.send_command("stop");
      this.$emit(
        "stop",
        this.playback_detail.time_pos / this.playback_detail.duration
      );
    },
    set_volume(e) {
      console.log(e);
      let target_bound = e.target.getBoundingClientRect();
      let pos = Math.round(e.clientX - target_bound.left);
      IPC.set_property("volume", [pos]);
    },
    bind_keys() {
      let that = this;
      // use input_conf to setup keys binding
      function register_input_event() {
        document.addEventListener("keydown", that.handle_key_event);
        window.addEventListener("wheel", that.wheel_event);
      }

      // parse input.conf
      fs.readFile(
        path.resolve(__dirname, "./mpv_config/input.conf"),
        (err, data) => {
          if (err) {
            console.error("No input config, use default.");
            return;
          }

          let conf_str = data.toString();
          let lines = conf_str.split(/\r+\n/);
          lines.forEach(line => {
            // TODO: upper case & lower case
            line = line.split(/\s+/);
            let conf_item = {};
            conf_item.key = line.shift();
            conf_item.command = line.shift();
            conf_item.args = line;
            input_conf.push(conf_item);
          });
          register_input_event();
        }
      );
    },
    handle_key_event(ev) {
      console.log(ev);
      let key = ev.key;

      // map keys
      switch (ev.key) {
        case "ArrowUp":
          key = "UP";
          break;
        case "ArrowDown":
          key = "DOWN";
          break;
        case "ArrowLeft":
          key = "LEFT";
          break;
        case "ArrowRight":
          key = "RIGHT";
          break;
        case " ":
          key = "SPACE";
          break;
        case "Enter":
          key = "ENTER";
          break;
        case "Escape":
          key = "ESC";
          break;
      }

      switch (key) {
        case "ENTER":
          this.$emit("fullscreen");
          break;
        case "ESC":
          this.stop();
          break;
      }

      let cmd = input_conf.find((item, index) => {
        return item.key === key;
      });
      if (cmd) {
        console.log(cmd);
        IPC.send_command(cmd.command, cmd.args);
        ev.preventDefault();
      }
    },
    mouse_event(ev, type) {
      console.log(ev);
      // ignore event that hide ctx menu
      if (this.ctx_show) return;

      let key = "";
      if (type === "click") {
        let btn_code = ev.button;

        switch (btn_code) {
          case 0:
            console.log("Left button clicked.");
            key = "MBTN_LEFT";
            break;

          case 1:
            console.log("Middle button clicked.");
            break;

          case 2:
            console.log("Right button clicked.");
            key = "MBTN_RIGHT";
            break;

          case 3:
            key = "MBTN_BACK";
            ev.preventDefault();
            break;

          case 4:
            key = "MBTN_NEXT";
            ev.preventDefault();
            break;

          default:
            console.log("Unexpected code: " + btn_code);
            return;
        }
      } else if (type === "dblclick") {
        this.$emit("fullscreen");
      } else return;

      let cmd = input_conf.find((item, index) => {
        return item.key === key;
      });
      if (cmd) {
        console.log(cmd);
        IPC.send_command(cmd.command, cmd.args);
        ev.preventDefault();
      }
    },
    wheel_event(ev) {
      console.log(ev);
      if (ev.target !== this.$refs.event_area) return;
      let key = "";
      if (ev.deltaX === 0) {
        // wheel down or up
        if (ev.deltaY > 0) key = "WHEEL_DOWN";
        else if (ev.deltaY < 0) key = "WHEEL_UP";
        else return;
      } else {
        // wheel left or right
        if (ev.deltaX > 0) key = "WHEEL_RIGHT";
        else if (ev.deltaX < 0) key = "WHEEL_LEFT";
        else return;
      }

      let cmd = input_conf.find((item, index) => {
        return item.key === key;
      });
      if (cmd) {
        console.log(cmd);
        IPC.send_command(cmd.command, cmd.args);
      }
    },
    set_track(track) {
      let prop = track.type.substr(0, 1) + "id"; // video-id = vid, so on
      IPC.set_property(prop, [track.id]).then(() => {
        this.metadata.tracks[track.type].forEach(tr => {
          if (tr.id === track.id) tr.selected = true;
          else if (tr.selected) tr.selected = false;
        });

        this.annoy(`Set ${track.type} track: ${track.title || track.codec}`);
      });
    },
    get_thumbs() {
      ipcRenderer.send("request-thumbs");
    }
  },
  created() {
    this.init();
    this.bind_keys();
  }
};
</script>

<style lang="stylus" scoped>
// event area
.event-area {
  position: fixed;
  top: 100px;
  bottom: 100px;
  left: 0;
  right: 0;
  z-index: 5;

  & > .pause-indicator {
    width: 3rem;
    height: 3rem;
    border-radius: 8px;
    background-color: $primary;
    color: white;
    font-size: 2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 5px 20px 0 rgba(0, 0, 0, 0.2);
  }
}

// control panel
.control-wrapper {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100vw;
}

.control-panel {
  width: 70vw;
  min-width: 600px;
  height: 4rem;
  position: relative;
  margin: 24px;
  overflow: hidden;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 7px 20px 0 rgba(0, 0, 0, 0.2);
  transition: all ease 0.5s;
  -webkit-user-select: none;
}

.hide {
  opacity: 0;
  pointer-events: none;
}

// annoying tip
.annoy {
  position: fixed;
  bottom: 0;
  right: 0;
  padding: 5px;
  border-radius: 5px 0 0 0;
  font-size: 10px;
  background: $blue-grey-8;
  color: white;
  -webkit-user-select: none;
}

//  toggle playlist
.playlist-toggle{
  position absolute;
  right 0;
  top 2rem;
  width 24px;
  height 2.5rem;
  transform translateY(-50%);
  color whitesmoke
  background $blue-grey;
  margin-top: 24px;
  border-radius: 10px 0 0 10px;
  box-shadow: 0 7px 20px 0 rgba(0,0,0,0.2);
  cursor: pointer;

  text-align center;
  display flex;
  align-items center;
  justify-content center;

  transition all ease 0.2s;

  &:hover{
    height 4rem;
    width 26px;
  }
}
</style>

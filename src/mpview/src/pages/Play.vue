<template>
  <q-page padding>
    <!-- control panel -->
    <div class="row justify-center control-wraper">
      <div class="control-panel" :class="loaded ? '' : 'hide'">
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
        />
      </div>
    </div>
  </q-page>
</template>

<script>
import SeekBar from "components/SeekBar.vue";
import BottomBar from "components/BottomBar.vue";
const { remote } = window.require("electron");
const fs = window.require("fs");
const IPC = remote.require("./src_electron/IPC_client");

let input_conf = [];
function handle_key_event(ev) {
  console.log(ev);
  let key = ev.key;
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
  }

  let cmd = input_conf.find((item, index) => {
    return item.key === key;
  });
  if (cmd) {
    console.log(cmd);
    IPC.send_command(cmd.command, cmd.args);
    ev.preventDefault();
  }
}

export default {
  data() {
    return {
      loaded: false,
      is_playing: true,
      playback_detail: {
        title: undefined,
        volume: undefined,
        time_pos: 0,
        duration: 0,
        size: {
          width: undefined,
          height: undefined
        }
      }
    };
  },
  components: {
    SeekBar,
    BottomBar
  },
  methods: {
    init() {
      IPC.once("file-loaded", () => {
        this.loaded = true;
        console.log("start init");
        IPC.get_property("volume").then(vol => {
          this.playback_detail.volume = vol;
        });
        IPC.get_property("media-title").then(title => {
          this.playback_detail.title = title;
        });
        IPC.get_property("duration").then(dur => {
          this.playback_detail.duration = dur;
        });
        IPC.observe_property("time-pos");
        IPC.on("time-pos-change", _time_pos => {
          // throttle
          _time_pos = _time_pos.toFixed(0);
          if (_time_pos !== this.playback_detail.time_pos) {
            this.playback_detail.time_pos = _time_pos;
          }
        });
        IPC.observe_property("volume");
        IPC.on("volume-change", _volume => {
          this.playback_detail.volume = _volume;
        });
        IPC.on("pause", () => {
          this.is_playing = false;
        });
        IPC.on("unpause", () => {
          this.is_playing = true;
        });
        IPC.on("end-file", () => {
          // TODO: play to the end. Stop or play next video.
          this.$emit("stop");
        });
      });
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
      document.removeEventListener("keydown", handle_key_event);
      IPC.send_command("stop");
    },
    set_volume(e) {
      console.log(e);
      let target_bound = e.target.getBoundingClientRect();
      let pos = Math.round(e.clientX - target_bound.left);
      IPC.set_property("volume", [pos]);
    },
    bind_keys() {
      // use input_conf to setup keys binding
      function register_key_event() {
        document.addEventListener("keydown", handle_key_event);
      }

      // parse input.conf
      fs.readFile("./mpv_config/input.conf", (err, data) => {
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
        register_key_event();
      });
    }
  },
  created() {
    this.init();
    this.bind_keys();
  }
};
</script>

<style lang="stylus" scoped>
.control-wraper {
  position: fixed;
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
</style>

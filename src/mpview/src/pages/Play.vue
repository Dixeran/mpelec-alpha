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
const IPC = remote.require("./src_electron/IPC_client");

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
        IPC.on("end-file", () => {
          // TODO: play to the end. Stop or play next video.
        });
      });
    },
    pause() {
      IPC.set_property("pause", [true]).then(() => {
        this.is_playing = false;
      });
    },
    restart() {
      IPC.set_property("pause", [false]).then(() => {
        this.is_playing = true;
      });
    },
    seek(e) {
      console.log(e);
      let target_bound = e.target.getBoundingClientRect();
      console.log(target_bound);
      let pos_persent = (e.clientX - target_bound.left) / target_bound.width;
      let pos_sec = pos_persent * this.playback_detail.duration;
      IPC.send_command("seek", [pos_sec, "absolute"]);
    },
    stop() {
      IPC.send_command("stop").then(() => {
        this.$emit("stop");
      });
    },
    set_volume(e) {
      console.log(e);
      let target_bound = e.target.getBoundingClientRect();
      let pos = Math.round(e.clientX - target_bound.left);
      IPC.set_property("volume", [pos]);
    }
  },
  created() {
    this.init();
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

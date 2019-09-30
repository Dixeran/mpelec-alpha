<template>
  <q-page padding>
    <!-- control panel -->
    <div class="row justify-center control-wraper">
      <div class="control-panel">
        <!-- seek bar -->
        <div v-if="loaded" class="seek-bar" @click="seek($event)">
          <span class="seek-bar-text seek-bar-title">{{playback_detail.title}}</span>
          <span class="seek-bar-text seek-bar-time">{{time_pos_str}} / {{duration_str}}</span>
          <div
            class="seek-bar-progress"
            :style="'width:' + (playback_detail.time_pos / playback_detail.duration) * 100 + '%;'"
          ></div>
        </div>

        <!-- bottom controls -->
        <div v-if="loaded" class="row items-center bottom-bar">
          <div class="bottom-play-control">
            <q-btn-group class="bottom-btn-group" flat>
              <q-btn size="sm" icon="play_arrow" v-if="!is_playing" @click="restart"></q-btn>
              <q-btn size="sm" icon="pause" v-else @click="pause"></q-btn>
              <q-btn size="sm" icon="stop"></q-btn>
            </q-btn-group>
          </div>
          <div class="bottom-list-control">
            <q-btn-group class="bottom-btn-group" flat>
              <q-btn size="sm" icon="skip_previous"></q-btn>
              <q-btn size="sm" icon="skip_next"></q-btn>
            </q-btn-group>
          </div>
          <div class="self-end bottom-volume">===</div>
        </div>

        <!-- before loaded (video may have started) -->
        <q-circular-progress
          v-if="!loaded"
          indeterminate
          size="2rem"
          color="primary"
          class="loading-bar"
        />
      </div>
    </div>
  </q-page>
</template>

<script>
const { remote } = window.require("electron");
const IPC = remote.require("./src_electron/IPC_client");
function Sec2TimeStr(sec) {
  let sec_num = Math.floor(sec);
  let hours = Math.floor(sec_num / 3600);
  let minutes = Math.floor((sec_num % 3600) / 60);
  let seconds = Math.floor(sec_num % 60);
  return `${hours.toString().padStart(2, "0")}:
    ${minutes.toString().padStart(2, "0")}:
    ${seconds.toString().padStart(2, "0")}`;
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
    }
  },
  computed: {
    time_pos_str() {
      return Sec2TimeStr(this.playback_detail.time_pos);
    },
    duration_str() {
      let dur = this.playback_detail.duration;
      return dur !== 0 ? Sec2TimeStr(dur) : "--:--:--";
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

  // seek bar with title, text, progress
  & > .seek-bar {
    position: relative;
    height: 50%;

    & > .seek-bar-text {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      pointer-events: none;
    }

    & > .seek-bar-title {
      left: 10px;
    }

    & > .seek-bar-time {
      right: 10px;
    }

    & > .seek-bar-progress {
      width: 10%;
      height: 100%;
      box-sizing: border-box;
      background: linear-gradient(to right, $blue-4, $blue-5);
      border-right: 3px solid $blue-grey;
      pointer-events: none;
      transition: all ease 0.5s;
    }
  }

  // bottom bar with contorl button
  & > .bottom-bar {
    height: 50%;
    border-top: 0.5px solid rgba(0, 0, 0, 0.1);

    & > * {
      height: 100%;
    }

    & .bottom-btn-group {
      height: 100%;
    }
  }

  & >.loading-bar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
  }
}
</style>

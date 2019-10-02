<template>
  <div
    class="seek-bar"
    @click="seek($event)"
    @mouseenter="hover($event)"
    @mouseleave="quit($event)"
    @mousemove="selecting($event)"
  >
    <span class="seek-bar-text seek-bar-title">{{playback_detail.title}}</span>
    <span class="seek-bar-text seek-bar-time">{{time_pos_str}} / {{duration_str}}</span>
    <div
      class="seek-bar-progress"
      :style="'width:' + (playback_detail.time_pos / playback_detail.duration) * 100 + '%;'"
    ></div>
    <div class="seek-bar-indicator" v-if="is_hover" :style="`left: ${hover_pos}px;`">
      <q-tooltip
        ref="tooltip"
        :value="is_hover"
        :content-class="'seek-bar-tooltip'"
      >{{selecting_time}}</q-tooltip>
    </div>
  </div>
</template>

<script>
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
  props: {
    playback_detail: {
      required: true
    }
  },
  data() {
    return {
      is_hover: false,
      hover_pos: 0,
      selecting_time: ""
    };
  },
  methods: {
    seek(event) {
      this.$emit("seek", event);
    },
    hover(e) {
      this.is_hover = true;
    },
    quit(e) {
      this.is_hover = false;
    },
    selecting(e) {
      if (this.is_hover) {
        let target_bound = e.target.getBoundingClientRect();
        let pos = e.clientX - target_bound.left;
        this.hover_pos = pos;
        this.selecting_time = Sec2TimeStr(
          (pos / target_bound.width) * this.playback_detail.duration
        );
        this.$refs.tooltip.updatePosition();
      }
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
  }
};
</script>

<style lang="stylus" scoped>
.seek-bar {
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
    transition: all ease 0.3s;
  }

  & > .seek-bar-indicator {
    position: absolute;
    top: 0;
    // left: 50%;
    height: 100%;
    box-sizing: border-box;
    width: 3px;
    transform: translateX(-50%);
    background: $red;
    box-shadow: 0 0 3px 0 rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }
}
</style>

<style lang="stylus">
.seek-bar-tooltip {
  max-height: 100px !important;
}
</style>

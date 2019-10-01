<template>
  <div class="seek-bar" @click="seek($event)">
    <span class="seek-bar-text seek-bar-title">{{playback_detail.title}}</span>
    <span class="seek-bar-text seek-bar-time">{{time_pos_str}} / {{duration_str}}</span>
    <div
      class="seek-bar-progress"
      :style="'width:' + (playback_detail.time_pos / playback_detail.duration) * 100 + '%;'"
    ></div>
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
    return {};
  },
  methods: {
    seek(event) {
      this.$emit("seek", event);
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
}
</style>

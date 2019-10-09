<template>
  <div class="row items-center bottom-bar">
    <div class="bottom-play-control">
      <q-btn-group class="bottom-btn-group" flat>
        <q-btn size="sm" icon="play_arrow" v-if="!is_playing" @click="restart"></q-btn>
        <q-btn size="sm" icon="pause" v-else @click="pause"></q-btn>
        <q-btn size="sm" icon="stop" @click="stop"></q-btn>
        <q-btn size="sm" icon="camera" @click="$emit('request_thumbs')"></q-btn>
      </q-btn-group>
    </div>
    <div class="bottom-list-control">
      <q-btn-group class="bottom-btn-group" flat>
        <q-btn size="sm" icon="skip_previous"></q-btn>
        <q-btn size="sm" icon="skip_next"></q-btn>
      </q-btn-group>
    </div>
    <!-- volume control -->
    <div class="row items-center bottom-volume">
      <div class="col-1">
        <q-icon name="volume_up"></q-icon>
      </div>
      <div class="volume-bar cursor-pointer" @click="set_volume($event)">
        <div
          class="volume-bar-mask"
          :style="`width: ${playback_detail.volume <= 100 ? playback_detail.volume : 100}px;`"
        ></div>
        <div
          class="volume-bar-dot"
          :style="`left: ${playback_detail.volume <= 100 ? playback_detail.volume : 100}px;`"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    is_playing: {
      type: Boolean,
      required: true
    },
    playback_detail: {
      required: true
    }
  },
  data() {
    return {};
  },
  methods: {
    restart() {
      this.$emit("restart");
    },
    pause() {
      this.$emit("pause");
    },
    stop() {
      this.$emit("stop");
    },
    set_volume(event) {
      this.$emit("set_volume", event);
    }
  }
};
</script>

<style lang="stylus" scoped>
.bottom-bar {
  height: 50%;
  border-top: 0.5px solid rgba(0, 0, 0, 0.1);
  position: relative;

  & > * {
    height: 100%;
  }

  // buttons on bottom-bar
  & .bottom-btn-group {
    height: 100%;
  }

  // volume control
  & > .bottom-volume {
    position: absolute;
    right: 0;
    height: 100%;

    & > .volume-bar {
      background-color: rgba(0, 0, 0, 0.1);
      width: 100px;
      height: 8px;
      border-radius: 10px;
      margin: 0 10px;
      position: relative;

      & > .volume-bar-mask {
        position: absolute;
        top: 0;
        bottom: 0;
        margin: auto 0;
        height: 8px;
        border-radius: 10px;
        background-color: $blue-5;
        transition: all ease 0.3s;
        pointer-events: none;
      }

      & > .volume-bar-dot {
        position: absolute;
        top: 0;
        bottom: 0;
        margin: auto 0;
        width: 12px;
        height: 12px;
        border-radius: 2px;
        background: white;
        box-shadow: 0px 3px 10px 0px rgba(0, 0, 0, 0.1);
        transform: translateX(-50%);
        border: solid 0.5px rgba(0, 0, 0, 0.1);
        transition: all ease 0.3s;
        pointer-events: none;
      }
    }
  }
}
</style>

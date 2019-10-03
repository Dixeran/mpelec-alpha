<template>
  <q-layout
    view="hHh Lpr fFf"
    class="mpv-layout"
    :class="{'show-bg': !is_playing}"
    @mousemove.native="check_visible($event)"
  >
    <!-- nav -->
    <q-bar class="q-electron-drag bg-white mpv-nav" :class="{'visible': is_visible}">
      <div class="cursor-pointer">File</div>
      <div class="cursor-pointer">Edit</div>
      <div class="cursor-pointer gt-xs">View</div>
      <div class="cursor-pointer gt-xs">Window</div>
      <div class="cursor-pointer">Help</div>
      <q-space />
      <q-btn dense flat icon="minimize" @click="form_control('minimize')" />
      <q-btn dense flat icon="crop_square" @click="form_control('maximize')" />
      <q-btn dense flat icon="fullscreen" @click="form_control('fullscreen')" />
      <q-btn dense flat icon="close" @click="form_control('close')" />
    </q-bar>

    <q-page-container>
      <!-- This is where pages get injected -->
      <router-view @fullscreen="form_control('fullscreen')" @stop="playback_stop" />
    </q-page-container>
  </q-layout>
</template>

<script>
const { ipcRenderer, remote } = window.require("electron");
const IPC = remote.require("./src_electron/IPC_client");
export default {
  // name: 'LayoutName',
  data() {
    return {
      is_playing: false,
      is_visible: true
    };
  },
  methods: {
    form_control(cmd) {
      ipcRenderer.send(cmd);
    },
    playback_stop() {
      ipcRenderer.send("playback-stop");
      this.$router.push("/");
      this.is_playing = false;
      this.is_visible = true;
    },
    check_visible(e) {
      // automatically hide when is playing
      if (!this.is_playing) return;

      if (e.clientY < 100) {
        this.is_visible = true;
      } else this.is_visible = false;
    }
  },
  mounted() {
    ipcRenderer.on("playback-start", () => {
      this.is_playing = true;
      this.$router.push("play");
    });
  }
};
</script>

<style lang="stylus" scoped>
.bg-white {
  background-color: white;
}

.mpv-layout {
  height: 100vh;
  padding-top: 24px;
  transition: all ease 0.5s;
  border-radius: 10px;

  &.show-bg {
    background-color: whitesmoke;
  }
}

.mpv-nav {
  box-shadow: 0 5px 20px 0px rgba(0, 0, 0, 0.2);
  margin: 0 24px;
  border-radius: 65535px;
  transition: all ease 0.3s;
  opacity: 0;

  &.visible {
    opacity: 1;
  }
}
</style>

<template>
  <q-layout
    view="hHh Lpr fFf"
    class="mpv-layout"
    :class="{ 'show-bg': !is_playing }"
    @mousemove.native="check_visible($event)"
  >
    <!-- nav -->
    <q-bar
      class="q-electron-drag bg-white mpv-nav"
      :class="{ visible: is_visible }"
    >
      <q-icon name="img:statics/icon.png"></q-icon>
      <div class="text-weight-bold">Mpelec Alpha</div>
      <div class="cursor-pointer q-electron-drag--exception">
        Help
        <q-menu>
          <q-list dense style="min-width: 100px">
            <q-item clickable v-close-popup>
              <q-item-section @click="show_about = true">About</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </div>
      <q-space />
      <q-btn dense flat icon="minimize" @click="form_control('minimize')" />
      <q-btn dense flat icon="crop_square" @click="form_control('maximize')" />
      <q-btn dense flat icon="fullscreen" @click="form_control('fullscreen')" />
      <q-btn dense flat icon="close" @click="form_control('close')" />
    </q-bar>

    <!-- about dialog -->
    <q-dialog
      v-model="show_about"
      seamless
      transition-show="flip-down"
      transition-hide="flip-up"
    >
      <q-card class="bg-primary text-white">
        <q-bar>
          <q-space />

          <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip content-class="bg-white text-primary">Close</q-tooltip>
          </q-btn>
        </q-bar>

        <q-card-section>
          <div class="text-h6">About</div>
        </q-card-section>

        <q-card-section>
          <p>
            MPV player with GUI based on Electron. For more detail, please visit
            Github repo - https://github.com/Dixeran/mpelec-alpha
          </p>
          <div>
            Icons made by
            <a href="https://www.flaticon.com/authors/freepik" title="Freepik">
              Freepik
            </a>
            from
            <a href="https://www.flaticon.com/" title="Flaticon">
              www.flaticon.com
            </a>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-page-container>
      <!-- This is where pages get injected -->
      <router-view
        @fullscreen="form_control('fullscreen')"
        @stop="playback_stop"
      />
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
      is_visible: true,
      show_about: false
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

      this.is_visible = e.clientY < 100;
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
  box-shadow: 0 5px 20px 0 rgba(0, 0, 0, 0.2);
  margin: 0 24px;
  border-radius: 65535px;
  transition: all ease 0.3s;
  opacity: 0;

  &.visible {
    opacity: 1;
  }
}
</style>

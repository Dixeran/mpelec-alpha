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

    <!-- playlist -->
    <q-drawer
      v-model="drawer"
      overlay
      side="right"
      behavior="desktop"
      style="width: 300px"
    >
      <PlayList
        :list="playlist"
        :current="current"
        @play="open_list_file"
        @delete_item="delete_list_item"
      />
      <div class="q-mini-drawer-hide absolute" style="top: 100px; left: -17px">
        <q-btn
          v-if="drawer"
          dense
          round
          push
          unelevated
          color="primary"
          icon="chevron_right"
          @click="drawer = false"
        />
      </div>
    </q-drawer>
    <!-- drawer mask -->
    <div class="playlist-mask" v-if="drawer" @click.stop="drawer = false"></div>

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
        @end_file="end_file"
        @stop="playback_stop"
        @show_list="drawer = true"
        ref="router_view"
      ></router-view>
    </q-page-container>
  </q-layout>
</template>

<script>
const { ipcRenderer, remote } = window.require("electron");
const IPC = remote.require("./src_electron/IPC_client");
import PlayList from "components/PlayList.vue";

export default {
  components: {
    PlayList
  },
  data() {
    return {
      is_playing: false,
      is_visible: true,
      show_about: false,
      drawer: false,
      playlist: [],
      current: ""
    };
  },
  methods: {
    form_control(cmd) {
      if (cmd === "close") {
        IPC.get_property("idle-active").then(is_idle => {
          if (is_idle) {
            ipcRenderer.send(cmd);
          } else {
            ipcRenderer.once("saved-history", () => {
              ipcRenderer.send(cmd);
            });
            if (this.$refs.router_view.cleanUp()) {
              ipcRenderer.send(cmd);
            }
          }
        });
      } else ipcRenderer.send(cmd);
    },
    playback_stop(pos_percent) {
      // click stop btn
      ipcRenderer.send("save-history", pos_percent);
      ipcRenderer.send("playback-stop");
      this.$router.push("/");
      this.is_playing = false;
      this.is_visible = true;
    },
    check_visible(e) {
      // automatically hide when is playing
      if (!this.is_playing) return;

      this.is_visible = e.clientY < 100;
    },
    open_list_file(item) {
      // this.$router.push("/");
      ipcRenderer.send("open-list-file", item);
    },
    delete_list_item(item_list) {
      item_list.forEach(item => {
        this.playlist.splice(this.playlist.indexOf(item), 1);
      });
    },
    end_file(pos_percent) {
      // naturally play to the end
      let list_pos = this.playlist.indexOf(this.current);
      if (list_pos === this.playlist.length - 1) {
        //  last file ended
        this.playback_stop(pos_percent);
      } else {
        ipcRenderer.send("save-history", pos_percent);
        this.open_list_file(this.playlist[list_pos + 1]);
      }
    }
  },
  mounted() {
    ipcRenderer.on("playback-start", () => {
      this.is_playing = true;
      this.$router.push("play");
    });
    ipcRenderer.on("set-playlist", (event, arg) => {
      console.log(arg);
      this.playlist = arg.list || this.playlist || [];
      this.current = arg.current || this.current || "";
    });
    ipcRenderer.on("set-history", (ev, history) => {
      console.log(history);
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

.playlist-mask{
  z-index 200;
  position fixed;
  left 0;
  top 0;
  height 100vh;
  width 100vw;
  opacity 0.1;
  background-color rgba(0, 0, 0, 0.1);
}
</style>

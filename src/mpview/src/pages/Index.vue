<template>
  <q-page style="margin-top: 10px;">
    <div class="row justify-center">
      <div
        class="drop-area column items-center"
        :class="is_draging ? 'effect' : ''"
        @dragenter.prevent
        @dragover.prevent="drag_over"
        @dragleave="drag_leave"
        @drop.prevent="drop"
      >
        <h1>Drop to play</h1>
        <q-icon name="arrow_downward"></q-icon>
      </div>
    </div>
    <div class="row justify-center">
      <q-btn
        outline
        class="open-file-btn"
        color="white"
        text-color="primary"
        size="lg"
        label="OPEN FILE"
        @click="open_file"
      />
    </div>
  </q-page>
</template>

<script>
const { ipcRenderer, remote } = window.require("electron");
export default {
  data() {
    return {
      is_draging: false
    };
  },
  methods: {
    drag_over(event) {
      this.is_draging = true;
    },
    drag_leave() {
      this.is_draging = false;
    },
    drop(event) {
      let file = event.dataTransfer.files[0];
      console.log(file);
      ipcRenderer.send("open-file", {
        name: file.name,
        path: file.path,
        size: file.size,
        type: file.type
      });
    },
    open_file() {
      remote.dialog
        .showOpenDialog(null, {
          properties: ["openFile", "multiSelections"]
        })
        .then(result => {
          if (!result.canceled) {
            console.log(result.filePaths);
            ipcRenderer.send("open-file", {
              path: result.filePaths[0]
            });
          }
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
};
</script>

<style lang="stylus" scoped>
.drop-area {
  position: relative;
  width: 100%;
  -webkit-user-select: none;
  transition: all ease 0.5s;

  & > i {
    font-size: 4rem;
  }

  &.effect {
    color: $primary;
  }
}

.open-file-btn {
  margin-top: 24px;
}
</style>

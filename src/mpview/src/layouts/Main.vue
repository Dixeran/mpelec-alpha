<template>
  <q-layout view="hHh Lpr fFf">
    <!-- nav -->
    <q-bar class="q-electron-drag bg-blue-grey-8 text-white">
      <div class="cursor-pointer">File</div>
      <div class="cursor-pointer">Edit</div>
      <div class="cursor-pointer gt-xs">View</div>
      <div class="cursor-pointer gt-xs">Window</div>
      <div class="cursor-pointer">Help</div>
      <q-space />
      <q-btn dense flat icon="minimize" />
      <q-btn dense flat icon="crop_square" />
      <q-btn dense flat icon="close" @click="close" />
    </q-bar>

    <q-page-container>
      <!-- This is where pages get injected -->
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
const { ipcRenderer } = window.require("electron");
export default {
  // name: 'LayoutName',
  data() {
    return {
      leftDrawer: true
    };
  },
  methods: {
    close() {
      ipcRenderer.send("close");
    }
  }
};
</script>

<style scoped>
.bg-white {
  background-color: white;
}
</style>

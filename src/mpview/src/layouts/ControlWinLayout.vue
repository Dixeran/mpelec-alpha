<template>
  <q-layout view="hHh Lpr fFf">
    <q-bar class="q-electron-drag">
      <q-icon name="img:statics/icon.png"></q-icon>
      <div class="text-weight-bold">Control Window</div>
      <q-space />
      <q-btn dense flat icon="close" />
    </q-bar>

    <q-page-container>
      <!-- This is where pages get injected -->
      <router-view></router-view>
    </q-page-container>
  </q-layout>
</template>

<script>
export default {
  name: "ControlWinLayout"
};
</script>

<style lang="stylus" scoped></style>

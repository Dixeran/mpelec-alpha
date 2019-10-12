<template>
  <q-scroll-area class="fit">
    <q-list dense>
      <q-item-label header>PLAYLIST</q-item-label>
      <q-item clickable v-for="item in list" :key="item">
        <q-item-section>{{item}}</q-item-section>
      </q-item>
    </q-list>
  </q-scroll-area>
</template>

<script>
export default {
  name: "PlayList",
  props:{
    list:{
      type: Array,
      default: []
    },
    current:{
      type: String,
      default: ''
    }
  }
};
</script>

<style lang="stylus" scoped></style>

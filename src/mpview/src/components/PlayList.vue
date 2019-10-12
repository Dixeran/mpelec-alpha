<template>
  <q-scroll-area class="fit">
    <q-list dense separator class="playlist">
      <q-item-label header>PLAYLIST</q-item-label>
      <q-item
        clickable
        v-for="item in list"
        :key="item"
        class="playlist-item"
        :active="item === current"
        :active-class="'playlist-active'"
        :class="{ 'playlist-selected': isSelected(item) }"
        @click="toggle($event, item)"
        @dblclick="play(item)"
      >
        <q-item-section>{{ item }}</q-item-section>
      </q-item>
    </q-list>
  </q-scroll-area>
</template>

<script>
export default {
  name: "PlayList",
  props: {
    list: {
      type: Array,
      default: []
    },
    current: {
      type: String,
      default: ""
    }
  },
  data() {
    return {
      selected: []
    };
  },
  methods: {
    isSelected(item) {
      return this.selected.includes(item);
    },
    toggle(ev, item) {
      // multi selection
      if (ev.shiftKey) {
        return;
      } else if (ev.ctrlKey) {
        return;
      }
      else{
        // single selection
        if (!this.selected.includes(item)) {
          this.selected.length = 0;
          this.selected.push(item);
        }
        else if(this.selected.length === 1) {
          this.selected.splice(this.selected.indexOf(item), 1);
        }
      }
    },
    play(item){
      console.log('play' + item);
      this.$emit('play', item);
    }
  }
};
</script>

<style lang="stylus">
.playlist {
  -webkit-user-select none;
}

.playlist-item {
  padding 4px 16px !important;
  font-size 12px;
  transition all ease 0.3s;

  &.playlist-active {
    color white;
    background-color $blue-6;
  }
  &.playlist-selected{
    color: $primary;
    background-color inherit;
  }
  &.playlist-active.playlist-selected{
    color $primary;
    background-color $blue-1;
  }
}
</style>

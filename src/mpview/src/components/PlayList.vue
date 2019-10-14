<template>
  <q-scroll-area
    class="fit"
    ref="dom_list"
    @keydown.native.stop="handle_key($event)"
  >
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
      console.log(ev);
      if (ev.shiftKey) {
        if (!this.selected.includes(item) && this.selected.length > 0) {
          const cur_pos = this.list.indexOf(item);
          const last_pos = this.list.indexOf(
            this.selected[this.selected.length - 1]
          );
          for (
            let i = Math.min(cur_pos, last_pos);
            i <= Math.max(cur_pos, last_pos);
            i++
          ) {
            const _item = this.list[i];
            if (!this.selected.includes(_item)) this.selected.push(_item);
          }
        }
      } else if (ev.ctrlKey) {
        if(this.selected.includes(item)){
          this.selected.splice(this.selected.indexOf(item), 1);
        } else this.selected.push(item);
      } else {
        // single selection
        if (!this.selected.includes(item) || this.selected.length > 1) {
          this.selected.length = 0;
          this.selected.push(item);
        } else if (this.selected.length === 1) {
          this.selected.splice(this.selected.indexOf(item), 1);
        }
      }
    },
    play(item) {
      console.log("play" + item);
      this.$emit("play", item);
    },
    handle_key(ev) {
      if (ev.key === "Delete") {
        this.$emit("delete_item", this.selected);
        this.selected.length = 0;
      }
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
  font-size 11px;
  transition all ease 0.3s;

  &.playlist-active {
    color white;
    background-color $blue-6;
  }
  &.playlist-selected{
    color: $primary;
    background-color inherit;
    border-left 4px solid $primary;
  }
  &.playlist-active.playlist-selected{
    color $primary;
    background-color $blue-1;
  }
}
</style>

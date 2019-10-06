<template>
  <q-menu
    touch-position
    context-menu
    square
    :value="show"
    @show="$emit('changed', true)"
    @hide="$emit('changed', false)"
    content-class="ctx-menu"
  >
    <q-list class="ctx-menu" dense style="min-width: 150px">
      <!-- track selector -->
      <q-item-label header>Select tracks</q-item-label>
      <q-item clickable v-for="(array, type) in tracks" :key="type">
        <q-item-section>{{type}}</q-item-section>
        <q-item-section side>
          <q-icon name="keyboard_arrow_right" />
        </q-item-section>

        <q-menu auto-close anchor="top right" self="top left" square>
          <q-list dense>
            <q-item
              v-for="item in array"
              :key="item.id"
              clickable
              @click="$emit('set_track', item)"
            >
              <q-item-section
                v-if="item.type === 'video'"
              >{{`[${item.codec}] [${item['demux-w']} : ${item['demux-h']}]`}}</q-item-section>
              <q-item-section v-else>{{item.title ? item.title : item.codec}}</q-item-section>
              <q-item-section side v-if="item.selected">
                <q-icon name="check" color="primary" />
              </q-item-section>
            </q-item>
            <q-item v-if="array.length == 0">
              <q-item-section>Empty</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script>
export default {
  name: "ctx-menu",
  model: {
    prop: "show",
    event: "changed"
  },
  props: {
    show: {
      type: Boolean
    },
    tracks: {
      type: Object,
      required: true
    }
  }
};
</script>

<style lang="stylus">
.ctx-menu {
  text-transform: capitalize;
}
</style>

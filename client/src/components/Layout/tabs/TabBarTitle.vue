<template>
  <div class="tab-title flex">
    <span class="tab-text">{{ content.title }}</span>
    <span class="tab-close" @click="onTabRemove">
      X
    </span>
  </div>
</template>

<script>
export default {
  props: {
    content: { type: Object, required: true }
  },
  methods: {
    onTabRemove() {
      this.$emit('tabRemove', this.content);
    }
  }
};
</script>

<style scoped>
.tab-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--dark-400);
}

.tab-close {
  cursor: pointer;
  margin-left: 10px;
  color: var(--warm-400);
  transition: all 0.2s ease;
}

.tab-close:hover {
  color: var(--alert-600);
  transform: scale(1.1);
}

li[aria-selected="true"] .tab-title {
  font-weight: bold;
  color: var(--dark-400);
}

.tab-title:hover {
  transition: color 100ms ease-in;
  color: var(--kendo-color-primary)
}
</style>

<template>
  <TabBar :activeTab="activeTab"></TabBar>
</template>

<script>
// Not much to this View, it's just to organize the components better and to make a clearer "view" of the App's entry point.
import TabBar from "@/components/Layout/tabs/TabBar.vue";
export default {
  props: ["activeTab"],
  components: { TabBar },
};
</script>

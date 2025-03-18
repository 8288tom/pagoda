<template>
  <div class="tab-container">
    <TabStrip :selected="selected" @select="onSelect" ref="tabstrip" :animation="false">
      <TabStripTab
        v-for="tab in tabs"
        :key="tab.id"
        :title="tab.title"
        :titleRender="() => customTitleRender(tab)"
        :contentClassName="'tabstriptab'"
      >
        <component
          :is="getTabComponent(tab)"
          v-if="tab && !tab.isHidden"
          :tabletype="tab.id"
        ></component>
      </TabStripTab>
    </TabStrip>
  </div>
</template>

<script>
import { h } from "vue";
import { TabStrip, TabStripTab } from "@progress/kendo-vue-layout";
import TabBarTitle from "./TabBarTitle.vue";
import Table from "@/components/TableComponents/grid/GridTable.vue";
import ToolsContainer from "@/components/ToolsComponents/ToolsContainer.vue";
import AiAds from "@/components/AIComponents/AiAds.vue";
export default {
  components: {
    TabStrip,
    TabStripTab,
    Table,
    ToolsContainer,
    AiAds,
  },
  props: { activeTab: { type: String, required: true } }, //Pass active tab from router
  data() {
    return {
      selected: 0,
      supressOnSelect: false, //exists to ignore select when closing tab
      tabs: [
        {
          id: "accounts",
          title: "Accounts",
          content: "Accounts",
          titleRender: "titleRender",
          isHidden: true,
          isTable: true,
        },
        {
          id: "users",
          title: "Users",
          content: "Users",
          titleRender: "titleRender",
          isHidden: true,
          isTable: true,
        },
        {
          id: "storyboards",
          title: "Storyboards",
          content: "Storyboards",
          titleRender: "titleRender",
          isHidden: true,
          isTable: true,
        },
        {
          id: "scenelibraries",
          title: "Scene Libraries",
          content: "SceneLibraries",
          titleRender: "titleRender",
          isHidden: true,
          isTable: true,
        },
        {
          id: "storages",
          title: "Storages",
          content: "Storages",
          titleRender: "titleRender",
          isHidden: true,
          isTable: true,
        },
        {
          id: "outputconfigs",
          title: "Output Configs",
          content: "OutputConfigs",
          titleRender: "titleRender",
          isHidden: true,
          isTable: true,
        },
        {
          id: "landingpages",
          title: "Landing Pages",
          content: "LandingPages",
          titleRender: "titleRender",
          isHidden: true,
          isTable: true,
        },
        {
          id: "aiads",
          title: "AI Ads",
          content: "AIAds",
          titleRender: "titleRender",
          isHidden: true,
          isTable: false,
        },
        {
          id: "tools",
          title: "Tools",
          content: "Tools",
          titleRender: "titleRender",
          isHidden: true,
          isTable: false,
        },
      ],
    };
  },
  methods: {
    getTabComponent(tab) {
      if (tab.isTable) return Table;
      if (tab.id === "tools") return ToolsContainer;
      if (tab.id === "aiads") return AiAds;
      return null;
    },
    onSelect(e) {
      if (this.supressOnSelect) {
        this.supressOnSelect = false;
        return;
      }
      this.selected = e.selected;
      this.$router.push(`/${this.tabs[e.selected].id}`);
    },
    customTitleRender(tab) {
      return h(TabBarTitle, {
        content: tab,
        onTabRemove: () => this.onTabRemove(tab),
      });
    },
    onTabRemove(tab) {
      tab.isHidden = true;
      this.removeFromLocalStorage(tab.id);
      this.updateTabDisplay();
      this.handleRouteChange(tab);
    },
    updateTabDisplay() {
      this.$nextTick(() => {
        const tabStripEl = this.$refs.tabstrip.$el;
        const loadedDomTabs = tabStripEl.querySelectorAll(".k-tabstrip-items .k-item");
        // if isHidden is true, setting display to 'none', otherwise to 'block' for the Tab itself
        // based on the this.tabs.length array and the DOM of the tabs, that means that the order matters.
        // had to use DOM due to KendoUI limitation of this component
        let i;
        for (i = 0; i < this.tabs.length; i++) {
          if (this.tabs[i].isHidden) loadedDomTabs[i].style.display = "none";
          else loadedDomTabs[i].style.display = "block";
        }
      });
    },
    handleRouteChange(tab) {
      const closeTabIndex = this.tabs.findIndex((t) => t.id === tab.id);
      const openTabs = this.tabs.filter((tab) => !tab.isHidden);
      const numOpenTabs = openTabs.length;

      if (closeTabIndex === this.selected) {
        //tab closed, still open tabs left
        if (numOpenTabs >= 1) {
          this.supressOnSelect = true;
          this.selected = numOpenTabs;
          this.$router.push(`/${openTabs[numOpenTabs - 1].id}`);
        }
        //tab closed, no open tabs left
        else this.$router.push("/");
      }
      // closed tab on right
      else if (closeTabIndex > this.selected) {
        this.supressOnSelect = true;
      }
      //closed tab on left
      else if (closeTabIndex < this.selected) {
        this.supressOnSelect = true;
      } else {
        console.error(
          "something unexpected happened on handleRouteChange, sending to root"
        );
        this.$router.push("/");
      }
    },
    addToLocalStorage(tabId) {
      if (!localStorage.openTabs) {
        return localStorage.setItem("openTabs", JSON.stringify([tabId]));
      }
      let tabs = JSON.parse(localStorage.getItem("openTabs"));
      if (!tabs.includes(tabId)) {
        tabs.push(tabId);
        return localStorage.setItem("openTabs", JSON.stringify(tabs));
      }
    },
    removeFromLocalStorage(tabId) {
      const tabs = JSON.parse(localStorage.getItem("openTabs"));
      const indexOfTabName = tabs.indexOf(tabId);
      if (indexOfTabName > -1) {
        tabs.splice(indexOfTabName, 1);
      }
      return localStorage.setItem("openTabs", JSON.stringify(tabs));
    },
    loadTabsFromLocalStorage() {
      const storedTabs = JSON.parse(localStorage.getItem("openTabs")) || [];
      this.tabs.forEach((tab) => {
        let i;
        for (i = 0; i < this.tabs.length; i++) {
          if (tab.id === storedTabs[i]) {
            tab.isHidden = false;
          }
        }
      });
      this.updateTabDisplay();
    },
  },

  watch: {
    activeTab: {
      handler(newTab) {
        this.tabs.forEach((tab) => {
          if (tab.id === newTab) tab.isHidden = false;
        });
        const activeTab = this.tabs.find((tab) => tab.id === newTab);
        if (activeTab) {
          activeTab.isHidden = false;
          this.addToLocalStorage(activeTab.id);
          this.selected = this.tabs.indexOf(activeTab); // Select the active tab
          this.updateTabDisplay();
        }
      },
      immediate: true,
    },
  },

  created() {
    this.loadTabsFromLocalStorage();
  },
};
</script>

<style scoped>
.tab-container {
  padding-top: 10px;
  margin-left: 20px;
  padding-right: 15px;
}

.k-disabled {
  display: none !important;
}

/* This prevents a bug upon resizing when more than 1 tab is open
without this class modification the elements will jump in the dom */
:deep(.k-animation-container-relative) {
  display: block;
}
</style>

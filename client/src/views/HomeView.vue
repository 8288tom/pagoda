<template>
  <div class="container">
    <Loader v-if="isLoading" :size="'large'" :type="'infinite-spinner'" class="loader"></Loader>

    <h1 v-if="shouldRenderCollections">Collection Overview</h1>
    <div class="collection-container" v-if="shouldRenderCollections">
      <Card v-for="item in collectionsItems" :key="item" class="collection-cards shadow">
        <CardHeader>
          <div class="flex card-header">
            <SvgIcon :icon="collectionMap[item].icon" class="svg-icon" :size="'xlarge'" />
            <CardTitle>{{ collectionMap[item].title }}</CardTitle>
          </div>
        </CardHeader>
        <CardBody>
          <CardSubtitle>{{ formattedCollectionCount[item] }}</CardSubtitle>
        </CardBody>
      </Card>
    </div>

    <h2 v-if="shouldRenderEnvTitle">Environment Overview</h2>
    <div class="charts-container flex">
      <template v-for="env in ['US', 'EU']">
        <Card v-if="shouldRenderCharts(env)" :key="env" :type="'success'" class="shadow">
          <div>
            <idmToolTip :text="tooltipMessage" :position="'left'" class="tooltip" :onHover="true" />
            <h1>{{ env }}</h1>
            <h2>Total Rendered: {{ totalRenders(env) }}</h2>
            <div class="us-container flex">
              <div class="donut-container">
                <h3>Top API Renders</h3>
                <DonutChart :elasticData="companiesBreakdown(env)" />
              </div>
              <div class="pie-container">
                <h3>Top Batch Renders</h3>
                <PieChart :elasticData="topBatches(env)" />
              </div>
            </div>
          </div>
        </Card>
      </template>
    </div>
  </div>
</template>


<script setup>
import { useApolloClient } from "@vue/apollo-composable";
import { onMounted, computed, ref } from "vue";
import { Loader } from "@progress/kendo-vue-indicators";
import { Card, CardTitle, CardHeader, CardBody, CardSubtitle } from "@progress/kendo-vue-layout";
import { SvgIcon } from "@progress/kendo-vue-common";
import idmToolTip from "@/components/misc/IdmTooltip.vue";
import DonutChart from "@/components/HomeComponents/DonutChart.vue";
import PieChart from "@/components/HomeComponents/PieChart.vue";
import queries from "@/utils/queries";
import { initApp } from "@/utils/contextHelpers";
import { useStore } from "vuex";
import {
  thumbnailsLeftIcon,
  userIcon,
  imagesIcon,
  youtubeBoxIcon,
  aggregateFieldsIcon,
  videoExternalIcon,
} from "@progress/kendo-svg-icons";

// Apollo client and store
const { client: apolloClient } = useApolloClient();
const store = useStore();

// State variables
const isLoading = ref(false);
const elasticResultUS = ref(null);
const elasticResultEU = ref(null);

// Tooltip message
const tooltipMessage =
  "Estimated statistics from logs, data from the last 24 hours.\v\v\v\v For accurate statistics please check Analytics.";

// Formatter for numbers
const formatter = Intl.NumberFormat("en", { notation: "compact" });

// Collection map
const collectionMap = {
  account: { title: "Accounts", icon: userIcon },
  storyboard: { title: "Storyboards", icon: thumbnailsLeftIcon },
  canvas: { title: "Pages", icon: youtubeBoxIcon },
  scene_library: { title: "Scene Libraries", icon: imagesIcon },
  workspaces: { title: "Workspaces", icon: aggregateFieldsIcon },
  imsscene: { title: "Scenes", icon: videoExternalIcon },
};

// Queries
const initQuery = queries.home.initapp;
const elasticQuery = queries.home.getelasticresults;

// Fetch Elastic data for a given environment
async function fetchElasticData(env) {
  try {
    const { data } = await apolloClient.query({ query: elasticQuery, variables: { env } });
    if (data) {
      env === "us" ? (elasticResultUS.value = data.getElasticResults) : (elasticResultEU.value = data.getElasticResults);
    }
  } catch (e) {
    console.error(`Failed fetching Elastic data for ${env.toUpperCase()}`, e);
  }
}

onMounted(async () => {
  try {
    isLoading.value = true;
    await Promise.all([
      fetchElasticData("us"),
      // fetchElasticData("eu"),
      initApp(store, apolloClient, initQuery),
    ]);
    isLoading.value = false;
  } catch (e) {
    isLoading.value = false;
    console.error("Error during initialization:", e);
  }
});

// Utility functions for computed properties
function getElasticComputed(env, key) {
  return computed(() => {
    const result = env === "US" ? elasticResultUS.value : elasticResultEU.value;
    if (!result || !result[env]?.[key]) return [];
    return result[env][key].map((obj) => ({ name: obj.companyName, val: obj.value }));
  });
}

function getTotalRenders(env) {
  return computed(() => {
    const result = env === "US" ? elasticResultUS.value : elasticResultEU.value;
    return result?.[env]?.totalRenders ? formatter.format(result[env].totalRenders) : null;
  });
}

const companiesBreakdownUS = getElasticComputed("US", "companiesBreakdown");
const companiesBreakdownEU = getElasticComputed("EU", "companiesBreakdown");
const topBatchesUS = getElasticComputed("US", "topBatches");
const topBatchesEU = getElasticComputed("EU", "topBatches");
const totalRendersUS = getTotalRenders("US");
const totalRendersEU = getTotalRenders("EU");

function companiesBreakdown(env) {
  return env === "US" ? companiesBreakdownUS.value : companiesBreakdownEU.value;
}

function topBatches(env) {
  return env === "US" ? topBatchesUS.value : topBatchesEU.value;
}

function totalRenders(env) {
  return env === "US" ? totalRendersUS.value : totalRendersEU.value;
}

function shouldRenderCharts(env) {
  return env === "US" ? !!elasticResultUS.value?.US : !!elasticResultEU.value?.EU;
}

const collectionCount = computed(() => store.state.docCount);
const collectionsItems = computed(() => {
  const docCountArray = Object.keys(collectionCount.value).slice(1);
  docCountArray.forEach((docCount) => formatter.format(docCount));
  return docCountArray;
});

const formattedCollectionCount = computed(() => {
  const formatter = new Intl.NumberFormat("en-US");
  return Object.keys(collectionCount.value).reduce((acc, key) => {
    acc[key] = formatter.format(collectionCount.value[key]);
    return acc;
  }, {});
});

const shouldRenderCollections = computed(() => collectionsItems.value.length > 0);
const shouldRenderEnvTitle = computed(() => shouldRenderCharts('US'))
</script>

<style scoped>
.container {
  overflow-y: auto;
}

.charts-container {
  justify-content: center;
  gap: 100px;
}

.collection-container {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.us-container {
  flex-direction: row;
}

.k-card {
  border-color: var(--primary-400);
}

.k-card-success {
  background-color: #ffffff;
  border-color: var(--primary-500);
  padding-bottom: 10px;
}

.collection-cards {
  width: 200px;
  margin-top: 5px;
}

.tooltip {
  position: absolute;
  left: 95%;
  top: 1%;
}

h1,
h2,
h3,
.k-card-subtitle,
.k-card {
  color: var(--dark-500);
}

.card-header {
  gap: 15px;
}

.k-card-subtitle {
  font-size: 20px;
}

.k-card-title {
  margin-left: 10px;
}

.loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>

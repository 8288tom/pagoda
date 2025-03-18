<template>
  <the-header>
    <template v-slot:theme>
      <SvgIcon @click="changeTheme" :icon="dataIcon"></SvgIcon>
    </template>
  </the-header>
  <the-nav></the-nav>
  <main>
    <routerView />
  </main>
  <NotificationPopup :message="popupMessage" :type="popupMessageType"></NotificationPopup>
</template>

<script setup>
import TheHeader from "@/components/Layout/TheHeader";
import TheNav from "@/components/Layout/TheNav";
import { SvgIcon } from "@progress/kendo-vue-common";
import { dataIcon } from "@progress/kendo-svg-icons";
import { computed } from "vue";
import { useStore } from "vuex";
const store = useStore();
const popupMessage = computed(() => store.state.notificationMessage);
const popupMessageType = computed(() => store.state.notificationType);
</script>

<style>
:root {
  font-family: "Gill Sans MT", Helvetica, sans-serif;

  /* custom variables */
  --navbar-width: 50px;
  --header-height: 56px;
  --transition-500: 500ms;
  --primary-300: #cdedfe;
  --primary-400: #95daff;
  --primary-500: #62d9ff;
  --dark-20: #f7f8fa;
  --dark-30: #f2f3f594;
  --dark-100: #acbcc3;
  --dark-200: #839aa4;
  --dark-300: #5a7886;
  --dark-400: #305768;
  --dark-500: #07354a;
  --natural-100: #dbdbdb;
  --natural-300: #b5b5b5;
  --warm-400: #fdbc84;
  --alert-500: #e73200;
  --alert-600: #ff0302;
  --success-400: #9ef1b5;
  --success-500: #6cf091;
  --success-600: #1bd34f;
  --shadow: 0px 5px 20px rgba(7, 53, 74, 0.4);
  --text-primary: #b6b6b6;
  --text-secondary: #ececec;

  /* overwriting kendo variables: */
  /* --kendo-font-size: 1.5rem !important; */
  --kendo-color-primary: #1a6dff;
  --kendo-color-primary-on-surface: #646464;
  --kendo-color-primary-hover: #95daff;
  /* --kendo-font-size-lg: 2rem; */
  --kendo-base-text: #305768;
  --kendo-body-text: #305768;
  --kendo-color-on-app-surface: #305768;
  --kendo-color-base: #ececec;
  --kendo-color-on-base: var(--dark-400);
  --kendo-color-base: #fff;
  /* --kendo-color-border:color-mix(in srgb, var(--kendo-color-on-base, #3d3d3d) 50%, transparent); */
}

body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
  background-color: #ffff;
  text-align: center;
  box-sizing: border-box;
  background-color: var(--dark-20);
}

body::-webkit-scrollbar {
  width: 10px;
}

body::-webkit-scrollbar-track {
  background: #e9e9ec;
}

body::-webkit-scrollbar-thumb {
  background: var(--dark-300);
}

main {
  padding-left: var(--navbar-width);
  padding-top: var(--header-height);
  min-height: calc(100vh - var(--header-height));
}

.flex {
  display: flex;
}

.k-picker-solid {
  background-color: var(--kendo-color-surface-alt);
}

.custom-checkbox input {
  width: 17px;
  height: 17px;
  margin-right: 7px;
}

.input-container {
  flex-direction: column;
  margin: auto;
  width: 70%;
}

.button-loader-container div {
  position: absolute;
  margin-left: 10px;
}

.k-checkbox:checked {
  border-color: black;
}

.custom-dropdown,
.custom-input {
  border-color: color-mix(in srgb, var(--kendo-color-on-base, #3d3d3d) 50%, transparent);
  color: inherit;
}

.header {
  color: var(--dark-500);
}

.shadow {
  -webkit-box-shadow: -2px 6px 19px -8px rgba(0, 0, 0, 0.75);
  -moz-box-shadow: -2px 6px 19px -8px rgba(0, 0, 0, 0.75);
  box-shadow: -2px 6px 19px -8px rgba(0, 0, 0, 0.75);
}
</style>

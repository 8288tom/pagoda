<template>
  <div class="buttons-container">

    <div class="accounts-buttons" v-if="buttontype === `accounts`">
      <KButton :svg-icon="pencilIcon" :fill-mode="'outline'" :disabled="isClickable" @click="(ev) => onButtonClick(ev)"
        :theme-color="'tertiary'">
        Edit</KButton>
      <KButton :svg-icon="dollarIcon" :fill-mode="'outline'" :disabled="isClickable" @click="(ev) => onButtonClick(ev)"
        :theme-color="'warning'">
        Credits</KButton>
    </div>

    <div class="users-buttons" v-if="buttontype === `users`">
      <KButton :svg-icon="pencilIcon" :fill-mode="'outline'" :disabled="isClickable" @click="(ev) => onButtonClick(ev)"
        :theme-color="'tertiary'">
        Edit</KButton>
    </div>

    <div class="storyboards-buttons" v-if="buttontype === `storyboards`">
      <KButton :svg-icon="copyIcon" :fill-mode="'outline'" :disabled="isClickable" @click="(ev) => onButtonClick(ev)"
        :theme-color="'tertiary'">Copy
      </KButton>
      <KButton :svg-icon="arrowsSwapIcon" :fill-mode="'outline'" :disabled="isClickable"
        @click="(ev) => onButtonClick(ev)">Update</KButton>
    </div>

    <div class="scenelibrary-buttons" v-if="buttontype === `scenelibraries`">
      <KButton :svg-icon="replaceSingleIcon" :fill-mode="'outline'" :disabled="isClickable"
        @click="(ev) => onButtonClick(ev)" :theme-color="'tertiary'">Change Owner
      </KButton>
    </div>

    <div class="storage-buttons" v-if="buttontype === `storages`">
      <KButton :svg-icon="plusIcon" :fill-mode="'outline'" :disabled="isCreateClickable"
        @click="(ev) => onButtonClick(ev)" :theme-color="'success'">Create</KButton>
      <KButton :svg-icon="pencilIcon" :fill-mode="'outline'" :disabled="isClickable" @click="(ev) => onButtonClick(ev)"
        :theme-color="'tertiary'">
        Edit</KButton>
    </div>

    <div class="outputconfigs-buttons" v-if="buttontype === `outputconfigs`">
      <KButton :svg-icon="plusIcon" :fill-mode="'outline'" @click="(ev) => onButtonClick(ev)"
        :disabled="isCreateClickable" :theme-color="'success'">
        Create
      </KButton>
      <KButton :svg-icon="copyIcon" :fill-mode="'outline'" :disabled="isClickable" @click="(ev) => onButtonClick(ev)"
        :theme-color="'tertiary'">Copy
      </KButton>
    </div>

    <div class="landingpages-buttons" v-if="buttontype === `landingpages`">
      <KButton :svg-icon="copyIcon" :fill-mode="'outline'" :disabled="isClickable" @click="(ev) => onButtonClick(ev)"
        :theme-color="'tertiary'">Copy
      </KButton>
    </div>
  </div>
</template>

<script>
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { copyIcon, pencilIcon, plusIcon, replaceSingleIcon, dollarIcon, arrowsSwapIcon } from "@progress/kendo-svg-icons";
export default {
  props: ['buttontype', 'clickable'],
  emits: ['onButtonClick'],
  data() {
    return {
      copyIcon,
      pencilIcon,
      plusIcon,
      replaceSingleIcon,
      dollarIcon,
      arrowsSwapIcon
    }
  },
  components: {
    KButton
  },
  methods: {
    onButtonClick(ev) {
      this.$emit('onButtonClick', ev.currentTarget.innerText?.trim().toLowerCase());
    }
  },
  computed: {
    isCreateClickable() {
      return this.$store.state.loading
    },
    isClickable() {
      return !this.$props.clickable;
    }
  }
}

</script>

<style scoped>
.buttons-container {
  margin-bottom: 10px;
}

.storyboards-buttons,
.storage-buttons,
.accounts-buttons,
.outputconfigs-buttons {
  display: flex;
  gap: 10px;
}
</style>
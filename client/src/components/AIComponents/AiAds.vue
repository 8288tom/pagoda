<template>
    <div class="container">
        <h1>AI Ads</h1>
        <ExpansionPanel
            :titleRender="'CustomTitle'"
            :title="'component'"
            :subtitle="'Treasure'"
            :expanded="false"
        >
            <template v-slot:CustomTitle="{}">
                <CustomTitle
                    :thumbnail="'https://s3.us-east-1.amazonaws.com/page-creator-assets.idomoo.com/thumbnails/Treasures.png'"
                ></CustomTitle>
            </template>
            <ExpansionPanelContent v-if="false">
                <h2>this is the content</h2>
            </ExpansionPanelContent>
        </ExpansionPanel>
    </div>
</template>

<script setup>
import { ExpansionPanel, ExpansionPanelContent } from "@progress/kendo-vue-layout";
import CustomTitle from "./CustomTitle.vue";
</script>

<style scoped>
.container {
    width: 50%;
    margin: auto;
}

:deep(.k-expander) {
    background-color: var(--kendo-color-base);
    border: solid 1px var(--dark-200);
}
:deep(.k-expander-header:hover, .k-expander-header.k-hover) {
    transition: all 350ms ease;
    background-color: var(--dark-30);
}
:deep(.k-expander-sub-title) {
    font-size: 2em;
    padding-right: 50px;
    color: var(--dark-500);
}
:deep(.k-expander-content) {
    margin: 5px;
    border: solid 1px var(--primary-400);
}
</style>

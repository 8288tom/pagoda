<template>
    <Card class="card shadow">
        <CardTitle>Scene Libraries From Storyboard</CardTitle>
        <CardSubtitle>Enter Storyboard ID, click on Get Scene Libraries and you'll get all the Scene Libraries from the
            Storyboard as comma spereated numbers</CardSubtitle>
        <CardBody class="card-body flex">
            <KInput v-model="storyboardId" :label="'Storyboard ID'" :placeholder="'150197'" class="input"></KInput>
            <KButton @click="getSceneLibraryIds" :size="'medium'" :fill-mode="'outline'">Get Scene
                Libraries</KButton>
            <p v-if="errorMessage"> {{ errorMessage }}</p>
            <p v-if="sceneLibraryIds" class="para">{{ sceneLibraryIds }}</p>

        </CardBody>
    </Card>
</template>

<script setup>
import { Card, CardTitle, CardBody, CardSubtitle } from '@progress/kendo-vue-layout';
import { ref } from "vue";
import { useApolloClient } from '@vue/apollo-composable';
import { useStore } from 'vuex';
import { showNotification } from '@/utils/contextHelpers';
import { Input as KInput } from '@progress/kendo-vue-inputs';
import { Button as KButton } from '@progress/kendo-vue-buttons';
import queries from '@/utils/queries';

const { client: apolloClient } = useApolloClient();
const query = queries.tools.getscenelibrariesfromstoryboard;
const store = useStore();
const storyboardId = ref("");
const errorMessage = ref("");
const sceneLibraryIds = ref(null);



async function getSceneLibraryIds() {
    try {
        const variables = {
            storyboardId: storyboardId.value
        }

        const { data } = await apolloClient.query({ query, variables, fetchPolicy: 'no-cache' })
        if (data && data.getSceneLibrariesFromStoryboard) {
            const sceneLibraryArray = data.getSceneLibrariesFromStoryboard.sceneLibraries
            sceneLibraryIds.value = sceneLibraryArray.toString();
        }
        else {
            console.error("Error getting scene library ids from storyboard ")
            showNotification(store, false, undefined, "Error getting scene library ids from storyboard")
        }
    } catch (e) {
        console.error("Error executing getSceneLibraryIds()", e)
        showNotification(store, false, undefined, "Error executing getSceneLibraryIds")
    }
}

</script>

<style scoped>
.k-card-subtitle {
    font-size: 15px;
    text-align: center;
    color: var(--dark-400);
    padding: 20px;
}

.card {
    padding: 10px;
    width: 540px;
}

.card-body {
    flex-direction: column;
    align-items: space-between;
    justify-content: top;
}

.input,
.input {
    margin-bottom: 30px;
}

.para {
    margin-top: 30px;
}
</style>
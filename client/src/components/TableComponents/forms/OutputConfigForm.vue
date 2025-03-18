<template>
    <form @submit.prevent>
        <div class="flex container">
            <IdmTooltip :text="`Refer to Developer Academy for details about the fields`" :on-hover="true"
                class="tooltip">
            </IdmTooltip>
            <Card class="flex container identifiers">
                <CardTitle>Account Information</CardTitle>
                <KInput :label="'Account ID'" v-model="accountData.accountId" :placeholder="'11005'"
                    :valid="isAccountIdValid" :validationMessage="validationMessages['accountId']"></KInput>
                <KInput :label="'Output Config Name'" v-model="accountData.name" :placeholder="'Rocket Mortgage - PV5'"
                    :valid="isNameValid" :validationMessage="validationMessages['name']">
                </KInput>
                <KInput :label="'Authorized Accounts'" v-model="accountData.authAccounts"
                    :placeholder="'11005,4961,4937...'">
                </KInput>
                <Checkbox :label="'Open To All'" :size="'large'" v-model="accountData.openToAll"></Checkbox>
            </Card>
            <Card class="video">
                <CardTitle>Video</CardTitle>
                <CardBody>
                    <OutputGenerator :outputType="'videos'" :shouldEmit="shouldEmit" @data="emittedData">
                    </OutputGenerator>
                </CardBody>

            </Card>

            <Card class="jpg">
                <CardTitle>JPG</CardTitle>
                <CardBody>
                    <OutputGenerator :outputType="'jpgs'" :shouldEmit="shouldEmit" @data="emittedData">
                    </OutputGenerator>
                </CardBody>
            </Card>
            <Card class="gif">
                <CardTitle>GIF</CardTitle>
                <CardBody>
                    <OutputGenerator :outputType="'gifs'" :shouldEmit="shouldEmit" @data="emittedData">
                    </OutputGenerator>
                </CardBody>
            </Card>
            <Card class="audio">
                <CardTitle>Audio</CardTitle>
                <CardBody>
                    <OutputGenerator :outputType="'audio'" :shouldEmit="shouldEmit" @data="emittedData">
                    </OutputGenerator>
                </CardBody>
            </Card>
        </div>

        <Dialog v-if="isErrorDialogOpen" :title="`Oops there's an MetadataAPI Error`" @close="toggleDialog">

            <p>{{ errorMessage }}</p>

        </Dialog>

        <KButton :svgIcon="arrowRightIcon" @click="requestComponentToEmit" :fill-mode="'outline'" class="create-button"
            :theme-color="'success'">
            Create</KButton>
    </form>


</template>


<script setup>
import { Input as KInput, Checkbox } from '@progress/kendo-vue-inputs';
import { ref, reactive, computed, defineEmits } from 'vue';
import OutputGenerator from "./UIComponents/OutputGenerator.vue";
import IdmTooltip from '@/components/misc/IdmTooltip.vue';
import { removeFalsyRecursively } from '@/utils/generalUtilities';
import { Card, CardBody, CardTitle } from '@progress/kendo-vue-layout';
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { arrowRightIcon } from '@progress/kendo-svg-icons';
import { isValueDigits } from "@/utils/generalUtilities";
import { useApolloClient } from "@vue/apollo-composable";
import { mapToMutation } from './formHelpers';
import { showNotification } from '@/utils/contextHelpers';
import { useStore } from "vuex";
import { Dialog } from "@progress/kendo-vue-dialogs";


const { client: apolloClient } = useApolloClient();
const store = useStore();

const emit = defineEmits(['update:visible', 'refetchList'])

const isErrorDialogOpen = ref(false);
let errorMessage;
let authAccountsForAPICall;

const accountData = reactive({
    accountId: null,
    name: null,
    authAccounts: null,
    openToAll: false
})
const shouldEmit = ref(false);
const outputGeneratorData = ref([]);

const validationMessages = {
    accountId: "Account ID must be a number and cannot be empty",
    name: "Output config must have a name"
}

const isAccountIdValid = computed(() => {
    if (accountData.accountId && isValueDigits(String(accountData.accountId))) {
        return true
    }
    return false
})
const isNameValid = computed(() => {
    return accountData.name ? true : false
})

const toggleDialog = () => {
    isErrorDialogOpen.value = !isErrorDialogOpen.value
}

const requestComponentToEmit = () => {
    outputGeneratorData.value = [];
    shouldEmit.value = !shouldEmit.value;
}

//validation to make sure all 4 outputs (incl empty ones) have been pushed to the array
function isAllDataCollected() {
    return Object.keys(outputGeneratorData.value).length === 4;
}

//because i'm using the same generator 4 times, we need this extra step 
function emittedData(ev) {
    outputGeneratorData.value.push(ev);

    if (isAllDataCollected()) {
        const cleanedData = cleanFalsyAndRename(outputGeneratorData.value);
        const finalData = removeFalsyRecursively(cleanedData) //formatData adds some null values to the object so i'm cleaning them once more here
        generateOutput(...finalData)
    }
}


function cleanFalsyAndRename(data) {
    //clean falsy values (deep)
    const truthyValues = removeFalsyRecursively(data)
    // rename keys
    truthyValues.forEach((obj) => {
        Object.keys(obj).forEach(key => {
            if (key === 'videos') {
                obj['video'] = obj['videos'];
                delete obj['videos'];
            }

            if (key === 'jpgs') {
                obj['jpg'] = obj['jpgs'];
                delete obj['jpgs'];
            }

            if (key === 'gifs') {
                obj['gif'] = obj['gifs'];
                delete obj['gifs'];
            }
        })
    })

    //removing empty arrays
    const cleanedData = truthyValues.filter(obj => {
        const firstVal = Object.values(obj)[0];
        return firstVal.length !== 0
    })

    return formatOutputValues(cleanedData)
}

function formatOutputValues(data) {
    data.forEach(obj => {
        Object.keys(obj).forEach(outputType => {
            obj[outputType].forEach(output => {
                output.height = parseInt(output.height)
                output.quality = output.quality ? parseInt(output.quality) : null
                output.landing_page_id ? output.landing_page_id = parseInt(output.landing_page_id) : null
                output.crop_to_ratio ? output.crop_to_ratio = output?.crop_to_ratio?.split(',').map(ratio => parseInt(ratio)) : null
                output.time = output.time ? parseInt(output.time) : null
                output.duration = output.duration ? parseInt(output.duration) : null
                output.fps = output.fps ? parseInt(output.fps) : null
                output.loop = output.loop ? parseInt(output.loop) : null
            })
        })
    })
    return removeFalsyRecursively(data)
}

function formatAuthAccountsToInts() {
    const authAccounts = accountData.authAccounts;
    if (authAccounts) {
        const seperatedValues = authAccounts.split(',');
        const arrayOfIntAccounts = seperatedValues.map(val => parseInt(val))
        authAccountsForAPICall = arrayOfIntAccounts;
    }
}

async function generateOutput(outputData) {
    if (!(isAccountIdValid.value && isNameValid)) return;

    const mutation = mapToMutation('outputconfigs', 'create')
    formatAuthAccountsToInts();


    const outputConfigInput = {
        name: accountData.name,
        identifiers: {
            authorized: authAccountsForAPICall || [],
            open_to_all: accountData.openToAll
        },
        output: {
            ...outputData
        }
    }
    const variables = {
        input: outputConfigInput,
        accountId: accountData.accountId
    }

    try {
        const { data } = await apolloClient.mutate({ mutation, variables, fetchPolicy: 'no-cache' });
        if (!data.createOutputConfig.success) {
            console.error(data.createOutputConfig.message)
            errorMessage = data.createOutputConfig.message
            return toggleDialog();
        }
        showNotification(store, true, data.createOutputConfig.message)
        emit('update:visible', false);
        emit('refetchList', true);
    } catch (e) {
        console.error("Error submitting Create Output Config request", e.message)
        showNotification(store, false, undefined, e.message)
    }
}


</script>

<style scoped>
.container {
    flex-direction: column;
    gap: 10px;
}

.tooltip {
    margin-left: auto;

}

.identifiers {
    justify-content: left;
    width: 40%;
    padding: 10px;
    margin: auto;
    margin-bottom: 10px;
    background-color: #7eb3dc27;
}

.k-card-title {
    margin: auto;
    padding-left: 7px;
    margin-top: 5px;
    font-size: 17px;
    font-weight: 600;

}

.video {
    background-color: #7edcb23b;
}

.jpg {
    background-color: #7ecedc3b;
}

.gif {
    background-color: #7eb5dc3b;
}

.audio {
    background-color: #7e96dc3b;
}

.create-button {
    margin-top: 5px;
}
</style>

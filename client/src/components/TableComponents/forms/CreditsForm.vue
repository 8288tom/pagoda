<template>
    <form @submit.prevent="handleSubmit">
        <div class="flex input-container">
            <div class="flex credits-container">
                <KInput :label="'Credits'" v-model="credits" style="width: 100%;" :maxlength="18"
                    :valid="isFieldValid.credits" :validationMessage="'Credits must be a number'"
                    :disabled="areInputsDisabled" :fill-mode="'outline'"></KInput>

                <Tooltip :position="'right'" :anchor-element="'pointer'">
                    <div @click="setMaxCredit" class="svg-container">
                        <SvgIcon :icon="arrowUpIcon" :size="'xlarge'" :title="'Set Max Credits'">
                        </SvgIcon>
                    </div>
                </Tooltip>
            </div>
            <KInput :label="'Credits warnning threshold'" v-model="creditsThreshold" :maxlength="7"
                :valid="isFieldValid.threshold" :validationMessage="'Threshold must be a number'"
                :disabled="areInputsDisabled" :fill-mode="'outline'"></KInput>
        </div>
        <div class="button-loader-container">
            <KButton :size="'medium'" :fill-mode="'outline'" :svg-icon="checkIcon">Save</KButton>
            <Loader :size="'medium'" :type="'converging-spinner'" v-if="isLoading"></Loader>
        </div>

    </form>
</template>


<script>

/*eslint-disable*/
import { Tooltip } from '@progress/kendo-vue-tooltip';
import { Button as KButton } from '@progress/kendo-vue-buttons';
import { Input as KInput } from '@progress/kendo-vue-inputs';
import { checkIcon, arrowUpIcon } from '@progress/kendo-svg-icons';
import { SvgIcon } from '@progress/kendo-vue-common';
import { ref, computed } from "vue";
import { useStore } from 'vuex';
import { useApolloClient } from '@vue/apollo-composable';
import { isValueDigits } from '@/utils/generalUtilities';
import { mapToMutation } from './formHelpers';
import { Loader } from '@progress/kendo-vue-indicators';
import { showNotification } from '@/utils/contextHelpers';
export default {
    components: { KButton, KInput, SvgIcon, Tooltip, Loader },
    emits: ['refetchList', 'update:visible'],
    props: { selectedId: { type: String, required: true }, formData: { type: Object, required: true } },
    setup(props, context) {
        const store = useStore()
        const { client: apolloClient } = useApolloClient();
        const isLoading = ref(false);
        const credits = ref(props.formData.credits ?? 0)
        const creditsThreshold = ref(props.formData.creditsThreshold ?? 0);

        const areInputsDisabled = !store.state.permissions.accounts.write;
        function setMaxCredit() {
            credits.value = 0;
            credits.value = 999999999999999999;
        }


        const isFieldValid = computed(() => {
            const returnObject = { credits: false, threshold: false }
            credits.value === 0 ? returnObject.credits = true : returnObject.credits = isValueDigits(credits.value)
            creditsThreshold.value === null ? returnObject.threshold = true : returnObject.threshold = isValueDigits(creditsThreshold.value)
            return returnObject
        });


        async function handleSubmit() {
            const variables = {
                input: {
                    _id: props.selectedId,
                    region: props.formData.region,
                    newCredits: String(credits.value),
                    creditsThreshold: String(creditsThreshold.value)
                }
            }
            try {
                isLoading.value = true;
                const { data } = await apolloClient.mutate({ mutation: mapToMutation('accounts', 'credits'), variables, fetchPolicy: 'no-cache' })
                if (!data.updateCredits.success) {
                    if (data.updateCredits.message.toLowerCase() === 'No updated performed') {
                        showNotification(store, true, "No updated performed")
                        isLoading.value = false;
                    }
                    showNotification(store, false, undefined, "Error updating account - contact support")
                    isLoading.value = false;
                    return;
                }
                showNotification(store, true, `Updated account ${props.selectedId}'s credits info`)
                isLoading.value = false;
                context.emit('update:visible', false)
                context.emit('refetchList')
            } catch (e) {
                console.error("Error submitting form", e)
                isLoading.value = false;
                showNotification(store, false, undefined, `Error submitting form ${e.message}`)
            }
        }


        return { credits, creditsThreshold, checkIcon, arrowUpIcon, setMaxCredit, isFieldValid, handleSubmit, isLoading, areInputsDisabled }
    }
}
</script>


<style scoped>
.input-container {
    width: 60%;
}

.input-container span {
    margin-bottom: 10px;
}

.credits-container {
    justify-content: space-between;
}

.svg-container {
    cursor: pointer;
    position: relative;
    top: 20px;
    transition: transform 150ms ease;
}

.svg-container:hover {
    transform: scale(1.3);
    color: var(--kendo-color-primary);
}

.svg-container span:active {
    transform: translateY(-1);
}

.button-loader-container {
    position: relative;
    top: 40px;
}
</style>
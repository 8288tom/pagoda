<template>
    <form @submit.prevent="handleSubmit">
        <div class="input-container flex">
            <legend>{{ legend }}</legend>
            <KInput :rounded="'large'" :placeholder="'11005'" :label="label" v-model="userInputId"
                :validationMessage="validationMessage" :valid="isValid" :fill-mode="'outline'" :disabled="isDisabled">
            </KInput>
            <KInput v-if="isWorkspaceNeeded" :rounded="'large'" :placeholder="'670e35b2e576d304c74cb300'"
                :label="'Workspace Id'" v-model="workspaceId"
                :validationMessage="'Workspace ID cannot be empty and must be 24 characters long'"
                :valid="notEmptyAnd24Char" :fill-mode="'outline'" :maxlength="'24'" :minlength="'8'"
                :disabled="isDisabled">
            </KInput>
            <KInput v-if="isOutputConfig" class="newname-input" :rounded="'large'" :placeholder="'PV5'"
                :label="'New Name'" v-model="newNameInput" :validationMessage="validationMessage" :valid="isValid"
                :fill-mode="'outline'" :disabled="isDisabled">
            </KInput>
            <div class="checkbox-container flex" v-if="isStoryboardUpdate">
                <Checkbox :label="'Preserve Storyboard Name'" :size="null" :class="'custom-checkbox'"
                    :onChange="onCheckboxChange" :disabled="isDisabled"></Checkbox>
                <IdmTooltip :text="`The Storyboard that's being updated will not lose its original name`" :symbol="'?'"
                    :onHover="true"></IdmTooltip>
            </div>
        </div>
        <div class="button-loader-container">
            <KButton :disabled="Boolean(!userInputId)" :fill-mode="'outline'" :svg-icon="chevronRightIcon">Submit
            </KButton>
            <Loader :size="'medium'" :type="'converging-spinner'" v-if="isLoading"></Loader>
        </div>
    </form>
</template>

<script>
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { Input as KInput, Checkbox } from '@progress/kendo-vue-inputs';
import { useMutation } from "@vue/apollo-composable";
import { chevronRightIcon } from "@progress/kendo-svg-icons";
import { computed, ref } from 'vue';
import { mapToMutation } from "./formHelpers";
import IdmTooltip from "@/components/misc/IdmTooltip.vue";
import { useStore } from "vuex";
import { showNotification } from '@/utils/contextHelpers';
import { Loader } from "@progress/kendo-vue-indicators";
export default {
    props: {
        actionType: { type: String, required: true },
        formType: { type: String, required: true },
        selectedId: { type: String, required: true }
    },
    emits: ['refetchList', 'update:visible'],
    components: {
        KButton,
        KInput,
        Checkbox,
        IdmTooltip,
        Loader
    },
    setup(props, context) {
        const entityId = ref(props.selectedId);
        const userInputId = ref("");
        const workspaceId = ref("");
        const newNameInput = ref("");
        const preserveCheckbox = ref(false);
        const validationMessage = ref("ID should only contain numbers");
        const formType = props.formType.toLowerCase();
        const actionType = props.actionType.toLowerCase();
        const store = useStore();
        const isLoading = ref(false);

        let mutation = mapToMutation(formType, actionType)

        const { mutate, loading, error, data, onDone, onError } = useMutation(mutation)
        onDone((result) => {
            const responseKey = mutation.definitions[0].name.value;
            if (!result.data[responseKey].success) {
                showNotification(store, false, undefined, result.data[responseKey].message);
                return;
            }
            showNotification(store, result.data[responseKey].success, result.data[responseKey].message, result.data[responseKey].message)
            context.emit('update:visible', false)
            context.emit('refetchList', true)
        })
        onError((err) => {
            console.error("Mutation failed", err)
            showNotification(store, false, undefined, err.message)
        })

        const isValid = computed(() => {
            if (isDisabled.value) return true
            const pattern = /^\d+$/; // Regex pattern to match digits only
            return pattern.test(userInputId.value);
        });

        const notEmptyAnd24Char = computed(() => {
            if (isDisabled.value) return true
            if (workspaceId.value && workspaceId.value.length === 24) return true;
            else return false;
        })

        const label = computed(() => {
            if (formType === 'storyboards' && actionType === 'update') {
                return "Storyboard ID"
            }
            else return "Account ID"
        })

        const legend = computed(() => {
            if (formType === 'storyboards' && actionType === 'update') {
                return "Storyboard ID from which to update:"
            } else if (formType === 'scenelibraries') {
                return "New Scene Library owner:"
            } else return `Account ID to ${actionType} to:`
        })
        const isWorkspaceNeeded = computed(() => {
            if (formType === 'storyboards' && actionType === 'copy') return true;
            if (formType === 'landingpages' && actionType === 'copy') return true;
            else return false;
        })
        const isStoryboardUpdate = computed(() => formType === 'storyboards' && actionType === 'update')
        const isOutputConfig = computed(() => formType === 'outputconfigs')
        const isDisabled = computed(() => {
            if (props.formType === 'storyboards') return !store.state.permissions.storyboards.write;
            if (props.formType === 'landingpages') return !store.state.permissions.landingpages.write;
            if (props.formType === 'outputconfigs') return !store.state.permissions.outputconfigs.write;
            if (props.formType === 'scenelibraries') return !store.state.permissions.scenelibraries.write;
            else return true;
        }
        )
        function onCheckboxChange() {
            preserveCheckbox.value = !preserveCheckbox.value
        }

        function getVariables() {
            let variables = {};
            if (formType === 'scenelibraries') {
                variables = {
                    _id: entityId.value,
                    newOwner: parseInt(userInputId.value)
                }
            }
            else if (isStoryboardUpdate.value) {
                variables = {
                    input: {
                        storyboardIdToUpdate: entityId.value,
                        storyboardIdToUpdateFrom: userInputId.value,
                        perserveName: preserveCheckbox.value
                    }
                }
            }
            else if (isWorkspaceNeeded.value) {
                variables = {
                    input: {
                        _id: entityId.value,
                        workspaceId: workspaceId.value,
                        accountIdToCopy: parseInt(userInputId.value)
                    }
                }
            }
            else if (isOutputConfig.value) {
                variables = {
                    _id: entityId.value,
                    newOwner: parseInt(userInputId.value),
                    newName: newNameInput.value
                }
            }
            else {
                console.error("Error in getVariables function")
                return false
            }
            return variables
        }

        async function handleSubmit() {
            const variables = getVariables()
            isLoading.value = true;
            await mutate(variables)
            isLoading.value = false;
        }


        return {
            handleSubmit, chevronRightIcon, label, legend, userInputId, newNameInput, validationMessage, isDisabled, isLoading,
            onCheckboxChange, isStoryboardUpdate, isOutputConfig, isValid, loading, error, data, workspaceId, notEmptyAnd24Char, isWorkspaceNeeded
        }
    }

}
</script>

<style scoped>
.input-container {
    flex-direction: column;
    width: 50%;
    justify-content: center;
    margin: auto;

}

.button-loader-container {
    margin-top: 40px;
}


.checkbox-container {
    justify-content: space-between;
    margin-top: 20px;
}


.input-container legend {
    margin-bottom: 5px;
    align-self: flex-start;
    margin-left: -2px;
}

.newname-input {
    margin-top: 5px;
}
</style>
<template>
    <TabStrip :selected="selected" @select="onTabSelect" :tab-position="'top'" :tabs="tabs" :animation="false">
        <template v-slot:AccountInfo>
            <form @submit.prevent="handleSubmit">
                <div class="flex input-container">
                    <KInput :disabled="true" :value="selectedId" :label="'Account ID'" :fill-mode="'outline'"></KInput>

                    <KInput :disabled="areInputsDisabled" v-model="form.accountName" :label="'Account Name'"
                        :fill-mode="'outline'"></KInput>

                    <DropDownList :data-items="apiCallsOptions" :default-value="form.apiCalls" v-model="form.apiCalls"
                        :disabled="areInputsDisabled" :label="'API Calls'" :fill-mode="null" class="custom-dropdown">
                    </DropDownList>

                    <DropDownList :data-items="accountTypeOptions" v-model="form.accountType" :label="'Account Type'"
                        :disabled="areInputsDisabled" :fill-mode="null" class="custom-dropdown">
                    </DropDownList>

                    <DropDownList :data-items="['us', 'eu']" v-model="form.env" :label="'Environment'" :fill-mode="null"
                        :disabled="areInputsDisabled" class="custom-dropdown"></DropDownList>

                    <MultiSelect :data-items="betaFeaturesOptions.features" :value="form.betaFeatures"
                        :disabled="areInputsDisabled" :allowCustom="true" :label="'Beta Features'" :fill-mode="null"
                        class="custom-dropdown" @change="multiSelectChange">
                    </MultiSelect>

                    <KInput v-model="form.maxConcAllowed" :label="'Max Concurrency Allowed'"
                        :disabled="areInputsDisabled" :valid="isFieldValid.maxConcAllowed"
                        :validationMessage="'Concurrency must be a number'" :fill-mode="'outline'">
                    </KInput>

                    <ComboBox :data-items="hostingPeriodOptions" v-model="form.hostingPeriod" :allow-custom="false"
                        :disabled="areInputsDisabled" :required="false" :label="'Hosting Period'" :fill-mode="null"
                        class="custom-dropdown">
                    </ComboBox>

                    <KInput v-model="form.storage" :label="'Storage ID'" :valid="isFieldValid.storage"
                        :disabled="areInputsDisabled" :validationMessage="'Storage must be a number'"
                        :fill-mode="'outline'"></KInput>

                    <Checkbox v-model="form.skipConcValidation" :size="null" :class="'custom-checkbox'"
                        :disabled="areInputsDisabled" :label="'Skip Concurrency Validation'"></Checkbox>
                </div>
                <div class="button-loader-container">
                    <KButton :size="'medium'" :fill-mode="'outline'" :disabled="isButtonDisabled">Save</KButton>
                    <Loader :size="'medium'" :type="'converging-spinner'" v-if="isLoading"></Loader>
                </div>
            </form>
        </template>
        <template v-slot:SceneLibraries>
            <div class="flex grid-header">
                <AddRemove v-model="sceneLibraryEdit" @add="addSL" @remove="removeSL" :parent="'accounts'"></AddRemove>
            </div>
            <Grid :data-items="tableItems" :columns="columns" :scrollable="'scrollable'"
                :style="{ height: tableHeight }" :filterable="true" :filter="filter" @filterchange="filterChange"
                @rowclick="onRowClick">
            </Grid>
        </template>
        <template v-slot:Credits></template>
    </TabStrip>
</template>

<script>
import { TabStrip } from '@progress/kendo-vue-layout';
import { Grid } from "@progress/kendo-vue-grid";
import { useApolloClient } from '@vue/apollo-composable';
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { Input as KInput, Checkbox } from '@progress/kendo-vue-inputs';
import { DropDownList, MultiSelect, ComboBox } from '@progress/kendo-vue-dropdowns';
import { isValueDigits, apiCallsOptions, accountTypeOptions } from '@/utils/generalUtilities';
import { showNotification } from '@/utils/contextHelpers';
import { useStore } from 'vuex';
import { mapToMutation, betaFeaturesOptions, hostingPeriodOptions, getValidArrayOfNumbers } from "./formHelpers";
import { filterBy } from '@progress/kendo-data-query';
import AddRemove from './UIComponents/AddRemove.vue';
import { ref, reactive, computed, onMounted } from "vue";
import { Loader } from '@progress/kendo-vue-indicators';
import queries from '@/utils/queries';

export default {
    props: {
        selectedId: { type: String, required: true },
        formData: { required: true, type: Object },
    },
    components: { TabStrip, KInput, KButton, DropDownList, MultiSelect, ComboBox, Checkbox, Grid, AddRemove, Loader },
    emits: ['refetchList', 'update:visible'],
    setup(props, context) {
        const store = useStore()
        const { client: apolloClient } = useApolloClient();
        const tabs = [{ title: "Account Info", content: "AccountInfo" }, { title: "Scene Libraries", content: "SceneLibraries" }]
        const columns = [{ field: 'sceneLibId', title: "Scene Library ID", filterable: true }]
        const selected = ref(0);
        const initialData = props.formData || {};
        const isLoading = ref(false);
        const areInputsDisabled = !store.state.permissions.accounts.write;
        const tabContentHeight = 645;
        const tableHeight = (tabContentHeight - 100) + 'px'
        const sceneLibraryEdit = ref('')
        const filter = ref({
            logic: 'and',
            filters: [],
        })
        const sceneLibrariesIds = ref(initialData.sceneLibraries || []);

        const form = reactive({
            accountId: initialData._id || "",
            accountName: initialData.company || "",
            accountType: initialData.accountType || null,
            apiCalls: initialData.userStatus || [],
            betaFeatures: initialData.betaFeatures || null,
            env: initialData.region || "",
            storage: initialData.storageId || null,
            hostingPeriod: initialData.hostingPeriod || null,
            maxConcAllowed: initialData.maxConcurrencyAllowed || null,
            skipConcValidation: initialData.skipConcurencyValidation ?? false
        })


        onMounted(() => {
            document.documentElement.style.setProperty('--tab-content-height', `${tabContentHeight}px`);
        })


        function multiSelectChange(ev) {
            form.betaFeatures = [...ev.target.value]
        }
        function filterChange(ev) {
            filter.value = ev.filter;
        }

        function onRowClick(e) {
            if (sceneLibraryEdit.value.includes(e.dataItem.sceneLibId)) {
                return
            }
            sceneLibraryEdit.value = sceneLibraryEdit.value + `${e.dataItem.sceneLibId},`
        }

        function onTabSelect(e) {
            selected.value = e.selected;
        }

        const tableItems = computed(() => {
            if (sceneLibrariesIds.value) {
                const items = sceneLibrariesIds.value.map((id) => ({ 'sceneLibId': id }))
                return filterBy(items.reverse(), filter.value)
            }
            return []
        })

        const isFieldValid = computed(() => {
            const returnObject = { storage: false, maxConcAllowed: false }
            form.storage === null ? returnObject.storage = true : returnObject.storage = isValueDigits(form.storage)
            form.maxConcAllowed === null ? returnObject.maxConcAllowed = true : returnObject.maxConcAllowed = isValueDigits(form.maxConcAllowed)
            if (form.storage === '') returnObject.storage = true;
            if (form.maxConcAllowed === '') returnObject.maxConcAllowed = true;

            return returnObject
        });


        //checks whether the user edited the form
        const isButtonDisabled = computed(() => {
            const fieldsToCompare = {
                accountId: initialData._id || "",
                accountName: initialData.company || "",
                accountType: initialData.accountType || null,
                apiCalls: initialData.userStatus || [],
                betaFeatures: initialData.betaFeatures || null,
                env: initialData.region || "",
                storage: initialData.storageId || null,
                hostingPeriod: initialData.hostingPeriod || null,
                maxConcAllowed: initialData.maxConcurrencyAllowed || null,
                skipConcValidation: initialData.skipConcurencyValidation ?? false
            };
            return !Object.keys(fieldsToCompare).some(key => form[key] !== fieldsToCompare[key]);
        });

        async function handleSubmit() {
            const variables = {
                input: {
                    _id: props.selectedId,
                    company: form.accountName,
                    accountType: form.accountType,
                    userStatus: form.apiCalls,
                    betaFeatures: form.betaFeatures,
                    region: form.env,
                    skipConcurencyValidation: form.skipConcValidation,
                    storageId: form.storage ? parseInt(form.storage) : null,
                    hostingPeriod: parseInt(form.hostingPeriod),
                    maxConcurrencyAllowed: form.maxConcAllowed ? parseInt(form.maxConcAllowed) : null
                }
            }

            console.log("this is the form", form.betaFeatures)
            console.log("This is the variables", variables.input.betaFeatures)
            try {
                isLoading.value = true;
                const { data } = await apolloClient.mutate({ mutation: mapToMutation('accounts', 'edit'), variables, fetchPolicy: 'no-cache' })
                if (!data.updateAccount.success) {
                    showNotification(store, false, undefined, "Error updating account - contact support")
                    return;
                }
                showNotification(store, true, data.updateAccount.message)
                isLoading.value = false;
                context.emit('update:visible', false)
                context.emit('refetchList')
            } catch (e) {
                console.error("Error submitting form", e)
                isLoading.value = false;
                showNotification(store, false, undefined, `Error submitting form ${e.message}`)
            }

        }

        async function addSL(sceneLibraryToBeAdded) {
            const sceneLibraryIdArray = getValidArrayOfNumbers(sceneLibraryToBeAdded, true)
            if (!sceneLibraryIdArray.length || sceneLibraryIdArray.length < 1) {
                showNotification(store, false, undefined, 'Please add at least one Scene Library')
                sceneLibraryEdit.value = '';
                return;
            }
            const variables = { input: { _id: props.selectedId, sceneLibraries: sceneLibraryIdArray } }
            try {
                const { data } = await apolloClient.mutate({ mutation: mapToMutation('accounts', 'edit'), variables, fetchPolicy: 'no-cache' })
                if (!data.updateAccount.success) {
                    showNotification(store, false, undefined, data.updateAccount.message)
                    return;
                }
                sceneLibraryEdit.value = '';
                showNotification(store, data.updateAccount.success, data.updateAccount.message.toLowerCase() === 'no changes written'
                    ? 'No change'
                    : `Successfully added ${sceneLibraryToBeAdded} to account ${props.selectedId}`)
                await refreshTableItems();
            } catch (e) {
                console.error('Error adding Scene Libraries', e)
                showNotification(store, false, undefined, e.message)
            }
        }

        async function removeSL(sceneLibraryToBeRemoved) {
            const sceneLibsToRemove = getValidArrayOfNumbers(sceneLibraryToBeRemoved, true)
            if (!sceneLibsToRemove.length || sceneLibsToRemove.length < 1) {
                sceneLibraryEdit.value = '';
                showNotification(store, false, undefined, "Please add at least one Scene Library to remove")
                return;
            }
            const variables = { input: { _id: props.selectedId, fieldToRemoveFrom: 'sceneLibraries', valuesToRemove: sceneLibsToRemove } }
            try {
                const { data } = await apolloClient.mutate({ mutation: mapToMutation('accounts', 'remove'), variables, fetchPolicy: 'no-cache' })
                if (!data.removeFromAccount.success) {
                    showNotification(store, false, undefined, data.removeFromAccount.message)
                    return;
                }
                showNotification(store, data.removeFromAccount.success, `Successfully removed ${sceneLibsToRemove} from ${props.selectedId}`)
                await refreshTableItems();
                sceneLibraryEdit.value = '';
            } catch (e) {
                console.error(`Error removing Scene Libraries ${e.message}`)
                showNotification(store, false, undefined, `Error removing Scene Libraries ${e.message}`)
            }
        }

        async function refreshTableItems() {
            const variables = { id: props.selectedId };
            const { data } = await apolloClient.query({ query: queries.accounts.getscenelibraries, variables, fetchPolicy: 'no-cache' })
            if (data && data.getAccount) {
                sceneLibrariesIds.value = data.getAccount.sceneLibraries
            }
            else {
                console.error("Account scene libraries not found after refetch")
                showNotification(store, false, undefined, "Account scene libraries not updated, please re-open form")
            }
        }

        return {
            tabs, selected, onTabSelect, handleSubmit, isButtonDisabled, form, betaFeaturesOptions, hostingPeriodOptions,
            accountTypeOptions, apiCallsOptions, tableItems, columns, filterChange, filter, tableHeight, addSL, removeSL, sceneLibraryEdit,
            onRowClick, isFieldValid, isLoading, areInputsDisabled, multiSelectChange
        }
    }
}
</script>

<style scoped>
/* .input-container and .custom-checkbox are a non scoped class located in App.vue */
:root {
    --tab-content-height: 500px;
    /*default value in case JS fails  */
}

.input-container span {
    margin-bottom: 10px;
}

:deep(.k-table-td) {
    font-size: 18px;
}

.grid-header {
    width: 100%;
    justify-content: space-between;
    align-items: center;
}

/* for betafeatures */
:deep(.k-input-values) {
    min-height: 20px;
    max-height: 40px;
    overflow-y: auto;
}

:deep(.k-tabstrip-content) {
    height: var(--tab-content-height);
}

:deep(.k-list-content) {
    max-height: 100px;
}

:deep(.k-table-row) {
    cursor: pointer;
}
</style>

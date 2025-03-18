<template>
    <TabStrip :selected="selected" @select="onTabSelect" :tab-position="'top'" :tabs="tabs" :animation="false">
        <template v-slot:UserInfo>
            <form>
                <div class="user-info">
                    <div class="flex input-container">
                        <KInput :disabled="true" :label="`User's account ID`" :value="userAccountId"
                            :fill-mode="'outline'"></KInput>
                        <KInput v-model="form.firstName" :label="'First Name'" AutoComplete="off"
                            :valid="isMandatoryFieldsValid.firstName"
                            :validationMessage="userValidationMessages.firstName" :fill-mode="'outline'"></KInput>
                        <KInput v-model="form.lastName" :label="'Last Name'" AutoComplete="off"
                            :valid="isMandatoryFieldsValid.lastName"
                            :validationMessage="userValidationMessages.lastName" :fill-mode="'outline'"></KInput>
                        <KInput v-model="form.newEmail" :label="'Email'" AutoComplete="off"
                            :valid="isMandatoryFieldsValid.email" :validationMessage="userValidationMessages.email"
                            :fill-mode="'outline'">
                        </KInput>
                        <div class="flex">
                        </div>
                        <DropDownList :data-items="webAccessOptions" :default-value="form.webAccess"
                            v-model="form.webAccess" :label="'Web Access'" :fill-mode="null" class="custom-dropdown">
                        </DropDownList>
                        <div class="switch-container flex">
                            <p>Two Step Verification:</p>
                            <Switch @change="onTwoStepChange" :on-label="'on'" name="twoStepSwitch" :off-label="'off'"
                                :default-checked="form.twoStepVerification" :track-rounded="'full'"
                                :thumb-rounded="'full'" :size="'medium'">
                            </Switch>
                        </div>

                    </div>
                </div>
                <div class="button-loader-container">
                    <KButton :size="'medium'" :fill-mode="'outline'" @click="handleSubmit"
                        :disabled="isButtonDisabled || isLoading">Save
                    </KButton>
                    <Loader :size="'medium'" :type="'converging-spinner'" v-if="isLoading"></Loader>
                </div>
            </form>
        </template>

        <template v-slot:AssociatedAccounts>
            <div class="grid-header">
                <AddRemove v-model="associatedAccountsEdit" @add="addAccount" @remove="removeAccount" :parent="'users'">
                </AddRemove>
            </div>
            <div class="grid-container">
                <Grid :data-items="tableItems" :columns="columns" :scrollable="'scrollable'" style="height: 290px;"
                    @rowclick="onRowClick" :filterable="true" :filter="filter" @filterchange="filterChange">
                </Grid>
            </div>
        </template>
    </TabStrip>
</template>

<script>
import { useApolloClient } from '@vue/apollo-composable';
import queries from "../../../utils/queries"
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { Input as KInput, Switch } from '@progress/kendo-vue-inputs';
import { getValidArrayOfNumbers, mapToMutation, isValidEmail, userValidationMessages } from "./formHelpers";
import { DropDownList } from '@progress/kendo-vue-dropdowns';
import { Grid } from "@progress/kendo-vue-grid";
import { TabStrip } from '@progress/kendo-vue-layout';
import { ref, computed, reactive } from "vue";
import { showNotification } from '@/utils/contextHelpers';
import { useStore } from 'vuex';
import { filterBy } from '@progress/kendo-data-query';
import AddRemove from "./UIComponents/AddRemove.vue"
import { Loader } from '@progress/kendo-vue-indicators';
export default {
    props: {
        selectedId: { type: String, required: true },
        formData: { required: true, type: Object },
    },
    emits: ['refetchList', 'update:visible'],
    components: { KButton, KInput, DropDownList, Grid, TabStrip, Switch, AddRemove, Loader },
    setup(props, context) {
        const { client: apolloClient } = useApolloClient();
        const tabs = [{ title: "User Info", content: "UserInfo" }, { title: "Accounts", content: "AssociatedAccounts" }]
        const columns = [{ field: "entityId", title: "Account ID", filterable: true }, { field: "company", title: "Company", filterable: true }]
        const filter = ref({
            logic: 'and',
            filters: [],
        })
        const selected = ref(0);
        const initialData = props.formData || {};
        const store = useStore();
        const isLoading = ref(false);

        const form = reactive({
            firstName: initialData?.account?.firstName || '',
            lastName: initialData?.account?.lastName || '',
            oldEmail: initialData?.account?.email || '',
            newEmail: initialData?.account?.email || '',
            webAccess: initialData?.account?.webAccess || null,
            twoStepVerification: initialData?.twoStepVerification || false,
        });
        const associatedAccountsEdit = ref('');
        // const tableItems = ref([]);
        const webAccessOptions = ["active", "notActive", "blocked"];


        const userAccountId = computed(() => initialData?.account?._id ? initialData.account._id : null);
        const isMandatoryFieldsValid = computed(() => {
            return {
                firstName: !!form.firstName,
                lastName: !!form.lastName,
                email: !!form.newEmail && isValidEmail(form.newEmail)
            }
        });
        const isButtonDisabled = computed(() => {
            const fieldsToCompare = {
                firstName: initialData.account.firstName,
                lastName: initialData.account.lastName,
                oldEmail: initialData.account.email,
                newEmail: initialData.account.email,
                webAccess: initialData.account.webAccess,
                twoStepVerification: initialData.twoStepVerification,
            };
            return !Object.keys(fieldsToCompare).some(key => form[key] !== fieldsToCompare[key])
        });


        const tableItems = computed(() => {
            if (initialData.associatedAccounts) {
                const assocAccountsWithoutMainAcc = initialData.associatedAccounts.filter((accObj) => accObj.entityId !== userAccountId.value)
                return filterBy(assocAccountsWithoutMainAcc.reverse(), filter.value)
            }
            else return []
        })

        function onTabSelect(e) {
            selected.value = e.selected;
        }
        function onTwoStepChange() {
            form.twoStepVerification = !form.twoStepVerification;
        }
        function onRowClick(e) {
            if (associatedAccountsEdit.value.includes(e.dataItem.entityId)) {
                return
            }
            associatedAccountsEdit.value = associatedAccountsEdit.value + `${e.dataItem.entityId},`
        }
        function filterChange(ev) {
            filter.value = ev.filter;
        }

        async function handleSubmit() {
            const isFormValid = Object.values(isMandatoryFieldsValid.value).every((field) => field === true);
            if (!isFormValid) return;
            const newEmail = form.oldEmail !== form.newEmail ? form.newEmail : null;
            const variables = {
                input: {
                    _id: props.selectedId,
                    firstName: form.firstName,
                    newEmail: newEmail,
                    lastName: form.lastName,
                    webAccess: form.webAccess,
                    twoStepVerification: form.twoStepVerification
                }
            }
            try {
                isLoading.value = true
                const { data } = await apolloClient.mutate({ mutation: mapToMutation('users', 'update'), variables, fetchPolicy: 'no-cache' })
                if (!data.updateUser.success) {
                    showNotification(store, false, undefined, "Error updating user - contact support")
                }
                else {
                    data.updateUser.message.toLowerCase() === 'no changes written'
                        ? showNotification(store, true, "No changes written")
                        : showNotification(store, true, "Updated user's info")
                    context.emit('update:visible', false)
                    context.emit('refetchList')
                }
                isLoading.value = false
            } catch (e) {
                console.error("Error during handleSubmit", e)
                showNotification(store, false, undefined, "Error during mutation - check logs")
                isLoading.value = false;
            }
        }


        async function refreshTableItems() {
            const variables = { id: props.selectedId };
            const { data } = await apolloClient.query({ query: queries.users.getaccounts, variables, fetchPolicy: 'no-cache' })
            if (data && data.getUser) {
                const newTableData = data.getUser.associatedAccounts.filter(
                    (accObj) => accObj.entityId !== userAccountId.value
                );
                initialData.associatedAccounts = newTableData.reverse();
                // associatedAccounts.value = newTableData.reverse();
            } else {
                console.error('User data not available after refetch');
                showNotification(store, false, undefined, "User data was not updated, please re-open form")
            }
        }
        async function addAccount(accountsToBeAdded) {
            const accountsToAdd = getValidArrayOfNumbers(accountsToBeAdded);
            if (!accountsToAdd.length) {
                showNotification(store, false, undefined, "Please add at least one account");
                return;
            }

            const variables = { input: { _id: props.selectedId, associatedAccounts: accountsToAdd } };

            try {
                const { data } = await apolloClient.mutate({ mutation: mapToMutation('users', 'update'), variables, fetchPolicy: 'no-cache' });
                const message = `Successfully added ${accountsToAdd} to Associated Accounts`;
                if (!data.updateUser.success) {
                    showNotification(store, false, undefined, data.updateUser.message);
                } else {
                    showNotification(store, true, data.updateUser.message.toLowerCase() === 'no changes written' ? "No change" : message);
                    associatedAccountsEdit.value = '';
                    await refreshTableItems();
                }
            } catch (e) {
                console.error('Error adding to account:', e);
                showNotification(store, false, undefined, e.message);
            }
        }


        async function removeAccount(accountsToBeRemoved) {
            const accountsToRemove = getValidArrayOfNumbers(accountsToBeRemoved, true); // Convert IDs to strings
            if (!accountsToRemove.length) {
                showNotification(store, false, undefined, "Please add at least one account to remove")
                return;
            }
            const variables = { input: { _id: props.selectedId, fieldToRemoveFrom: 'associatedAccounts', valuesToRemove: accountsToRemove, } };

            try {
                const { data } = await apolloClient.mutate({ mutation: mapToMutation('users', 'remove'), variables, fetchPolicy: 'no-cache' });
                const success = data.removeFromUser.success;
                const message = `Successfully removed ${accountsToRemove} from Associated Accounts`;
                showNotification(store, success, message, data.removeFromUser.message);
                await refreshTableItems();
                associatedAccountsEdit.value = '';
            } catch (e) {
                console.error('Error removing from account:', e);
                showNotification(store, false, undefined, e.message)
            }
        }


        return {
            tabs, selected, onTabSelect, onTwoStepChange, tableItems, columns, webAccessOptions, associatedAccountsEdit, addAccount,
            removeAccount, handleSubmit, form, userAccountId, onRowClick, isMandatoryFieldsValid, userValidationMessages, filter, filterChange,
            isButtonDisabled, isLoading
        }
    }
}
</script>

<style scoped>
/* .input-container is a non scoped class */
.user-info {
    margin: auto;
}

.k-floating-label-container {
    margin-right: 20px;
    position: relative;
    bottom: 10px;
    margin-bottom: 5px;
}

.grid-header,
.switch-container {
    justify-content: space-between;
    align-items: center;
}

.switch-container {
    padding-right: 20px;
}

.grid-container,
.grid-header {
    width: 450px;
    margin: auto;
    height: fit-content;
}

.grid-header {
    margin-bottom: 10px;
}

:deep(.k-tabstrip-content) {
    height: 390px;
    padding-top: 20px;
}

:deep(.k-table-row) {
    cursor: pointer;
}

:deep(.k-table-td) {
    font-size: 15px;
}
</style>
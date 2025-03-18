<template>
    <form class="flex" @submit.prevent="handleSubmit">
        <div class="input-container flex">
            <KInput :label="'Name*'" v-model="form.name" :rounded="'large'" :valid="isMandatoryFieldsValid.name"
                :validationMessage="validationMessage.name" :disabled="areInputsDisabled"></KInput>

            <KInput :label="'Account ID*'" v-model="form.accID" :rounded="'large'" :placeholder="'11005'"
                :valid="isMandatoryFieldsValid.account" :validationMessage="validationMessage.account"
                :disabled="areInputsDisabled">
            </KInput>

            <DropDownList :data-items="storageTypes" :default-value="form.storageType" v-model="form.storageType"
                :label="'Storage Type'" :disabled="areInputsDisabled" :valid="isMandatoryFieldsValid.storageType"
                :validationMessage="validationMessage.storageType">
            </DropDownList>

            <legend v-if="form.storageType && form.storageType !== 'file'">Credentials</legend>
            <ComboBox :data-items="sftpCollection" v-model="form.serverUrl" :label="'Server URL'" :allow-custom="true"
                v-if="fieldsToShow?.serverUrl" :disabled="areInputsDisabled"></ComboBox>
            <KInput :label="'User*'" v-model="form.user" :rounded="'large'" AutoComplete="off" v-if="fieldsToShow?.user"
                :disabled="areInputsDisabled">
            </KInput>

            <KInput :label="'Password*'" v-model="form.password" :rounded="'large'" v-if="fieldsToShow?.password"
                :disabled="areInputsDisabled">
            </KInput>

            <KInput :label="'Secret Key'" v-model="form.secretKey" :rounded="'large'" v-if="fieldsToShow?.secretKey"
                :disabled="areInputsDisabled">
            </KInput>

            <KInput :label="'Port'" v-model="form.port" :rounded="'large'" :valid="isPortValid"
                :validationMessage="validationMessage.port" v-if="fieldsToShow?.port" :disabled="areInputsDisabled">
            </KInput>

            <div class="radio-container flex" v-if="fieldsToShow?.pathOptions">
                <RadioButton :value="'uploads'" :checked="pathOptions === 'uploads'" :label="'uploads'" :size="'large'"
                    @change="handleRadioChange"></RadioButton>

                <RadioButton :value="'downloads'" :checked="pathOptions === 'downloads'" :label="'downloads'"
                    :size="'large'" @change="handleRadioChange"></RadioButton>
            </div>
            <KInput :label="'Upload/Download Path'" v-model="form.path" :rounded="'large'"
                v-if="(fieldsToShow?.path && form.serverUrl)" :disabled="areInputsDisabled">
            </KInput>
            <div class="tooltip-input-container flex">

                <!-- <IdmTooltip v-if="(fieldsToShow?.path && form.serverUrl)" :text="toolTipPathMessage" :symbol="'?'"
                    :onHover="true">
                </IdmTooltip> -->
            </div>

            <div class="checkbox-container flex" v-if="form.storageType === 's3cmd'">
                <Checkbox :label="'Private'" :size="null" :class="'custom-checkbox'" :checked="form.privateAcl"
                    v-model="form.privateAcl" :disabled="areInputsDisabled">
                </Checkbox>

                <IdmTooltip :text="`'Check' if the storage won't have public access`" :symbol="'?'" :onHover="true"
                    :position="'right'">
                </IdmTooltip>
            </div>
            <KInput :label="'Web Access URL'" v-model="form.webAccessUrl" :rounded="'large'"
                v-if="form.storageType === 's3cmd'">
            </KInput>
        </div>
        <div class="buttons-container flex">
            <KButton :fill-mode="'outline'" type="submit">
                {{ isActionTypeCreate ? "Create" : "Update" }}
            </KButton>
            <Loader :size="'medium'" :type="'converging-spinner'" v-if="isLoading"></Loader>
        </div>
    </form>

</template>

<script>
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { Input as KInput, Checkbox, RadioButton } from '@progress/kendo-vue-inputs';
import { DropDownList, ComboBox } from '@progress/kendo-vue-dropdowns';
import { ref, computed, reactive } from 'vue';
import { useApolloClient } from "@vue/apollo-composable";
import { mapToMutation } from "./formHelpers"
import { isValueDigits, storageTypes } from "@/utils/generalUtilities";
import { showNotification } from '@/utils/contextHelpers';
import { oldSFTPEndpoints, newSFTPEndpoints, storageValidationMessages as validationMessage } from "./formHelpers";
import IdmTooltip from "@/components/misc/IdmTooltip.vue";
import { useStore } from "vuex";
import { Loader } from '@progress/kendo-vue-indicators';

export default {
    props: {
        actionType: { type: String, required: true },
        selectedId: { type: String, required: false },
        formData: { required: false }
    },
    components: { KButton, KInput, DropDownList, ComboBox, Checkbox, RadioButton, IdmTooltip, Loader },
    emits: ['refetchList', 'update:visible'],
    setup(props, context) {
        const store = useStore();
        const { client: apolloClient } = useApolloClient();
        const sftpCollection = [...oldSFTPEndpoints, ...newSFTPEndpoints];
        const toolTipPathMessage = "<<username>>/pv1/uploads\n /pv1/downloads";
        const initialData = props.formData || {};
        const isLoading = ref(false);
        const areInputsDisabled = !store.state.permissions.storages.write;
        const form = reactive({
            name: initialData.name || "",
            accID: initialData.accountId || null,
            storageType: initialData.type || "",
            user: initialData.credentials?.user || "",
            password: initialData.credentials?.password || "",
            secretKey: initialData.credentials?.secretKey || "",
            serverUrl: initialData.credentials?.serverUrl || "",
            port: initialData.credentials?.serverPort || null,
            path: initialData.credentials?.path || initialData.credentials?.uploadDirectory || "",
            privateAcl: initialData.private || false,
            webAccessUrl: initialData.webAccessUrl || ""

        })
        const isUpload = initialData?.credentials?.uploadDirectory ? "downloads" : "uploads";
        const pathOptions = ref(isUpload || "uploads");
        const mutation = mapToMutation("storages", props.actionType);


        const isPortValid = computed(() => {
            if (form.port === null) {
                return true
            }
            return isValueDigits(form.port)
        });
        const isMandatoryFieldsValid = computed(() => {
            if (areInputsDisabled) {
                return {
                    name: true,
                    account: true,
                    storageType: true
                }
            }
            return {
                name: !!form.name,
                account: !!form.accID && isValueDigits(form.accID),
                storageType: !!form.storageType
            }
        })

        const isActionTypeCreate = computed(() => {
            return props.actionType === 'create' ? true : false;
        })

        // logic that returns different objects that determines what to show on the UI based on storageType
        const fieldsToShow = computed(() => {
            if (form.storageType === "file") return { path: true }
            else if (form.storageType === "sftp" && newSFTPEndpoints.includes(form.serverUrl)) {
                if (pathOptions.value === 'uploads') return { serverUrl: true, user: true, path: true, pathOptions: isActionTypeCreate.value, port: true }
                else return { serverUrl: true, user: true, password: true, port: true, path: true, pathOptions: isActionTypeCreate.value }
            }

            else if (form.storageType === "sftp") return { serverUrl: true, user: true, password: true, port: true, path: true }
            else if (form.storageType === "sftpkey") return { serverUrl: true, user: true, secretKey: true, port: true, path: true }
            else if (form.storageType === "s3cmd") return { serverUrl: true, user: true, region: true, secretKey: true, webAccessUrl: true }
            else return null
        })

        //logic to calculate whether to mutate uploadDirectory or Path in storage documents and handles other storage types
        const calcFieldsForMutation = computed(() => {
            if (form.storageType === 'sftp' && newSFTPEndpoints.includes(form.serverUrl)) {
                if (pathOptions?.value === 'uploads') return { path: `${form.user}${form.path}`, serverPort: form.port, }
                else return { user: form.user, uploadDirectory: form.path, serverPort: form.port, password: form.password }
            }
            else if (form.storageType === 'sftp') return { user: form.user, uploadDirectory: form.path, serverPort: form.port, password: form.password }
            else if (form.storageType === 'sftpkey') return { user: form.user, uploadDirectory: form.path, serverPort: form.port, secretKey: form.secretKey }
            else if (form.storageType === 's3cmd') return { user: form.user, password: form.password, secretKey: form.secretKey }
            else return {}
        })


        function handleRadioChange(e) {
            pathOptions.value = e.value;
        }

        async function handleSubmit() {
            let variables;
            const storageInput = {
                accountId: Number(form.accID),
                type: form.storageType,
                name: form.name,
                serverUrl: form.serverUrl,
                private: form.privateAcl,
                webAccessUrl: form.webAccessUrl ? form.webAccessUrl : null,
                ...calcFieldsForMutation.value
            }
            variables = {
                input: storageInput,
                _id: props.actionType === 'edit' ? props.selectedId : null
            }
            if (newSFTPEndpoints.includes(form.serverUrl) && pathOptions.value === 'uploads') {
                delete variables.input.serverUrl
            }

            try {
                isLoading.value = true;
                const { data } = await apolloClient.mutate({ mutation, variables, fetchPolicy: 'no-cache' });
                const responseKey = props.actionType === 'edit' ? 'updateStorage' : 'createStorage';
                if (!data[responseKey].success) {
                    isLoading.value = false;
                    return showNotification(store, false, undefined, data[responseKey].message)
                }
                isLoading.value = false;
                showNotification(store, true, data[responseKey].message)
                context.emit('update:visible', false)
                context.emit('refetchList', true)
            } catch (e) {
                isLoading.value = false;
                showNotification(store, false, undefined, e.message)
            }

        }

        return {
            handleSubmit, handleRadioChange, isPortValid, isMandatoryFieldsValid, validationMessage, storageTypes,
            sftpCollection, pathOptions, fieldsToShow, toolTipPathMessage, form, isActionTypeCreate, isLoading, areInputsDisabled
        }
    }
}
</script>

<style scoped>
.input-container,
form {
    flex-direction: column;
}

.input-container {
    justify-content: center;
}

.tooltip-input-container {
    align-items: baseline;
}

.tooltip-input-container .k-floating-label-container,
.input-container {
    width: 90%;
}

.tooltip-input-container .idm-tooltip,
.checkbox-container {
    margin-top: 20px;
}

.radio-container {
    justify-content: space-evenly;
    align-items: center;
    margin-bottom: 10px;
}

.checkbox-container {
    justify-content: flex-start;
}

.idm-tooltip {
    padding-left: 20px;
}

:deep(.custom-checkbox input),
:deep(.k-radio-lg) {
    width: 17px;
    height: 17px;
}

:deep(.custom-checkbox label) {
    margin-right: 25px;
}

:deep(.k-floating-label-container),
:deep(.k-dropdownlist),
.checkbox-container {
    margin-bottom: 20px;
}

.buttons-container {
    align-self: center;
}

.buttons-container div {
    position: absolute;
    margin-left: 64px;
}
</style>
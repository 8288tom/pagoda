<template>
    <DropDownList :data-items="dropDownOptions" :onChange="onDropdownChange" :disabled="loading" :default-item="null"
        :fill-mode="null" class="custom-dropdown">
    </DropDownList>
</template>


<script>
import { DropDownList, } from '@progress/kendo-vue-dropdowns';
import { apiCallsOptions, storageTypes, accountTypeOptions, hostingPeriodOptions } from '@/utils/generalUtilities';
export default {
    components: { DropDownList },
    props: ['gridProps', 'sendFilteredQuery', 'tableType', 'loading'],
    methods: {
        onDropdownChange(ev) {
            this.$props.gridProps.onChange({
                field: this.$props.gridProps.field,
                value: ev.target.value,
                syntheticEvent: ev
            })
            this.$props.sendFilteredQuery()
        }
    },
    computed: {
        dropDownOptions() {
            const options = {
                accounts: { region: ['us', 'eu'], accountType: accountTypeOptions, userStatus: apiCallsOptions },
                storages: { type: storageTypes },
                storyboards: { lock: ['true', 'false'], hostingPeriod: hostingPeriodOptions }
            }
            return options[this.$props.tableType][this.$props.gridProps.field]
        }
    }

}
</script>

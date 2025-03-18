<template>
    <div class="flex">
        <KInput :value="gridProps.value" :fill-mode="'outline'" :disabled="loading" @input="(ev) => {
            gridProps.onChange({
                field: gridProps.field,
                value: ev.target.value,
                syntheticEvent: ev
            })
        }" />
        <SvgIcon class="svg-icon" :theme-color="'tertiary'" :icon="searchIcon" @click="sendFilteredQuery" />
    </div>
</template>



<script>
import { Input as KInput } from '@progress/kendo-vue-inputs';
import { SvgIcon } from '@progress/kendo-vue-common';
import { searchIcon } from '@progress/kendo-svg-icons';
export default {
    props: ['gridProps', 'sendFilteredQuery', 'loading'],
    components: { KInput, SvgIcon },
    data() {
        return {
            searchIcon,
        }
    }
}

</script>

<style scoped>
.svg-icon {
    cursor: pointer;
    margin: auto;
    margin-left: 5.5px;
    transition-property: color, transform;
    transition: 200ms ease-out;
}

.svg-icon:hover {
    transform: scale(1.4);
    color: var(--warm-400);
}
</style>
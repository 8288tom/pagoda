<template>
    <div class="flex">
        <DropDownButton :disabled="loading" :items="items" :svg-icon="calendarDateIcon" :text="'Sort by date'"
            @itemclick="handleClick" :fill-mode="'outline'">
            <template v-slot:itemRender="{ props }">
                <div class="k-link k-menu-link">
                    <SvgIcon :icon="props.item.svgIcon"></SvgIcon>
                    <p>{{ props.item.text }}</p>
                </div>
            </template>
        </DropDownButton>

    </div>
</template>


<script>
import { DropDownButton } from '@progress/kendo-vue-buttons'
import { SvgIcon } from '@progress/kendo-vue-common';
import { calendarDateIcon, arrowDownIcon, arrowUpIcon } from '@progress/kendo-svg-icons';
export default {
    props: ['sendFilteredQuery', 'loading'],
    emits: ['changeSort'],
    components: { DropDownButton, SvgIcon },
    data() {
        return {
            calendarDateIcon,
            DropDownButton,
            items: [{ text: 'Ascending', svgIcon: arrowUpIcon }, { text: 'Descending', svgIcon: arrowDownIcon }]
        }
    },
    methods: {
        handleClick() {
            this.$emit('changeSort')
            this.$props.sendFilteredQuery();
        }
    }
}

</script>
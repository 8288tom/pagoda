<template>
    <div class="grid-header flex">
        <KInput :label="'Add or Remove'" :placeholder="'11005,4961'" v-model="localString" style="width:80%;"
            :fill-mode="'outline'" :disabled="isDisabled"></KInput>
        <div class="button-group flex">
            <KButton :size="'medium'" :fill-mode="'outline'" @click="emitAdd" :svg-icon="plusIcon"
                :disabled="isDisabled">Add</KButton>
            <KButton :size="'medium'" :fill-mode="'outline'" @click="emitRemove" :svg-icon="minusIcon"
                :disabled="isDisabled">Remove</KButton>
        </div>
    </div>
</template>

<script>
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { Input as KInput } from '@progress/kendo-vue-inputs';
import { plusIcon, minusIcon } from "@progress/kendo-svg-icons";
export default {
    props: {
        modelValue: {
            type: String,
            default: ''
        },
        parent: {
            type: String
        }
    },
    components: { KButton, KInput },
    emits: ['update:modelValue', 'add', 'remove'],
    data() {
        return {
            localString: this.modelValue,
            plusIcon,
            minusIcon
        }
    },
    watch: {
        modelValue(newValue) {
            this.localString = newValue;
        },
        localString(newValue) {
            this.$emit('update:modelValue', newValue);
        }
    },
    methods: {
        emitAdd() {
            this.$emit('add', this.localString);
        },
        emitRemove() {
            this.$emit('remove', this.localString);
        }
    },
    computed: {
        isDisabled() {
            console.log(this.$props.parent)
            if (this.$props.parent === 'accounts') return !this.$store.state.permissions.accounts.write
            if (this.$props.parent === 'users') return !this.$store.state.permissions.users.write;
            else return true;
        }
    }
}

</script>

<style scoped>
.grid-header .k-floating-label-container {
    position: relative;
    bottom: 10px;
}

.button-group {
    gap: 10px;
}
</style>
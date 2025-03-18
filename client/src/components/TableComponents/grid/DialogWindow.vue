<template>
    <Window v-if="visible" @close="toggleDialog" @overlayclick="toggleDialog" :width="windowStyling.width"
        :height="windowStyling.height" :maximizeButton="'false'" :minimizeButton="'false'" :resizable="false"
        :title="windowStyling.title" :doubleClickStageChange="false" :modal="true">
        <slot></slot>
    </Window>
</template>


<script>
import { Window } from '@progress/kendo-vue-dialogs';
export default {
    props: {
        visible: { required: true, type: Boolean },
        actionType: { required: true, type: String },
        formType: { required: true, type: String },
        selectedId: { required: false, type: String },
        data: { required: false }
    },
    emits: ['update:visible'],
    components: {
        Window
    },
    methods: {
        toggleDialog() {
            this.$emit('update:visible', false)
        },
        handleEscKey(event) {
            if (event.key === 'Escape' || event.keyCode === 27) {
                this.toggleDialog();
            }
        }
    },
    computed: {
        windowStyling() {
            const styles = {
                copy: {
                    default: { height: 280, width: 600, title: `Copy ${this.titleMap} ${this.$props.selectedId}` },
                    landingpages: { height: 280, width: 600, title: `Copy ${this.titleMap}` },
                },
                'change owner': {
                    scenelibraries: { height: 260, width: 600, title: `Change ${this.titleMap}'s ${this.$props.selectedId} Owner` },
                },
                update: {
                    default: { height: 270, width: 600, title: `Update ${this.titleMap} ${this.$props.selectedId}` },
                },
                edit: {
                    storages: { height: 720, width: 500, title: `Edit ${this.titleMap} ${this.$props.selectedId}` },
                    users: { height: 510, width: 600, title: `Edit ${this.$props?.data?.account?.firstName} ${this.$props?.data?.account?.lastName}'s user` },
                    accounts: { height: 765, width: 700, title: `Edit Account ${this.$props.selectedId}` },
                },
                create: {
                    storages: { height: 740, width: 500, title: `Create ${this.titleMap}` },
                    outputconfigs: { height: 725, width: 900, title: `Create ${this.titleMap}` }
                },
                credits: {
                    accounts: { height: 270, width: 600, title: `Update Account ${this.$props.selectedId} credits` },
                },
            };

            const defaultStyle = { height: 350, width: 400, title: 'Something went wrong' };

            const actionStyles = styles[this.$props.actionType];
            if (actionStyles) {
                const formStyle = actionStyles[this.$props.formType] || actionStyles['default'];
                if (formStyle) {
                    const { height, width, title } = formStyle;
                    return { height, width, title };
                }
            }
            return defaultStyle;
        },
        titleMap() {
            const map = {
                landingpages: "Landing Page",
                storyboards: "Storyboard",
                outputconfigs: "Output Config",
                scenelibraries: "Scene Library",
                storages: "Storage"
            }
            return map[this.$props.formType]
        }
    },
    mounted() {
        document.addEventListener('keydown', this.handleEscKey);
    },
    beforeUnmount() {
        document.removeEventListener('keydown', this.handleEscKey)
    }
};

</script>

<style scoped>
:deep(.k-window-titlebar) {
    background-color: var(--kendo-color-primary-hover);
}

:deep(.k-window-title) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 20px;
}

:deep(.k-window-content) {
    background-color: var(--dark-30);
}

:deep(.k-window) {
    box-shadow: none;
    z-index: 3;
}

:deep(.k-overlay) {
    z-index: 3;
}
</style>
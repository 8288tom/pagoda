<template>
    <div class="idm-tooltip">
        <div class="tooltip-icon flex" :class="{ open }" tabindex="0" @click="open = !open" @focusout="open = false"
            @mouseover="onHover ? (open = true) : null" @mouseleave="onHover ? (open = false) : null">
            {{ symbol }}
        </div>
        <div v-show="open" class="text" :class="position" v-html="text"></div>
    </div>
</template>
<script>
export default {
    name: 'IdmTooltip',
    props: {
        text: {
            type: String,
            default:
                'Lorem ipsum dolor, sit amet consectetur adipisicing elit. Consequatur, perspiciatis.',
        },
        symbol: {
            type: String,
            default: '?',
        },
        onHover: {
            type: Boolean,
            default: false,
        },
        position: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            open: false,
        };
    },
};
</script>
<style>
.idm-tooltip {
    width: fit-content;
    border-radius: 50%;
    position: relative;
    z-index: 9999;
}

.tooltip-icon {
    width: 18px;
    height: 18px;
    align-items: center;
    justify-content: center;
    color: var(--natural-300);
    padding-bottom: 2px;
    border: 1px solid var(--natural-300);
    border-radius: 50%;
    cursor: help;
}

.tooltip-icon.open {
    background-color: var(--primary-300);
}


.text {
    height: fit-content;
    max-width: 228px;
    background-color: var(--dark-300);
    font-size: var(--p1);
    padding: 4px 8px 6px;
    border-radius: 6px;
    box-shadow: var(--shadow);
    width: max-content;
    color: #fff;
    position: absolute;
    top: 23px;
    right: 0;
}

.right {
    left: 40px;
    top: -13px;
}



br {
    content: ' ';
    display: block;
    margin: 14px 0;
}
</style>
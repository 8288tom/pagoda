<template>
    <div class="image-container k-selected" v-if="shouldBeImage">
        <img :src="gridProps.dataItem.logo" alt="user logo" loading=”lazy”>
    </div>
    <div class="initials-container flex" v-else>
        <div class="initials-icon">
            <span class="flex">{{ gridProps.dataItem.logo }}</span>
        </div>
    </div>
</template>

<script>

export default {
    props: ['gridProps'],
    computed: {
        shouldBeImage() {
            const givenLogoString = this.$props.gridProps.dataItem.logo;
            const pattern = /^((http|https):\/\/)/
            if (pattern.test(givenLogoString)) return true;
            else return false
        }
    }
}
</script>

<style scoped>
.image-container,
.initials-container {
    height: 55px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.initials-icon,
img {
    width: 50px;
    height: 50px;
    border-radius: 30px;
}

.initials-container,
.image-container {
    align-items: center;
    justify-content: center;
}

.initials-icon,
img {
    background-color: var(--natural-100);
}

.initials-icon span {
    font-size: 18px;
    font-weight: 700;
    line-height: 50px;
    user-select: none;
    text-align: center;
    align-items: center;
    justify-content: center;
    color: #141414;
}
</style>
<template>
    <div class="tools-container flex">
        <AudioToText></AudioToText>
        <SLFromSB></SLFromSB>
    </div>
</template>

<script>
import AudioToText from "./AudioToText.vue";
import SLFromSB from "./SLFromSB.vue";

export default {
    components: {
        AudioToText,
        SLFromSB,
    },
};
</script>

<style scoped>
.tools-container {
    margin-top: 40px;
    justify-content: space-evenly;
    margin-bottom: 50px;
}
</style>

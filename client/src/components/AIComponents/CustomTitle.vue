<template>
    <div class="thumbnail-container flex">
        <a :href="thumbnail" target="_blank">
            <div v-if="!imageLoaded" class="skeleton-wrapper">
                <Skeleton
                    shape="rectangle"
                    style="width: 200px; height: 110px; border-radius: 4%"
                />
            </div>

            <img
                v-if="imageLoaded"
                loading="lazy"
                :src="thumbnail"
                alt="thumbnail"
                @load="handleImageLoad"
                @error="handleImageError"
            />
        </a>
    </div>
</template>

<script>
import { Skeleton } from "@progress/kendo-vue-indicators";

export default {
    components: {
        Skeleton,
    },
    props: {
        thumbnail: {
            type: String,
            required: true,
        },
    },
    data() {
        return {
            imageLoaded: false,
        };
    },
    mounted() {
        // Check if image is already loaded (for cached images)
        const img = new Image();
        img.src = this.thumbnail;
        img.onload = () => {
            this.imageLoaded = true;
        };
    },
    methods: {
        handleImageLoad() {
            this.imageLoaded = true;
        },
        handleImageError() {
            this.imageLoaded = false;
        },
    },
};
</script>

<style scoped>
.thumbnail-container {
    border-radius: 25%;
    height: 50%;
    justify-content: center;

    img {
        height: 110px;
        width: 200px;
        transition: all 250ms ease;
        border-radius: 4%;
    }
    img:hover {
        transform: scale(1.05);
    }
}
</style>

<template>
    <div class="flex inputs" v-for="(video, index) in reactiveElements[outputType].count" :key="index">
        <p>Output # {{ index + 1 }}</p>

        <template v-for="field in dropDownOptions[outputType]" :key="field">
            <DropDownList v-if="field === 'format' && outputType === 'videos'" :label="capitalize(field)"
                :data-items="enums.videos.format" v-model="reactiveElements[outputType].output[index][field]">
            </DropDownList>

            <DropDownList v-if="field === 'color_depth' && outputType === 'gifs'" :label="capitalize(field)"
                :data-items="enums.gifs.color_depth" v-model="reactiveElements[outputType].output[index][field]">
            </DropDownList>

            <template v-if="outputType === 'audio'">
                <DropDownList v-if="field === 'format'" :label="capitalize(field)" :data-items="enums.audio.format"
                    v-model="reactiveElements[outputType].output[index][field]">
                </DropDownList>
                <DropDownList v-if="field === 'sample_rate'" :label="capitalize(field)"
                    :data-items="enums.audio.sample_rate" v-model="reactiveElements[outputType].output[index][field]">
                </DropDownList>
                <DropDownList v-if="field === 'bit_depth'" :label="capitalize(field)"
                    :data-items="enums.audio.bit_depth" v-model="reactiveElements[outputType].output[index][field]">
                </DropDownList>
                <DropDownList v-if="field === 'bitrate'" :label="capitalize(field)" :data-items="enums.audio.bitrate"
                    v-model="reactiveElements[outputType].output[index][field]">
                </DropDownList>
                <DropDownList v-if="field === 'channels'" :label="capitalize(field)" :data-items="enums.audio.channels"
                    v-model="reactiveElements[outputType].output[index][field]">
                </DropDownList>
            </template>

        </template>

        <template v-for="field in inputOptions[outputType]" :key="field">
            <KInput v :label="capitalize(field)" v-model="reactiveElements[outputType].output[index][field]"
                class="inputs-text" :placeholder="placeholders[outputType][field]"
                :valid="isMandatoryFieldValid[`${field}_${index}`] !== false"
                :validationMessage="validationMessage[`${field}_${index}`]">
            </KInput>
        </template>

        <div class="overlays-buttons flex">
            <KButton v-if="shouldRenderOverlays" :svgIcon="plusIcon" :rounded="'small'"
                @click="() => addOverlay(outputType, index)" :theme-color="'success'" :fill-mode="'solid'"> Add
                Overlay
            </KButton>
            <KButton v-if="shouldRenderOverlays" :svgIcon="minusIcon" :rounded="'small'"
                @click="() => removeItem(outputType, 'overlays', index)" :theme-color="'warning'" :fill-mode="'solid'">
                Remove
                Overlay
            </KButton>
        </div>



        <div class="overlays-container" v-if="shouldRenderOverlays">
            <div class="flex overlays" v-for="(overlay, i) in reactiveElements[outputType].overlays[index].count"
                :key="i">
                <KInput :label="'Path'" v-model="reactiveElements[outputType].output[index].overlays[i].path"
                    :placeholder="'pal://play_2.png'" class="overlay-path-input"></KInput>
                <DropDownList :label="'Horizontal'" :data-items="enums.alignment.horz"
                    v-model="reactiveElements[outputType].output[index].overlays[i].alignment.horizontal">
                </DropDownList>
                <DropDownList :label="'Vertical'" :data-items="enums.alignment.vert"
                    v-model="reactiveElements[outputType].output[index].overlays[i].alignment.vertical">
                </DropDownList>
                <DropDownList :label="'Scale Type'" :data-items="enums.alignment.scale"
                    v-model="reactiveElements[outputType].output[index].overlays[i].alignment.scale_type">
                </DropDownList>
            </div>
        </div>
        <div class="hr"></div>

    </div>

    <div class="output-buttons flex">
        <KButton v-if="reactiveElements[outputType].count.length <= 3" :label="'add item'" :svgIcon="plusIcon"
            :rounded="'small'" @click="() => addItem(outputType, undefined, index)" :theme-color="'tertiary'"
            :fill-mode="'outline'">Add Output
        </KButton>
        <KButton :label="'remove item'" :svgIcon="minusIcon" :rounded="'small'" @click="() => removeItem(outputType)"
            :theme-color="'warning'" :fill-mode="'solid'">
            Remove Output
        </KButton>
    </div>

    <!-- <div class="hr"></div> -->
</template>



<script>
import { Button as KButton } from "@progress/kendo-vue-buttons";
import { Input as KInput } from '@progress/kendo-vue-inputs';
import { DropDownList } from '@progress/kendo-vue-dropdowns';
import { minusIcon, plusIcon } from "@progress/kendo-svg-icons";
import { isValueDigits } from "@/utils/generalUtilities";

const inputOptions = {
    videos: ['height', 'quality', 'landing_page_id', 'crop_to_ratio', 'suffix', 'label'],
    gifs: ['height', 'time', 'duration', 'fps', 'loop', 'landing_page_id', 'crop_to_ratio', 'suffix', 'label'],
    jpgs: ['height', 'time', 'crop_to_ratio', 'suffix', 'label']
}
const dropDownOptions = {
    videos: ['format'],
    gifs: ['color_depth'],
    audio: ['format', 'sample_rate', 'bit_depth', 'bitrate', 'channels']
}
const enums = {
    videos: { format: ['mp4', 'hls', 'webm'] },
    gifs: { color_depth: [4, 8, 16, 32, 64, 128, 256] },
    audio: {
        format: ['wav', 'mp3'],
        sample_rate: [22050, 32000, 44100, 48000, 64000, 88200, 96000],
        bit_depth: [16, 32],
        bitrate: [8, 16, 24, 32, 40, 48, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
        channels: ['stereo', 'mono']
    },
    alignment: { horz: ['left', 'center', 'right'], vert: ['top', 'middle', 'bottom'], scale: ['fit', 'fill', 'none'] }
}



const placeholders = {
    videos: {
        quality: '26',
        height: '720',
        landing_page_id: '1005',
        crop_to_ratio: '4,5',
        suffix: '_1',
        label: 'label'
    },
    jpgs: {
        height: '720',
        time: '2',
        crop_to_ratio: '4,5',
        suffix: '_1',
        label: 'label'
    },
    gifs: {
        height: '720',
        time: '2',
        duration: '2',
        fps: '30',
        loop: '1',
        crop_to_ratio: '4,5',
        suffix: '_1',
        label: 'label'

    }
}

export default {
    props: {
        outputType: String,
        shouldEmit: Boolean
    },
    emits: ['data'],
    components: { KButton, KInput, DropDownList },
    data() {
        return {
            reactiveElements: {
                videos: { count: [], output: [], overlays: [] },
                gifs: { count: [], output: [], overlays: [] },
                jpgs: { count: [], output: [], overlays: [] },
                audio: { count: [], output: [] }
            },
            plusIcon,
            minusIcon
        }
    },
    methods: {
        removeItem(outputType, type, index) {
            //handle overlay removal
            if (type === 'overlays') {
                if (!this.reactiveElements[outputType].overlays[index].count) return;
                return this.reactiveElements[outputType].overlays[index].count--
            }
            //handle output removal
            this.reactiveElements[outputType].count.pop();
            this.reactiveElements[outputType].output.pop();

        },
        addOverlay(outputType, index) {
            this.reactiveElements[outputType].output[index].overlays.push({ path: 'pal://play_2.png', alignment: { horizontal: "center", vertical: "middle", scale_type: "fit" } }) //adds the object to be used for call
            this.reactiveElements[outputType].overlays[index].count++ //adds the overlay visually
        },
        addItem(outputType) {
            const baseOutputObject = {
                height: 720,
                overlays: [],
                suffix: null,
                label: null,
                crop_to_ratio: null
            };

            if (outputType === 'audio') {
                if (this.reactiveElements.audio.count.length === 0) {
                    this.reactiveElements.audio.output.push(
                        {
                            format: 'wav',
                            sample_rate: 44100,
                            bit_depth: 16,
                            bitrate: 192,
                            channels: 'stereo'
                        })
                    this.reactiveElements.audio.count.push({})
                }
                // can only have 1 audio output
            }
            else {
                if (outputType === 'videos') this.reactiveElements.videos.output.push(
                    {
                        ...baseOutputObject,
                        format: 'mp4',
                        quality: 26,
                        landing_page_id: null,
                        crop_to_ratio: null,
                    }
                )
                if (outputType === 'jpgs') this.reactiveElements.jpgs.output.push(
                    {
                        ...baseOutputObject,
                        time: 2,
                        crop_to_ratio: null,
                    }
                )
                if (outputType === 'gifs') this.reactiveElements.gifs.output.push(
                    {
                        ...baseOutputObject,
                        time: 2,
                        duration: 2,
                        fps: 30,
                        color_depth: 256,
                        loop: 0,
                    }
                )
                this.reactiveElements[outputType].overlays.push({ count: 0 }) //this is to initialize the object that's going to be used in addOverlay method
                this.reactiveElements[outputType].count.push({}) //adds the outputType visually
            }
        },
        capitalize(string) {
            return string.charAt(0).toUpperCase() + string.slice(1).replace(/_/g, ' ');
        }
    },
    computed: {
        shouldRenderOverlays() {
            return this.reactiveElements[this.outputType].count.length >= 1 && this.outputType !== 'audio'
        },
        inputOptions() {
            return inputOptions;
        },
        dropDownOptions() {
            return dropDownOptions;
        },
        enums() {
            return enums;
        },
        placeholders() {
            return placeholders
        },
        isMandatoryFieldValid() {
            // Returns an object with validation booleans keyed by field and index.
            const validations = {};
            const output = this.reactiveElements[this.outputType].output;

            output.forEach((item, index) => {
                // Validate mandatory fields (height, time, fps if they exist in this outputType) and all digit-only fields.
                const mandatoryFields = ['height', 'time', 'fps'];
                const digitFields = ['height', 'quality', 'landing_page_id', 'time', 'fps', 'duration', 'loop'];

                // Check each field:
                digitFields.forEach(field => {
                    if (field in item) {
                        const value = item[field];
                        // Check digits:
                        const isValidDigits = value == null || value === '' ? false : isValueDigits(String(value));

                        // If field is mandatory and must be non-empty and digits:
                        if (mandatoryFields.includes(field)) {
                            validations[`${field}_${index}`] = !!value && isValidDigits;
                        }
                        else {
                            // Not mandatory, just checking digits if present
                            validations[`${field}_${index}`] = (value == null || value === '') ? true : isValidDigits;
                        }
                    }
                });
            });

            return validations;
        },
        validationMessage() {
            // Returns an object with validation messages keyed by field and index.
            const messages = {};
            const output = this.reactiveElements[this.outputType].output;
            const mandatoryFields = ['height', 'time', 'fps'];
            const digitFields = ['height', 'quality', 'landing_page_id', 'time', 'fps', 'duration', 'loop'];

            output.forEach((item, index) => {
                digitFields.forEach(field => {
                    if (field in item) {
                        const value = item[field];
                        // Check mandatory
                        if (mandatoryFields.includes(field)) {
                            if (!value) {
                                messages[`${field}_${index}`] = `${this.capitalize(field)} is required`;
                            }
                            else if (!isValueDigits(String(value))) {
                                messages[`${field}_${index}`] = `${this.capitalize(field)} must be digits`;
                            }
                        }
                        else {
                            // Not mandatory, only show message if not digits and not empty
                            if (value != null && value !== '' && !isValueDigits(String(value))) {
                                messages[`${field}_${index}`] = `${this.capitalize(field)} must be digits`;
                            }
                        }
                    }
                });
            });
            return messages;
        }
    },
    watch: {
        shouldEmit() {
            this.$emit('data', { [this.outputType]: this.reactiveElements[this.outputType].output });
        }
    }

}

</script>

<style scoped>
.audio-dropdowns {
    display: flex;
    flex-direction: row;
}

.inputs {
    width: 50%;
    flex-direction: column;
    align-items: stretch;
    margin: 0 auto;
    gap: 20px;

}

.overlays {
    gap: 20px;
    margin: auto;
    flex-wrap: wrap;
    justify-content: space-between;

    .k-floating-label-container {
        width: 25%;
    }

    .overlay-path-input {
        width: 100%;
        flex-basis: 100%;
        display: block;
    }
}

.overlays:not(:first-child) {
    margin-top: 25px;

}

.overlays-buttons,
.output-buttons {
    padding: 5px;
    margin-top: 20px;
    gap: 10px;
    justify-content: center;

}


.hr {
    border-bottom: 1px var(--dark-200) solid;
    display: block;
}
</style>
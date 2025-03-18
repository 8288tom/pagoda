<template>
    <NotificationGroup :style="{ bottom: 0, right: 0, alignItems: 'flex-end', zIndex: 9999999 }" :positionMode="'fixed'"
        :appendTo="appendTarget">
        <Reveal :appear="isVisible">
            <Notification v-if="isVisible" :type="notificationType" :closable="true" @close="onClose">
                <span>{{ message }}</span>
            </Notification>
        </Reveal>
    </NotificationGroup>
</template>



<script>
import { Reveal } from '@progress/kendo-vue-animation';
import { Notification, NotificationGroup } from '@progress/kendo-vue-notification';
export default {
    components: {
        Notification,
        NotificationGroup,
        Reveal
    },
    props: {
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            notificationTimer: 7000,
            timer: null,
            appendTarget: null
        }
    },
    computed: {
        isVisible() {
            return !!this.message;
        },
        notificationType() {
            return { style: this.type, icon: true };
        }
    },
    methods: {
        startCloseTimer() {
            this.clearCloseTimer();
            this.timer = setTimeout(() => {
                this.onClose();
            }, this.notificationTimer);
        },
        clearCloseTimer() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        }, onClose() {
            this.clearCloseTimer();
            this.$store.commit('setNotificationMessage', { message: '', type: '' });
        }
    }, watch: {
        isVisible(newValue) {
            if (newValue) {
                this.startCloseTimer();
            } else {
                this.clearCloseTimer();
            }
        }
    },
    beforeUnmount() {
        this.clearCloseTimer();
    },
    mounted() {
        this.appendTarget = document.body;
    }
}


</script>

<style scoped>
:deep(.k-notification) {
    font-size: 22px;
}

:deep(.k-notification-success) {
    border-color: #1BD34F;
    background-color: #1BD34F;
}

:deep(.k-notification-error) {
    border-color: #FF5F2C;
    background-color: #FF5F2C;
}
</style>
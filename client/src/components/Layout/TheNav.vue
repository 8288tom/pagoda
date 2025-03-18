<template>
    <nav class="navbar" v-if="isNavVisible">
        <ul class="navbar-nav flex">
            <li class="nav-item" v-if="permissions?.accounts?.read">
                <router-link class="nav-link" to="/accounts" draggable="false">
                    <SvgIcon :icon="userIcon"></SvgIcon>
                    <span class="link-text">Accounts</span>
                </router-link>
            </li>
            <li class="nav-item" v-if="permissions?.users?.read">
                <router-link class="nav-link" to="/users" draggable="false">
                    <SvgIcon :icon="userOutlineIcon"></SvgIcon>
                    <span class="link-text">Users</span>
                </router-link>
            </li>
            <li class="nav-item" v-if="permissions?.storyboards?.read">
                <router-link class="nav-link" to="/storyboards" draggable="false">
                    <SvgIcon>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24"
                        >
                            <!-- Icon from All by undefined - undefined -->
                            <path
                                fill="currentColor"
                                d="M3 19q-.825 0-1.412-.587T1 17V7q0-.825.588-1.412T3 5h10q.825 0 1.413.588T15 7v10q0 .825-.587 1.413T13 19zm15-8q-.425 0-.712-.288T17 10V6q0-.425.288-.712T18 5h4q.425 0 .713.288T23 6v4q0 .425-.288.713T22 11zm1-2h2V7h-2zM3 17h10V7H3zm1-2h8l-2.625-3.5L7.5 14l-1.375-1.825zm14 4q-.425 0-.712-.288T17 18v-4q0-.425.288-.712T18 13h4q.425 0 .713.288T23 14v4q0 .425-.288.713T22 19zm1-2h2v-2h-2zM3 17V7zm16-8V7zm0 8v-2z"
                            ></path>
                        </svg>
                    </SvgIcon>
                    <span class="link-text">Storyboards</span>
                </router-link>
            </li>
            <li class="nav-item" v-if="permissions?.scenelibraries?.read">
                <router-link class="nav-link" to="/scenelibraries" draggable="false">
                    <SvgIcon :icon="imagesIcon"></SvgIcon>
                    <span class="link-text">Scene Libraries</span>
                </router-link>
            </li>
            <li class="nav-item" v-if="permissions?.storages?.read">
                <router-link class="nav-link" to="/storages" draggable="false">
                    <SvgIcon>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24"
                        >
                            <!-- Icon from All by undefined - undefined -->
                            <path
                                fill="currentColor"
                                d="M18 4v16H6V8.83L10.83 4zm0-2h-8L4 8v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2M9 7h2v4H9zm3 0h2v4h-2zm3 0h2v4h-2z"
                            ></path>
                        </svg>
                    </SvgIcon>
                    <span class="link-text">Storages</span>
                </router-link>
            </li>
            <li class="nav-item" v-if="permissions?.outputconfigs?.read">
                <router-link class="nav-link" to="/outputconfigs" draggable="false">
                    <SvgIcon :icon="fileConfigIcon"></SvgIcon>
                    <span class="link-text">Output Configs</span>
                </router-link>
            </li>
            <li class="nav-item" v-if="permissions?.landingpages?.read">
                <router-link class="nav-link" to="/landingpages" draggable="false">
                    <SvgIcon>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="0.92em"
                            height="0.92em"
                            viewBox="0 0 14 14"
                        >
                            <path
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M.5 3.494h13M12.5.5h-11a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-11a1 1 0 0 0-1-1"
                            ></path>
                        </svg>
                    </SvgIcon>
                    <span class="link-text">Landing Pages</span>
                </router-link>
            </li>
            <!-- <li class="nav-item" v-if="permissions?.aiads?.read">
                <router-link class="nav-link" to="/aiads" draggable="false">
                    <SvgIcon>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24"
                        >
                            <g
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="1.5"
                                color="currentColor"
                            >
                                <path
                                    d="m21.255 7.134l-.494-.857c-.373-.648-.56-.972-.877-1.1c-.71-.29-1.908.32-2.615.52c-.627.144-1.165-.058-1.696-.364a2 2 0 0 1-.788-.968c-.214-.64-.358-1.767-.925-2.176C13.6 2 13.252 2 12.557 2h-1.114c-.695 0-1.042 0-1.303.189c-.567.409-.71 1.536-.925 2.176c-.213.554-.633.878-1.125 1.162a2 2 0 0 1-1.359.17c-.706-.2-1.905-.81-2.615-.52c-.317.128-.504.452-.877 1.1l-.494.857c-.35.607-.525.91-.49 1.234c.083.803 1.253 1.682 1.767 2.257c.252.319.43.875.43 1.375s-.178 1.056-.43 1.375c-.514.575-1.684 1.454-1.768 2.257c-.034.324.141.627.491 1.234l.494.857c.373.648.56.972.877 1.1c.71.29 1.909-.32 2.615-.52c.982-.226 2.123.39 2.484 1.332c.214.64.358 1.767.925 2.176c.261.189.608.189 1.303.189h1.114c.695 0 1.042 0 1.303-.189c.262-.189.372-.518.591-1.178c.247-.74.42-1.517 1.122-1.966c.53-.306 1.069-.508 1.696-.364c.707.2 1.905.81 2.615.52c.317-.128.504-.452.877-1.1l.494-.857c.35-.607.525-.91.49-1.234c-.084-.803-1.253-1.682-1.767-2.257c-.583-.738-.582-2.012 0-2.75c.514-.575 1.683-1.454 1.768-2.257c.034-.324-.141-.627-.491-1.234"
                                ></path>
                                <path
                                    d="m7.438 14.992l1.841-5.525a.694.694 0 0 1 1.317 0l1.842 5.525m-4-2h3m4-4v6"
                                ></path>
                            </g>
                        </svg>
                    </SvgIcon>
                    <span class="link-text">AI Ads</span>
                </router-link>
             </li> -->
            <li class="nav-item" v-if="permissions?.tools?.read">
                <router-link class="nav-link" to="/tools" draggable="false">
                    <SvgIcon>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="1em"
                            height="1em"
                            viewBox="0 0 24 24"
                        >
                            <path
                                fill="currentColor"
                                d="m19.275 19.8l.7-.7L12 11.125q.475-.575.738-1.3T13 8.3q0-1.875-1.313-3.175T8.5 3.825h-.25L11.325 6.9l-4.25 4.225L4 8.05v.275Q4 10.2 5.312 11.5T8.5 12.8q.8 0 1.513-.263T11.3 11.8l7.975 8ZM5.375 3.25q0-.725.775-1.088T8.5 1.8q2.725 0 4.612 1.888T15 8.3q0 .65-.125 1.288T14.5 10.8l6.875 6.875q.575.575.588 1.413T21.4 20.5l-.675.7q-.575.6-1.413.613t-1.437-.588l-6.9-6.9q-.575.25-1.2.363t-1.25.112q-2.725 0-4.612-1.887T2.025 8.3q0-1.6.35-2.363t1.075-.762q.25 0 .463.088t.387.262L7.075 8.3L8.5 6.9L5.725 4.125q-.175-.175-.263-.4t-.087-.475ZM9.2 9Z"
                            ></path>
                        </svg>
                    </SvgIcon>
                    <span class="link-text">Tools</span>
                </router-link>
            </li>
        </ul>
    </nav>
</template>

<script>
import { SvgIcon } from "@progress/kendo-vue-common";
import {
    userIcon,
    userOutlineIcon,
    imagesIcon,
    fileConfigIcon,
} from "@progress/kendo-svg-icons";
export default {
    components: {
        SvgIcon,
    },
    data() {
        return {
            userIcon,
            userOutlineIcon,
            imagesIcon,
            fileConfigIcon,
        };
    },
    computed: {
        permissions() {
            if (this.$store.state?.permissions) return this.$store.state.permissions;
            return {};
        },
        isNavVisible() {
            if (Object.keys(this.$store.state.permissions).length > 0) {
                return true;
            }
            return false;
        },
    },
};
</script>

<style scoped>
.navbar {
    padding-top: var(--header-height);
    user-select: none;
    z-index: 2;
    width: var(--navbar-width);
    border-radius: 0.5%;
    height: 100dvh;
    position: fixed;
    background-color: var(--primary-300);
    transition: width 300ms ease;
    overflow-y: auto;
}

.navbar::-webkit-scrollbar {
    width: 0;
}

.navbar-nav {
    list-style: none;
    height: 94%;
    padding: 0;
    margin: 0;
    /* margin-top:var(--header-height); */
    flex-direction: column;
    align-items: center;
}

.navbar .k-icon {
    font-size: 25px;
    color: var(--kendo-color-primary);
    min-width: 20px;
    margin: 0 15px;
    transition: color var(--transition-500) ease;
}

.nav-item {
    width: 100%;
    user-select: none;
}

.nav-link {
    display: flex;
    align-items: center;
    height: 70px;
    text-decoration: none;
    filter: grayscale(100%) opacity(0.7);
    transition: var(--transition-500);
}

.nav-link:hover {
    filter: grayscale(0%) opacity(1);
    background-color: var(--primary-400);
    color: var(--text-secondary);
}

.nav-link:active {
    background-color: var(--primary-500);
}

.link-text {
    color: var(--dark-500);
    text-wrap: nowrap;
    font-size: 14px;
    opacity: 0%;
    visibility: hidden;
    transition: opacity 500ms;
    /* Truncating text */
    overflow: hidden;
    text-overflow: ellipsis;
}

.navbar:hover .link-text {
    opacity: 100%;
    visibility: visible;
}

.navbar:hover {
    width: 160px;
}
</style>

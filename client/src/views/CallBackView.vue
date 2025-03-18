<template>
    <h4>Processing login...</h4>
</template>

<script>
import userManager from '../auth';
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';


export default {
    setup() {
        const store = useStore();
        const router = useRouter();


        onMounted(async () => {
            try {
                // Process the resposne from Jumpcloud
                const user = await userManager.signinRedirectCallback();
                if (user) {
                    store.commit('setUser', user)
                    setTimeout(() => { }, 1000) // timeout to set user, otherwise there's an issue with homeview
                }
                router.push('/');// Redirect to home after login
            } catch (error) {
                console.error("Error during signin redirect callback:", error);
                router.push('/login');  // Redirect to login view on failure
            }
        })


    }

};
</script>
<template>
    <div>Login via jumpcloud</div>
    <button @click="authenticate">Click here to login</button>
</template>

<script>
import userManager from '../auth';

export default {
    methods: {
        async authenticate() {
            try {
                await userManager.signinRedirect();
            } catch (error) {
                console.error('Error during signin redirect:', error);
            }
        }
    }

};
</script>
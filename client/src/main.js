import { createApp } from 'vue'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'
import { setContext } from '@apollo/client/link/context';
import '@progress/kendo-theme-default/dist/all.css';
import App from './App.vue'
import router from './router.js'
import store from './store.js';
import NotificationPopup from '@/components/misc/NotificationPopup.vue';

// import userManager from './auth';

const cache = new InMemoryCache()
const httpLink = createHttpLink({
    uri: store.state.baseAPI
})

const authLink = setContext((_, { headers }) => {
    const token = store.state.user.id_token || '';

    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : ""
        }
    }
})

const apolloClient = new ApolloClient({
    cache,
    // uri: store.state.baseAPI,
    link: authLink.concat(httpLink)
})

async function initializeApp() {
    const app = createApp(App)
    app.provide(DefaultApolloClient, apolloClient)
    app.use(store)
    app.use(router)
    app.component('NotificationPopup', NotificationPopup)

    app.mount('#app');
}


initializeApp()




import { betaFeaturesOptions } from "@/components/TableComponents/forms/formHelpers";
import { isLocalDevEnv } from "./generalUtilities";

function showNotification(store, success, successMessage, errorMessage) {
    store.commit('setNotificationMessage', {
        message: success ? successMessage : errorMessage,
        type: success ? 'success' : 'error',
    });
}

async function initApp(store, apolloClient, query) {
    try {
        const { data } = await apolloClient.query({ query })
        isLocalDevEnv()
            ? store.commit('setUser', { id_token: "just-for-dev-unused", profile: { email: 'DEVELOPER' } }) //this causes a  bug only in dev when you refresh the app you won't see TheNav doens't happen in Prod due to callback component
            : null
        store.commit('setPermissions', data.initApp.user);
        store.commit('setCollectionCount', data.initApp.docCount)
        betaFeaturesOptions.features = data.initApp.betaFeatures;
    } catch (e) {
        console.error(e)
        showNotification(store, false, undefined, e.message)
    }
}


export { showNotification, initApp }
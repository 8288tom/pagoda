import { UserManager, /*Log*/ } from "oidc-client";
// Log.logger = console;
// Log.level = Log.DEBUG;


// Settings for the OIDC client, data is from Jumpcloud
const settings = {
    authority: 'https://oauth.id.jumpcloud.com/', // don't change this
    client_id: process.env.VUE_APP_JUMPCLOUD_CLIENT_ID, // client_id from SSO application in Jumpcloud    
    redirect_uri: process.env.VUE_APP_JUMPCLOUD_REDIRECT_URI, // URI to accept the authorization resposne from Jumpcloud
    response_type: 'code',
    scope: 'openid profile email'
    // userStore: new WebStorageStateStore({ store: new InMemoryWebStorage() }) //to overwrite usage of localstorage and session storage by default of the package
    // loadUserInfo: true,
};



const userManager = new UserManager(settings);
export default userManager;

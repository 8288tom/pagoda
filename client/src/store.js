import { createStore } from 'vuex'
import createPersistedState from 'vuex-persistedstate';
import { isLocalDevEnv } from '@/utils/generalUtilities';

export default createStore({
  state: {
    baseAPI: isLocalDevEnv() ? "http://localhost:4000/" : process.env.VUE_APP_BASE_API,
    user: {},
    permissions: [],
    docCount: {},
    isAdmin: false,
    notificationMessage: "",
    notificationType: "",
    loading: false
  },
  mutations: {
    setNotificationMessage(state, payload) {
      state.notificationMessage = payload.message;
      state.notificationType = payload.type;
    },
    setLoading(state) {
      state.loading = !state.loading;
    },
    setUser(state, payload) {
      const { id_token, profile } = payload
      state.user = { id_token, email: profile.email }
    },
    setPermissions(state, payload) {
      const userPermissionsArray = JSON.parse(JSON.stringify(payload.permissions))
      const formattedPermissions = userPermissionsArray.reduce((acc, item) => {
        acc[item.name] = { read: item.read, write: item.write };
        return acc
      }, {})
      state.permissions = formattedPermissions;
      state.isAdmin = payload.isAdmin
    },
    setCollectionCount(state, payload) {
      state.docCount = payload;
    }
  },
  plugins: [
    createPersistedState({
      storage: window.sessionStorage,
      paths: ['permissions', 'isAdmin'],
    }),
  ],
})




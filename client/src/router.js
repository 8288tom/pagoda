import { createRouter, createWebHistory } from 'vue-router'
import CallbackView from './views/CallBackView.vue';
import userManager from '@/auth';
import HomeView from '@/views/HomeView.vue';
import TabView from './views/TabsView.vue';
import AdminView from './views/AdminView.vue';
import LoginView from './views/LoginView.vue';
import NotFound from './views/404View.vue'
import store from './store';
import { isLocalDevEnv } from './utils/generalUtilities';
import { showNotification } from './utils/contextHelpers';
const routes = [
  {
    path: '/',
    component: HomeView
  },
  {
    path: '/accounts',
    component: TabView,
    props: { activeTab: 'accounts' }
  },
  {
    path: '/users',
    component: TabView,
    props: { activeTab: 'users' }
  },
  {
    path: '/storyboards',
    component: TabView,
    props: { activeTab: 'storyboards' }
  },
  {
    path: '/scenelibraries',
    component: TabView,
    props: { activeTab: 'scenelibraries' }
  },
  {
    path: '/storages',
    component: TabView,
    props: { activeTab: 'storages' }
  },
  {
    path: '/outputconfigs',
    component: TabView,
    props: { activeTab: 'outputconfigs' }
  },
  {
    path: '/landingpages',
    component: TabView,
    props: { activeTab: 'landingpages' }
  },
  {
    path: '/aiads',
    component: TabView,
    props: { activeTab: 'aiads' }
  },
  {
    path: '/tools',
    component: TabView,
    props:{ activeTab: 'tools'}
  },
  {
    path: '/admin',
    component: AdminView
  },
  {
    path: '/login',
    component: LoginView
  },
  {
    path: '/callback',
    component: CallbackView  // Use the callback component to handle SSO redirect
  },
  {
    path: '/:pathMatch(.*)*',
    component: NotFound
  },

]





const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  if (to.path === '/callback') {
    next();
    return;
  }
  //clear localStorage open tabs
  if (to.path === '/') {
    localStorage.removeItem('openTabs')
  }

  try {
    if (isLocalDevEnv()) {
      return next(); // discard SSO flow when in dev, backend should run on localhost:4000
    }
    const user = await userManager.getUser();
    if (user) {
      console.log('Is token expired:', user.expired)
      if (Object.keys(store.state.user).length === 0) store.commit('setUser', user)
      if (user.expired) userManager.signinRedirect()
      next();
    } else {
      await userManager.signinRedirect();
    }
  } catch (e) {
    console.error('Authentication error:', e);
    next('/login');
    showNotification(store, false, undefined, e.message)
  }
});


export default router

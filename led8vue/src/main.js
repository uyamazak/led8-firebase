import Vue from 'vue'
import App from './App.vue'
import BootstrapVue from 'bootstrap-vue'
import './registerServiceWorker'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import myFirebase from './plugins/my-firebase'
import eventHub from './plugins/event-hub'
import dateAndTime from './plugins/date-and-time'

Vue.use(BootstrapVue)
Vue.use(myFirebase)
Vue.use(eventHub)
Vue.use(dateAndTime)

Vue.config.productionTip = false
new Vue({
  render: h => h(App)
}).$mount('#app')

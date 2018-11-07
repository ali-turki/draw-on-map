import Vue from 'vue'
import App from './App.vue'
// import * as VueGoogleMaps from 'vue2-google-maps'
// import GoogleMapsLoader from 'google-maps'
Vue.config.productionTip = false

// Vue.use(VueGoogleMaps, {
//   load: {
//     key: 'AIzaSyCLD0bCo84bU-S8FqwFw8AAc2IlxR8LuOA'
//   }
// })

new Vue({
  render: h => h(App),
}).$mount('#app')

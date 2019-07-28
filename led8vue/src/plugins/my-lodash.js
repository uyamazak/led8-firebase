import _ from 'lodash'
const myLodash = {
  install: function (Vue, options) {
    Vue.prototype.$lodash = _
  }
}
export default myLodash

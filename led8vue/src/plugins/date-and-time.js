import date from 'date-and-time'
const dateAndTime = {
  install: function (Vue, options) {
    Vue.prototype.$date = date
  }
}
export default dateAndTime

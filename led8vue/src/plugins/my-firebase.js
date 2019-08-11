import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import 'firebase/storage'
const firebaseConfig = {
  apiKey: process.env.VUE_APP_API_KEY,
  authDomain: process.env.VUE_APP_AUTH_DOMAIN,
  databaseURL: process.env.VUE_APP_DATABASE_URL,
  projectId: process.env.VUE_APP_PROJECT_ID,
  storageBucket: process.env.VUE_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.VUE_APP_MESSAGING_SENDER_ID,
  appId: process.env.VUE_APP_APP_ID
}
firebase.initializeApp(firebaseConfig)
const db = firebase.firestore()
const storage = firebase.storage()

const myFirebase = {
  install: function (Vue, options) {
    const main = new Vue({
      data: {
        user: {}
      },
      computed: {
        db: function () {
          return db
        },
        isAuthenticated: function () {
          return (this.user && this.user.uid)
        },
        commandCollectionRef: function () {
          return db.collection('/commands/')
        },
        photoCollectionRef: function () {
          return db.collection('/photos/')
        },
        commandCountDocumentRef: function () {
          return db.doc('/counters/command')
        },
        photoCountDocumentRef: function () {
          return db.doc('/counters/photo')
        }
      },
      methods: {
        signInGoogle: function () {
          firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider())
        },
        signOut: function () {
          firebase
            .auth()
            .signOut()
            .then(() => {
              this.showNotification('login success', 'success')
            })
            .catch(error => {
              console.error(error)
            })
        },
        addLEDCommand: function (ledStatus) {
          if (!this.isAuthenticated) {
            console.error('addCommand, not authenticated')
            return
          }

          const cmd = {
            uid: this.user.uid,
            status: ledStatus,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          }
          return this.commandCollectionRef
            .add(cmd)
            .then(result => {
              console.log('addCommand success', result)
            }).catch(error => {
              console.error('addCommand error', error)
            })
        },
        getRecentLEDStatus: function () {
          return this.commandCollectionRef.orderBy('timestamp', 'desc').limit(1).get()
        },
        getLEDCommandLog: function (callback, limit) {
          return this.commandCollectionRef.orderBy('timestamp', 'desc').limit(limit).onSnapshot(callback)
        },
        getRecentPhotoLog: function (callback) {
          return this.photoCollectionRef.orderBy('timestamp', 'desc').limit(1).onSnapshot(callback)
        },
        getPhotoUrl: function (path) {
          return storage.ref().child(path).getDownloadURL()
        },
        getCommandCount: function (callback) {
          // https://firebase.google.com/docs/firestore/query-data/listen?hl=ja
          return this.commandCountDocumentRef.onSnapshot(callback)
        },
        getPhotoCount: function (callback) {
          return this.photoCountDocumentRef.onSnapshot(callback)
        }
      }
    })
    firebase
      .auth()
      .getRedirectResult()
      .then(function (result) {
        if (result.credential) {
          console.log(result.user.email, 'success')
        }
      })
      .catch(function (error) {
        console.log(error.message, 'error')
      })

    firebase
      .auth()
      .onAuthStateChanged(user => {
        main.user = user
        if (user) {
          main.$eventHub.$emit('firebase-signedin')
        }
      })
    Vue.prototype.$firebase = main
  }
}
export default myFirebase

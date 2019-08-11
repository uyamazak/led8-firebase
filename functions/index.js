const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()
const firestore = admin.firestore()
const incrementValue = admin.firestore.FieldValue.increment(1)

exports.incrementCommandCount = functions.firestore
  .document('/commands/{commandId}')
  .onCreate(async (snap, context) => {
    await firestore.doc('/counters/command').update({value: incrementValue})
    return true
  })

exports.incrementPhotoCount = functions.firestore
  .document('/photos/{photoId}')
  .onCreate(async (snap, context) => {
    await firestore.doc('/counters/photo').update({value: incrementValue})
    return true
  })
const admin = require('firebase-admin');

const config = require('../config');
admin.initializeApp({
    credential: admin.credential.cert(config.serviceAccount),
    databaseURL: config.firebase.databaseURL
});

const db = admin.firestore();

module.exports = { admin, db };
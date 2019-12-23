const admin = require('firebase-admin');

// Uncomment this and comment line below to serve locally
// const config = require('../config');
// admin.initializeApp(config.serviceAccount);
admin.initializeApp();

const db = admin.firestore();

module.exports = { admin, db };
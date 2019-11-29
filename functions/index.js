const functions = require("firebase-functions");

const app = require('express')();

const firebaseAuth = require('./util/firebaseAuth');

const { 
	getAllPosts,
	postOnePost,
	getPost, 
	commentOnPost
} = require('./handlers/posts')
const { 
	signup, 
	login, 
	uploadImage, 
	addUserDetails, 
	getAuthenticatedUser
} = require('./handlers/users');

// Kusoposts routes
app.get('/kusoposts', getAllPosts);
app.post('/kusopost', firebaseAuth, postOnePost);
app.get('/kusopost/:kusopostId', getPost);
// TODO: delete post
// TODO: like a post
// TODO: unlike a post
app.post('/kusopost/:kusopostId/comment', firebaseAuth, commentOnPost);

// Users routes
app.post('/singup', signup);
app.post('/login', login);
app.post('/user/image', firebaseAuth, uploadImage);
app.post('/user', firebaseAuth, addUserDetails);
app.get('/user', firebaseAuth, getAuthenticatedUser);

exports.api = functions.region('europe-west1').https.onRequest(app);
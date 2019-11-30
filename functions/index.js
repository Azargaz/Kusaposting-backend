const functions = require("firebase-functions");

const app = require('express')();

const firebaseAuth = require('./util/firebaseAuth');

const { db } = require('./util/admin');

const { 
	getAllPosts,
	postOnePost,
	getPost, 
	commentOnPost,
	likePost,
	unlikePost,
	deletePost
} = require('./handlers/posts')
const { 
	signup, 
	login, 
	uploadImage, 
	addUserDetails, 
	getAuthenticatedUser,
	getUserDetails,
	markNotificationsRead
} = require('./handlers/users');

// Kusoposts routes
app.get('/kusoposts', getAllPosts);
app.post('/kusopost', firebaseAuth, postOnePost);
app.get('/kusopost/:kusopostId', getPost);
app.delete('/kusopost/:kusopostId', firebaseAuth, deletePost);
app.get('/kusopost/:kusopostId/like', firebaseAuth, likePost);
app.get('/kusopost/:kusopostId/unlike', firebaseAuth, unlikePost);
app.post('/kusopost/:kusopostId/comment', firebaseAuth, commentOnPost);

// Users routes
app.post('/singup', signup);
app.post('/login', login);
app.post('/user/image', firebaseAuth, uploadImage);
app.post('/user', firebaseAuth, addUserDetails);
app.get('/user', firebaseAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', firebaseAuth, markNotificationsRead);

exports.api = functions.region('europe-west1').https.onRequest(app);

exports.createNotificationOnLike = functions
	.region('europe-west1')
	.firestore.document('likes/{id}')
	.onCreate((snapshot) => {
		db.doc(`/kusoposts/${snapshot.data().kusopostId}`)
			.get()
			.then(doc => {
				if(doc.exists) {
					db.doc(`/notifications/${snapshot.id}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						type: 'like',
						read: false,
						kusopostId: doc.id
					})
				}
			})
			.then(() => {
				return;
			})
			.catch(err => {
				console.error(err);
				return;
			});
	});

exports.deleteNotificationOnUnlike = functions
	.region('europe-west1')
	.firestore.document('likes/{id}')
	.onDelete((snapshot) => {
		db.doc(`/notifications/${snapshot.id}`)
			.delete()
			.then(() => {
				return;
			})
			.catch(err => {
				console.error(err);
				return;
			})
	});

exports.createNotificationOnComment = functions
	.region('europe-west1')
	.firestore.document('comments/{id}')
	.onCreate((snapshot) => {
		db.doc(`/kusoposts/${snapshot.data().kusopostId}`)
			.get()
			.then(doc => {
				if(doc.exists) {
					db.doc(`/notifications/${snapshot.id}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						type: 'comment',
						read: false,
						kusopostId: doc.id
					})
				}
			})
			.then(() => {
				return;
			})
			.catch(err => {
				console.error(err);
				return;
			});
	});
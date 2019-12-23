const functions = require("firebase-functions");
const app = require('express')();
const firebaseAuth = require('./util/firebaseAuth');

const cors = require('cors');
app.use(cors());

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

// kusaposts routes
app.get('/kusaposts', getAllPosts);
app.post('/kusapost', firebaseAuth, postOnePost);
app.get('/kusapost/:kusapostId', getPost);
app.delete('/kusapost/:kusapostId', firebaseAuth, deletePost);
app.get('/kusapost/:kusapostId/like', firebaseAuth, likePost);
app.get('/kusapost/:kusapostId/unlike', firebaseAuth, unlikePost);
app.post('/kusapost/:kusapostId/comment', firebaseAuth, commentOnPost);

// Users routes
app.post('/signup', signup);
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
		return db.doc(`/kusaposts/${snapshot.data().kusapostId}`)
			.get()
			.then(doc => {
				if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
					db.doc(`/notifications/${snapshot.id}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						type: 'like',
						read: false,
						kusapostId: doc.id
					})
				}
			})	
			.catch(err => {
				console.error(err);
			});
	});

exports.deleteNotificationOnUnlike = functions
	.region('europe-west1')
	.firestore.document('likes/{id}')
	.onDelete((snapshot) => {
		return db.doc(`/notifications/${snapshot.id}`)
			.delete()
			.catch(err => {
				console.error(err);
				return;
			})
	});

exports.createNotificationOnComment = functions
	.region('europe-west1')
	.firestore.document('comments/{id}')
	.onCreate((snapshot) => {
		return db.doc(`/kusaposts/${snapshot.data().kusapostId}`)
			.get()
			.then(doc => {
				if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
					db.doc(`/notifications/${snapshot.id}`).set({
						createdAt: new Date().toISOString(),
						recipient: doc.data().userHandle,
						sender: snapshot.data().userHandle,
						type: 'comment',
						read: false,
						kusapostId: doc.id
					})
				}
			})
			.catch(err => {
				console.error(err);
				return;
			});
	});

exports.onUserImageChange = functions
	.region('europe-west1')
	.firestore.document('/users/{id}')
	.onUpdate((change) => {
		console.log(change.before.data());
		console.log(change.after.data());
		if(change.before.data().imageUrl !== change.after.data().imageUrl) {
			console.log('image has changed');
			const batch = db.batch();
			return db.collection('kusaposts')
				.where('userHandle', '==', change.before.data().handle)
				.get()
				.then((data) => {
					data.forEach(doc => {
						const post = db.doc(`/kusaposts/${doc.id}`);
						batch.update(post, { userImage: change.after.data().imageUrl });
					});
					return batch.commit();
				});
		} else return true;
	});

exports.onPostDelete = functions
	.region('europe-west1')
	.firestore.document('/kusaposts/{kusapostId}')
	.onDelete((snapshot, context) => {
		const kusapostId = context.params.kusapostId;
		const batch = db.batch();
		return db.collection('comments')
			.where('kusapostId', '==', kusapostId)
			.get()
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/comments/${doc.id}`));
				});
				return db.collection('likes')
					.where('kusapostId', '==', kusapostId)
					.get();
			})
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/likes/${doc.id}`));
				});
				return db.collection('notifications')
					.where('kusapostId', '==', kusapostId)
					.get();
			})
			.then(data => {
				data.forEach(doc => {
					batch.delete(db.doc(`/notifications/${doc.id}`));
				});
				return batch.commit();
			})
			.catch(err => {
				console.error(err);
			})
	});
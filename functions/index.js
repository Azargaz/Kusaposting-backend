const functions = require("firebase-functions");
const admin = require('firebase-admin');

const app = require('express')();

const config = require('./config');
admin.initializeApp();
const firebase = require('firebase');

firebase.initializeApp(config.firebase);

const db = admin.firestore();

app.get('/kusoposts', (req, res) => {
	db
		.collection('kusoposts')
		.orderBy('createdAt', 'desc')
		.get()
		.then(data => {
			let kusoposts = [];
			data.forEach(doc => {
				kusoposts.push({
					kusopostId: doc.id,
					body: doc.data().body,
					userHandle: doc.data().userHandle,
					createdAt: doc.data().createdAt
				});
			});
			return res.json(kusoposts);
		})
		.catch(err => console.error(err));
});

app.post('/kusopost', (req, res) => {
	const newPost = {
		body: req.body.body,
		userHandle: req.body.userHandle,
		createdAt: new Date().toISOString()
	};

	db
		.collection('kusoposts')
		.add(newPost)
		.then(doc => {
			res.json({ message: `document ${doc.id} created successfully` })
		})
		.catch(err => {
			res.status(500).json({ error: 'something went wrong' });
			console.error(err);
		})
});

const isEmpty = (string) => {
	if(string.trim() === '') return true;
	else return false;
};

const isEmail = (email) => {
	const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if(email.match(regEx)) return true;
	else return false;
};

// Signup route
app.post('/singup', (req, res) => {
	const newUser =	{
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle
	};

	let errors = {};

	if(isEmpty(newUser.email)) {
		errors.email = 'must not by empty';
	} else if(!isEmail(newUser.email)) {
		errors.email = 'must be a valid email address';
	}

	if(isEmpty(newUser.password)) errors.password = 'must not be empty';
	if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'passwords must match';
	if(isEmpty(newUser.handle)) errors.handle = 'must not be empty';

	if(Object.keys(errors).length > 0) return res.status(400).json(errors);

	let token, userId;
	db.doc(`/users/${newUser.handle}`).get()
		.then(doc => {
			if(doc.exists){
				return res.status(400).json({ handle: 'this handle is already taken' });
			} else {
				return firebase
					.auth()
					.createUserWithEmailAndPassword(newUser.email, newUser.password);
			}
		})
		.then(data => {
			userId = data.user.uid;
			return data.user.getIdToken();
		})
		.then(idToken => {
			token = idToken;
			const userCredentials = {
				handle: newUser.handle,
				email: newUser.email,
				createdAt: new Date().toISOString(),
				userId
			};
			return db.doc(`/users/${newUser.handle}`).set(userCredentials);
		})
		.then(() => {
			return res.status(201).json({ token });
		})
		.catch(err => {
			console.error(err);
			if(err.code === 'auth/email-already-in-use'){
				return res.status(400).json({ email: 'email is already in use' })
			} else {
				return res.status(500).json({ error: err.code });
			}			
		});
});

app.post('/login', (req, res) => {
	const user = {
		email: req.body.email,
		password: req.body.password
	};

	let errors = {};

	if(isEmpty(user.email)) errors.email = 'must not be empty';
	if(isEmpty(user.password)) errors.password = 'must not be empty';

	if(Object.keys(errors).length > 0) return res.status(400).json(errors);

	firebase.auth().signInWithEmailAndPassword(user.email, user.password)
		.then(data => {
			return data.user.getIdToken();
		})
		.then(token => {
			return res.json({ token });
		})
		.catch(err => {
			console.error(err);
			if(err.code === 'auth/wrong-password') {
				return res.status(403).json({ general: 'wrong credentials, please try again' });
			} else 
				return res.status(500).json({ error: err.code });
		});
});

exports.api = functions.region('europe-west1').https.onRequest(app);
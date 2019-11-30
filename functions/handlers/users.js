const { admin, db } = require('../util/admin');

const config = require('../config');

const firebase = require('firebase');
firebase.initializeApp(config.firebase);

const { validateSignupData, validateLoginData, reduceUserDetails } = require('../util/validators');

exports.signup = (req, res) => {
	const newUser =	{
		email: req.body.email,
		password: req.body.password,
		confirmPassword: req.body.confirmPassword,
		handle: req.body.handle
	};	

    const { valid, errors } = validateSignupData(newUser);

    if(!valid) return res.status(400).json(errors);

	const noImg = 'no-img.png';

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
				imageUrl: `https://firebasestorage.googleapis.com/v0/b/${
					config.firebase.storageBucket
				}/o/${noImg}?alt=media`,
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
};

exports.login = (req, res) => {
	const user = {
		email: req.body.email,
		password: req.body.password
	};

    const { valid, errors } = validateLoginData(user);

    if(!valid) return res.status(400).json(errors);

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
};

exports.addUserDetails = (req, res) => {
	let userDetails = reduceUserDetails(req.body);

	db.doc(`/users/${req.user.handle}`).update(userDetails)
		.then(() => {
			return res.json({ message: 'user details added successfully' });
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

exports.getUserDetails = (req, res) => {
	let userData = {};
	db.doc(`/users/${req.params.handle}`)
		.get()
		.then(doc => {
			if(doc.exists) {
				userData.user = doc.data();
				return db.collection('kusoposts')
					.where('userHandle', '==', req.params.handle)
					.orderBy('createdAt', 'desc')
					.get();
			} else {
				return res.status(404).json({ error: 'user not found' });
			}
		})
		.then(data => {
			userData.kusoposts = [];
			data.forEach(doc => {
				userData.kusoposts.push({
					body: doc.data().body,
					createdAt: doc.data().createdAt,
					userHandle: doc.data().userHandle,
					userImage: doc.data().userImage,
					likeCount: doc.data().likeCount,
					commentCount: doc.data().commentCount,
					kusopostId: doc.id
				});
			});
			return res.json(userData);
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

exports.getAuthenticatedUser = (req, res) => {
	let userData = {};

	db.doc(`/users/${req.user.handle}`).get()
		.then(doc => {
			if(doc.exists) {
				userData.credentials = doc.data();
				return db.collection('likes').where('userHandle', '==', req.user.handle).get();
			}
		})
		.then(data => {
			userData.likes = [];
			data.forEach(doc => {
				userData.likes.push(doc.data());
			});
			return db.collection('notifications')
				.where('recipient', '==', req.user.handle)
				.orderBy('createdAt', 'desc')
				.limit(10)
				.get();
		})
		.then(data => {
			userData.notifications = [];
			data.forEach(doc => {
				userData.notifications.push({
					recipient: doc.data().recipient,
					sender: doc.data().sender,
					createdAt: doc.data().createdAt,
					kusopostId: doc.data().kusopostId,
					type: doc.data().type,
					read: doc.data().read,
					notificationId: doc.id
				});
			});
			return res.json(userData);
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

exports.uploadImage = (req, res) => {
	const BusBoy = require('busboy');
	const path = require('path');
	const os = require('os');
	const fs = require('fs');

	const busboy = new BusBoy({ headers: req.headers });

	let imageFileName;
	let imageToUpload = {};	

	busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
		if(mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
			return res.status(400).json({ error: 'wrong file type submitted' });
		}

		// console.log(fieldname);
		// console.log(filename);
		// console.log(mimetype);

		const imageExtension = filename.split('.')[filename.split('.').length - 1];
		imageFileName = `${Date.now()}.${imageExtension}`;
		const filepath = path.join(os.tmpdir(), imageFileName);
		imageToUpload = { filepath, mimetype };
		file.pipe(fs.createWriteStream(filepath));
	});

	busboy.on('finish', () => {
		admin.storage().bucket().upload(imageToUpload.filepath, {
			resumable: false,
			metadata: {
				metadata: {
					contentType: imageToUpload.mimetype
				}
			}
		})
		.then(() => {
			const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.firebase.storageBucket}/o/${imageFileName}?alt=media`;
			return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
		})
		.then(() => {
			return res.json({ message: 'image uploaded successfully' });
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
	});

	busboy.end(req.rawBody);
};

exports.markNotificationsRead = (req, res) => {
	let batch = db.batch();
	req.body.forEach(notificationId => {
		const notification = db.doc(`/notifications/${notificationId}`);
		batch.update(notification, { read: true });
	});
	batch.commit()
		.then(() => {
			return res.json({ message: 'notifications marked read' });
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};
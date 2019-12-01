const { db } = require('../util/admin');

exports.getAllPosts = (req, res) => {
	db
		.collection('kusaposts')
		.orderBy('createdAt', 'desc')
		.get()
		.then(data => {
			let kusaposts = [];
			data.forEach(doc => {
				kusaposts.push({
					kusapostId: doc.id,
					body: doc.data().body,
					userHandle: doc.data().userHandle,
					createdAt: doc.data().createdAt,
					commentCount: doc.data().commentCount,
					likeCount: doc.data().likeCount,
					userImage: doc.data().userImage
				});
			});
			return res.json(kusaposts);
		})
		.catch(err => console.error(err));
};

exports.postOnePost = (req, res) => {
	const newPost = {
		body: req.body.body,
		userHandle: req.user.handle,
		userImage: req.user.imageUrl,
		createdAt: new Date().toISOString(),
		likeCount: 0,
		commentCount: 0
	};

	db
		.collection('kusaposts')
		.add(newPost)
		.then(doc => {
			const resPost = newPost;
			resPost.kusapostId = doc.id;
			res.json(resPost);
		})
		.catch(err => {
			res.status(500).json({ error: 'something went wrong' });
			console.error(err);
		})
};

exports.getPost = (req, res) => {
	let postData = {};

	db.doc(`/kusaposts/${req.params.kusapostId}`)
		.get()
		.then(doc => {
			if(!doc.exists) {
				return res.status(404).json({ error: 'kusapost not found' });
			}

			postData = doc.data();
			postData.kusapostId = doc.id;
			return db
				.collection('comments')
				.orderBy('createdAt', 'desc')
				.where('kusapostId', '==', req.params.kusapostId)
				.get();
		})
		.then(data => {
			postData.comments = [];
			data.forEach(doc => {
				postData.comments.push(doc.data());
			});
			return res.json(postData);
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
};

exports.commentOnPost = (req, res) => {
	if(req.body.body.trim() === '') 
		return res.status(400).json({ comment: 'must not be empty' });

	const newComment = {
		body: req.body.body,
		createdAt: new Date().toISOString(),
		kusapostId: req.params.kusapostId,
		userHandle: req.user.handle,
		userImage: req.user.imageUrl
	};

	db.doc(`/kusaposts/${req.params.kusapostId}`)
		.get()
		.then(doc => {
			if(!doc.exists) {
				return res.status(404).json({ error: 'kusapost not found' });
			}
			return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
		})
		.then(() => {
			return db.collection('comments').add(newComment);
		})
		.then(() => {
			res.json(newComment);
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ error: 'something went wrong' });
		});
};

exports.likePost = (req, res) => {
	const likeDocument = db.collection('likes')
		.where('userHandle', '==', req.user.handle)
		.where('kusapostId', '==', req.params.kusapostId)
		.limit(1);

	const postDocument = db.doc(`/kusaposts/${req.params.kusapostId}`);

	let postData;

	postDocument.get()
		.then(doc => {
			if(doc.exists) {
				postData = doc.data();
				postData.kusapostId = doc.id;
				return likeDocument.get();
			} else {
				return res.status(404).json({ error: 'kusapost not found' });
			}
		})
		.then(data => {
			if(data.empty) {
				return db.collection('likes')
					.add({
						kusapostId: req.params.kusapostId,
						userHandle: req.user.handle
					})
					.then(() => {
						postData.likeCount++;
						return postDocument.update({ likeCount: postData.likeCount });
					})
					.then(() => {
						return res.json(postData);
					})
			} else {
				return res.status(400).json({ error: 'kusapost already liked' });
			}
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

exports.unlikePost = (req, res) => {
	const likeDocument = db.collection('likes')
		.where('userHandle', '==', req.user.handle)
		.where('kusapostId', '==', req.params.kusapostId)
		.limit(1);

	const postDocument = db.doc(`/kusaposts/${req.params.kusapostId}`);

	let postData;

	postDocument.get()
		.then(doc => {
			if(doc.exists) {
				postData = doc.data();
				postData.kusapostId = doc.id;
				return likeDocument.get();
			} else {
				return res.status(404).json({ error: 'kusapost not found' });
			}
		})
		.then(data => {
			if(data.empty) {
				return res.status(400).json({ error: 'kusapost not liked' });
				
			} else {
				return db
					.doc(`/likes/${data.docs[0].id}`)
					.delete()
					.then(() => {
						postData.likeCount--;
						return postDocument.update({ likeCount: postData.likeCount });
					})
					.then(() => {
						res.json(postData);
					});
			}
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({ error: err.code });
		});
};

exports.deletePost = (req, res) => {
	const document = db.doc(`/kusaposts/${req.params.kusapostId}`);
	document.get()
		.then(doc => {
			if(!doc.exists) {
				return res.status(404).json({ error: 'kusapost not found' });
			}
			if(doc.data().userHandle !== req.user.handle) {
				return res.status(403).json({ error: 'unauthorized' });
			} else {
				return document.delete();
			}
		})
		.then(() => {
			res.json({ message: 'kusapost deleted successfully' });
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		})
};
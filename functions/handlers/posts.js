const { db } = require('../util/admin');

exports.getAllPosts = (req, res) => {
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
};

exports.postOnePost = (req, res) => {
	const newPost = {
		body: req.body.body,
		userHandle: req.user.handle,
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
};

exports.getPost = (req, res) => {
	let postData = {};

	db.doc(`/kusoposts/${req.params.kusopostId}`)
		.get()
		.then(doc => {
			if(!doc.exists) {
				return res.status(404).json({ error: 'kusopost not found' });
			}

			postData = doc.data();
			postData.kusopostId = doc.id;
			return db
				.collection('comments')
				.orderBy('createdAt', 'desc')
				.where('kusopostId', '==', req.params.kusopostId)
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
	if(req.body.body.trim() === '') return res.status(400).json({ error: 'must not be empty' });

	const newComment = {
		body: req.body.body,
		createdAt: new Date().toISOString(),
		kusopostId: req.params.kusopostId,
		userHandle: req.user.handle,
		userImage: req.user.imageUrl
	};

	db.doc(`/kusoposts/${req.params.kusopostId}`)
		.get()
		.then(doc => {
			if(!doc.exists) {
				return res.status(404).json({ error: 'Kusopost not found' });
			}
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
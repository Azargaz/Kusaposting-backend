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
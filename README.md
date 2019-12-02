# Kusapoting-backend

Cloud functions for Firebase for Kusaposting - a social media webapp.
Frontend for this project can be found [here](https://github.com/Azargaz/Kusaposting-client).

API for this project allows for:
- signup and login as a user,
- create and browse posts created by users,
- like/unlike and comment on posts.
- add and get user details,
- upload profile image for user,
- delete posts/comments.

### Technologies

This project was created in order to learn Google's Firebase and how to create fullstack serverless React app.
Technologies used:
- [Google's Firebase](https://firebase.google.com/) including Cloud Functions, Database, Storage and Authentication,
- [Express js](https://expressjs.com/) for the cloud functions,
- [Postman](https://www.getpostman.com/) for testing the cloud functions.

### Running

If you want to serve/deploy using your Firebase project you will need to do some setting up.
First initialize your Firebase project in the directory and install all dependencies with `npm install`.
Then go to `functions` and create `config` directory in which you need to create `index.js` file and
inside put this export:

```
module.exports = {
	firebase: {
		apiKey: "YOUR_API_KEY",
		authDomain: "YOUR_AUTH_DOMAIN",
		databaseURL: "YOUR_DATABASE_URL",
		projectId: "YOUR_PROJECT_ID",
		storageBucket: "YOUR_STORAGE_BUCKET",
		messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
		appId: "YOUR_APP_ID"
	},
	serviceAccount: {
		type: "service_account",
		project_id: "YOUR_PROJECT_ID",
		private_key_id: "YOUR_PRIVATE_KEY_ID",
		private_key: "YOUR_PRIVATE_KEY",
		client_email: "YOUR_CLIENT_EMAIL",
		client_id: "YOUR_CLIENT_ID",
		auth_uri: "YOUR_AUTH_URI",
		token_uri: "YOUR_TOKEN_URI",
		auth_provider_x509_cert_url: "YOUR_AUTH_PROVIDER_CERT_URL",
		client_x509_cert_url: "YOUR_CLIENT_CERT_URL"
	}
}
```

And replace all strings starting with YOUR with your own config which you can find inside your Firebase Project's console here: 
https://console.firebase.google.com/u/0/project/YOUR_PROJECT_ID/overview (replace YOUR_PROJECT_ID with your own). 
You will need to create web application and copy config of that to `firebase` property and generate private key 
in settings and copy the data to `serviceAccount` property.

Then use either of these commands:

- `firebase serve` to run functions on your machine.
- `firebase deploy` to deploy functions to cloud.

### Credits

- [Full Stack React & Firebase Tutorial](https://youtu.be/m_u6P5k0vP0) by [Classed](https://github.com/hidjou)

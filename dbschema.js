let db = {
    users: [
        {
            userId: 'ifeiaufuwai5425429',
            email: 'user@email.com',
            handle: 'user',
            createdAt: '2019-11-29T00:00:00.000Z',
            imageUrl: 'image/dfsdgfgsdgd/gfdgfdsgfd',
            bio: 'Hello world!',
            website: 'https://user.com',
            location: 'Kyoto, Japan'
        }
    ],
    kusaposts: [
        {
            userHandle: 'user',
            body: 'this is the kusapost body',
            createdAt: '2019-11-28T15:00:22.220Z',
            likeCount: 5,
            commentCount: 2
        }
    ],
    comments: [
        {
            userHandle: 'user',
            kusapostId: 'fdkjgaoigherjorwe',
            body: 'nice',
            createdAt: '2019-11-28T15:00:22.220Z'
        }
    ],
    notifications: [
      {
        recipient: 'user',
        sender: 'john',
        read: 'true | false',
        kusapostId: 'kdjsfgdksuufhgkdsufky',
        type: 'like | comment',
        createdAt: '2019-03-15T10:59:52.798Z'
      }
    ]
}

const userDetails = {
    // Redux data
    credentials: {
        userId: 'ifeiaufuwai5425429',
        email: 'user@email.com',
        handle: 'user',
        createdAt: '2019-11-29T00:00:00.000Z',
        imageUrl: 'image/dfsdgfgsdgd/gfdgfdsgfd',
        bio: 'Hello world!',
        website: 'https://user.com',
        location: 'Kyoto, Japan'
    },
    likes: [
        {
            userHandle: 'user',
            screamId: 'hh7O5oWfWucVzGbHH2pa'
        },
        {
            userHandle: 'user',
            screamId: '3IOnFoQexRcofs5OhBXO'
        }
    ]
  };
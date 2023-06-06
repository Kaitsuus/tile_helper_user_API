const initialUsers = [
    {
      email: 'test@mail.fi',
      password: 'password123'
    },
    {
      email: 'username',
      password: 'password'
    }
  ];
  
  const testUserCredentials = [
    {
      email: initialUsers[0].email,
      password: initialUsers[0].password
    },
    {
      email: initialUsers[1].email,
      password: initialUsers[1].password
    }
  ];
  
  const initialLists = [
    {
      title: 'test-list',
      
    },
    {
      title: 'other-test-list',
    }
  ];
  
  const listWithoutLists = [];
  
  const listWithOneList = [
    {
      title: 'one-test-list',
    }
  ];
  
  const listWithManyLists = [
    {
      title: 'test-list-one'
    },
    {
      title: 'test-list-two'
    },
    {
      title: 'test-list-tree'
    },
    {
      title: 'test-list-four'
    },
    {
      title: 'test-list-five'
    },
    {
      title: 'test-list-one six'
    }
  ];
  
  module.exports = {
    initialLists,
    listWithoutLists,
    listWithOneList,
    listWithManyLists,
    initialUsers,
    testUserCredentials
  };
  
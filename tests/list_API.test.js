const bcrypt = require('bcryptjs');
const supertest = require('supertest');
const testHelper = require('./test_helper');
const jwt = require('jsonwebtoken');
const testMaterials = require('./test_materials');
const app = require('../app');
const api = supertest(app);
const User = require('../models/userModel');
const List = require('../models/listModel');
const mongoose = require('mongoose');
const config = require('../utils/config');
jest.setTimeout(30000);

var testToken;
var unvalidTestToken;

beforeAll(async () => {
  await mongoose.connect(config.TEST_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });
});

beforeEach(async () => {
  await User.deleteMany({});
  await List.deleteMany({});

  const passwordHash = await bcrypt.hash(testMaterials.users[0].password, 10);
  const user = new User({
    email: testMaterials.users[0].email,
    passwordHash,
  });

  await user.save();

  const userForToken = {
    email: user.email,
    id: user._id,
  };

  testToken = jwt.sign(userForToken, process.env.SECRET);
  unvalidTestToken = jwt.sign(userForToken, 'wrong-secret');
});

describe('LIST CREATION:', () => {
  test('a list can be created with a valid token', async () => {
    const newList = testMaterials.lists[0];
    const userId = testMaterials.users[0]._id;

    await api
      .post(`/api/users/${userId}/lists`)
      .set('Authorization', `bearer ${testToken}`)
      .send(newList)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const listsAtEnd = await testHelper.listsInDb();
    expect(listsAtEnd).toHaveLength(1);
  });

  test('all lists are returned', async () => {
    const userId = testMaterials.users[0]._id;

    // Create two lists for the user
    for (const list of testMaterials.lists) {
      await api
        .post(`/api/users/${userId}/lists`)
        .set('Authorization', `bearer ${testToken}`)
        .send(list);
    }

    const response = await api
      .get(`/api/users/${userId}/lists`)
      .set('Authorization', `bearer ${testToken}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body).toHaveLength(2);
  });
});
describe('LIST DELETION:', () => {
  test('a list can be deleted with a valid token', async () => {
    // Create a list
    const newList = testMaterials.lists[0];
    const userId = testMaterials.users[0]._id;

    const createdList = await api
      .post(`/api/users/${userId}/lists`)
      .set('Authorization', `bearer ${testToken}`)
      .send(newList)
      .expect(201);
    // console.log('Created list:', createdList.body);

    // Delete the list
    const deleteEndpoint = `/api/users/${userId}/lists/${createdList.body.id}`;
    // console.log('Delete endpoint:', deleteEndpoint);
    // console.log('Test token:', testToken);
    // console.log(`ListId: ${createdList.body.id}`);

    await api
      .delete(deleteEndpoint)
      .set('Authorization', `bearer ${testToken}`)
      .expect(204);

    // Check if the list is deleted
    const listsAtEnd = await testHelper.listsInDb();
    expect(listsAtEnd).toHaveLength(0);
  });
});
describe('LIST UPDATING:', () => {
  test('a list can be updated', async () => {
    // Create a list for the user
    const newList = testMaterials.lists[0];
    const userId = testMaterials.users[0]._id;

    const createdList = await api
      .post(`/api/users/${userId}/lists`)
      .set('Authorization', `bearer ${testToken}`)
      .send(newList)
      .expect(201);

    const updateEndpoint = `/api/users/${userId}/lists/${createdList.body.id}`;

    const updatedList = { ...newList, title: 'Updated List' };

    const response = await api
      .put(updateEndpoint)
      .set('Authorization', `bearer ${testToken}`)
      .send(updatedList)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body.name).toEqual(updatedList.name);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

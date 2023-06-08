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

  // Save the lists in the testMaterials to the database
  for (const list of testMaterials.lists) {
    const newList = new List({ ...list, user: user._id });
    await newList.save();
  }
});

describe('LIST CREATION:', () => {
  test('a list can be created with a valid token', async () => {
    const newList = testMaterials.lists[0];

    const response = await api
      .post(`/api/lists`)
      .set('Authorization', `bearer ${testToken}`)
      .send(newList)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const listsAtEnd = await testHelper.listsInDb();
    expect(listsAtEnd).toHaveLength(3);
  });
});

describe('LIST RETRIEVAL:', () => {
  test('all lists are returned', async () => {
    const response = await api
      .get(`/api/lists`)
      .set('Authorization', `bearer ${testToken}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body).toHaveLength(2);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});

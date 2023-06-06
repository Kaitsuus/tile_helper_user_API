const bcrypt = require('bcryptjs');
const supertest = require('supertest');
const testHelper = require('./test_helper');
const app = require('../app');
const api = supertest(app);
const User = require('../models/userModel');
const mongoose = require('mongoose');
const config = require('../utils/config');

beforeAll(async () => {
  await mongoose.connect(config.TEST_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
  });
});

jest.setTimeout(30000);
beforeEach(async () => {
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('sekret', 10);

  const user = new User({
    email: 'username',
    passwordHash
  });

  await user.save();
}, 30000);

describe('USER CREATION: USERNAME TESTS', () => {
  test('user creation succeeds with a fresh email', async () => {
    const usersAtStart = await testHelper.usersInDb();

    const newUser = {
      email: 'test-username',
      password: 'very-secret-123'
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await testHelper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

    const emails = usersAtEnd.map((u) => u.email);
    expect(emails).toContain(newUser.email);
  }, 30000);
});

afterAll(async () => {
  await mongoose.connection.close();
});
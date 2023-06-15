const bcrypt = require('bcryptjs');
const supertest = require('supertest');
const testHelper = require('./test_helper');
const app = require('../app');
const api = supertest(app);
const User = require('../models/userModel');

jest.setTimeout(30000);

beforeEach(async () => {
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('sekret', 10);

  const user = new User({
    email: 'username@mail.com',
    passwordHash,
  });

  await user.save();
}, 30000);

describe('USER CREATION: USERNAME TESTS', () => {
  test('user creation succeeds with a fresh email', async () => {
    const usersAtStart = await testHelper.usersInDb();

    const newUser = {
      email: 'testuser@mail.fi',
      password: 'very-secret-123',
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
  });

  test('user creation fails if email is already taken', async () => {
    const usersAtStart = await testHelper.usersInDb();

    const newUser = {
      email: 'username@mail.com',
      password: 'password123',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const validationErrorMessage = 'Email must be unique';
    expect(result.body.error).toContain(validationErrorMessage);

    const usersAtEnd = await testHelper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });

  test('user creation fails if email is not valid', async () => {
    const usersAtStart = await testHelper.usersInDb();

    const newUser = {
      email: 'testmail.com',
      password: 'password123',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const validationErrorMessage = 'Invalid email format';
    expect(result.body.error).toContain(validationErrorMessage);

    const usersAtEnd = await testHelper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });
});
describe('USER CREATION: PASSWORD TESTS', () => {
  test('user creation fails if password is too short', async () => {
    const usersAtStart = await testHelper.usersInDb();

    const newUser = {
      email: 'test@example.com',
      password: 'pw',
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain(
      'Password must be at least 7 characters long'
    );

    const usersAtEnd = await testHelper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);
  });
});

describe('USER UPDATE', () => {
  let token;

  beforeEach(async () => {
    const response = await api.post('/api/login').send({
      email: 'username@mail.com',
      password: 'sekret',
    });
    token = response.body.token;
  });
  test('update languagePreference and password with valid token', async () => {
    const usersAtStart = await testHelper.usersInDb();
    const userToUpdate = usersAtStart[0];

    const updatedData = {
      password: 'testpassword123',
      languagePreference: 'en',
    };

    const response = await api
      .put(`/api/users/${userToUpdate.id}`)
      .set('Authorization', `bearer ${token}`)
      .send(updatedData)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const updatedUser = await User.findById(userToUpdate.id);
    expect(updatedUser.languagePreference).toBe(updatedData.languagePreference);

    const passwordCorrect = await bcrypt.compare(
      updatedData.password,
      updatedUser.passwordHash
    );
    expect(passwordCorrect).toBe(true);
  });

  test('update fails if token is not valid', async () => {
    const usersAtStart = await testHelper.usersInDb();
    const userToUpdate = usersAtStart[0];

    const updatedData = {
      password: 'testpassword123',
      languagePreference: 'en',
    };

    const invalidToken = 'invalidToken';

    await api
      .put(`/api/users/${userToUpdate.id}`)
      .set('Authorization', `Bearer ${invalidToken}`)
      .send(updatedData)
      .expect(401)
      .expect('Content-Type', /application\/json/);
  });
});

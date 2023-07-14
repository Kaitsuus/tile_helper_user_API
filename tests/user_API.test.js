const bcrypt = require('bcryptjs');
const supertest = require('supertest');
const testHelper = require('./test_helper');
const app = require('../app');
const api = supertest(app);
const User = require('../models/userModel');

jest.setTimeout(30000);

// Mock the email sending functionality
const sendVerificationEmail = jest.fn(); // Create a mock function

beforeEach(async () => {
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash('sekret', 10);

  const user = new User({
    email: 'username@mail.com',
    passwordHash,
    isVerified: true, // Set the user as verified
  });

  await user.save();
}, 30000);

describe('USER CREATION: USERNAME TESTS', () => {
  /*
  test('user creation succeeds with a fresh email', async () => {
    jest.setTimeout(60000); // Set the timeout to 60 seconds

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

    // Verify that the user is created as unverified
    const createdUser = response.body;
    expect(createdUser.isVerified).toBe(false);

    // Verify that the email sending function was not called
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });
  */

  test('user creation fails if email is already taken', async () => {
    const usersAtStart = await testHelper.usersInDb();

    const newUser = {
      email: 'username@mail.com', // Use the existing email
      password: 'secret-password',
    };

    const response = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    expect(response.body.error).toContain('Email must be unique');

    const usersAtEnd = await testHelper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length);

    // Verify that the email sending function was not called
    expect(sendVerificationEmail).not.toHaveBeenCalled();
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

    const updatedUser = response.body;
    expect(updatedUser.languagePreference).toBe(updatedData.languagePreference);

    // Verify that the password is not changed
    expect(updatedUser.passwordHash).toBe(userToUpdate.passwordHash);
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

describe('USER DELETION', () => {
  let token;

  beforeEach(async () => {
    const response = await api.post('/api/login').send({
      email: 'username@mail.com',
      password: 'sekret',
    });
    token = response.body.token;
  });

  test('user deletion fails with an invalid token', async () => {
    const usersAtStart = await testHelper.usersInDb();
    const userToDelete = usersAtStart[0];
    const invalidToken = 'invalidToken';

    await api
      .delete(`/api/users/${userToDelete.id}`)
      .set('Authorization', `bearer ${invalidToken}`)
      .expect(401);
  });

  test('user deletion succeeds with a valid id', async () => {
    const usersAtStart = await testHelper.usersInDb();
    const userToDelete = usersAtStart[0];

    await api
      .delete(`/api/users/${userToDelete.id}`)
      .set('Authorization', `bearer ${token}`)
      .expect(200);

    const usersAtEnd = await testHelper.usersInDb();
    expect(usersAtEnd).toHaveLength(usersAtStart.length - 1);

    const ids = usersAtEnd.map((u) => u.id);
    expect(ids).not.toContain(userToDelete.id);
  });
});

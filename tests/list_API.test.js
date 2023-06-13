const bcrypt = require('bcryptjs');
const supertest = require('supertest');
const testHelper = require('./test_helper');
const jwt = require('jsonwebtoken');
const testMaterials = require('./test_materials');
const app = require('../app');
const api = supertest(app);
const User = require('../models/userModel');
const List = require('../models/listModel');
jest.setTimeout(30000);

var testToken;
var unvalidTestToken;


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

describe('LIST DELETION:', () => {
  test('a list can be deleted with a valid token', async () => {
    // Create a list
    const newList = testMaterials.lists[0];

    const createdList = await api
      .post(`/api/lists`)
      .set('Authorization', `bearer ${testToken}`)
      .send(newList)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    // Delete the list
    const deleteEndpoint = `/api/lists/${createdList.body.id}`;
    await api
      .delete(deleteEndpoint)
      .set('Authorization', `bearer ${testToken}`)
      .expect(204);

    // Check if the list is deleted
    const listsAtEnd = await testHelper.listsInDb();
    expect(listsAtEnd).toHaveLength(2);
  });
});

describe('LIST UPDATING:', () => {
  test('a list can be updated', async () => {
    // Create a list
    const newList = testMaterials.lists[0];

    const createdList = await api
      .post(`/api/lists`)
      .set('Authorization', `bearer ${testToken}`)
      .send(newList)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const updateEndpoint = `/api/lists/${createdList.body.id}`;

    const updatedList = { ...newList, title: 'Updated List' };

    const response = await api
      .put(updateEndpoint)
      .set('Authorization', `bearer ${testToken}`)
      .send(updatedList)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    expect(response.body.title).toEqual(updatedList.title);
  });
});

describe('ITEM CREATION:', () => {
  test('an item can be added to a list with a valid token', async () => {
    // Create a list
    const newList = testMaterials.lists[0];

    const createdList = await api
      .post(`/api/lists`)
      .set('Authorization', `bearer ${testToken}`)
      .send(newList)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    // Add an item to the list
    const newItem = { content: 'Test Item' };
    const listId = createdList.body.id;
    const itemEndpoint = `/api/lists/${createdList.body.id}/items`;

    await api
      .post(itemEndpoint)
      .set('Authorization', `bearer ${testToken}`)
      .send(newItem)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const updatedList = await List.findById(listId);
    expect(updatedList.items).toHaveLength(1);
    expect(updatedList.items[0].content).toEqual(newItem.content);
  });
});

describe('ITEM DELETION:', () => {
  test('an item can be deleted from a list with a valid token', async () => {
    // Create a list
    const newList = testMaterials.lists[1];

    const createdList = await api
      .post(`/api/lists`)
      .set('Authorization', `bearer ${testToken}`)
      .send(newList)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    // Delete the item
    const itemEndpoint = `/api/lists/${createdList.body.id}/items/${createdList.body.items[0]._id}`;
    await api
      .delete(itemEndpoint)
      .set('Authorization', `bearer ${testToken}`)
      .expect(204);

    // Check if the item is deleted
    const updatedList = await List.findById(createdList.body.id);
    expect(updatedList.items).toHaveLength(0);
  });
});

describe('ITEM UPDATING:', () => {
  test('an item can be updated with a valid token', async () => {
    // Create a list with an item
    const newList = testMaterials.lists[1];

    const createdList = await api
      .post(`/api/lists`)
      .set('Authorization', `bearer ${testToken}`)
      .send(newList)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    // Update the item content
    const updatedItemContent = 'Updated Item Content';
    const itemEndpoint = `/api/lists/${createdList.body.id}/items/${createdList.body.items[0]._id}`;

    await api
      .put(itemEndpoint)
      .set('Authorization', `bearer ${testToken}`)
      .send({ content: updatedItemContent })
      .expect(200)
      .expect('Content-Type', /application\/json/);

    // Check if the item content has been updated
    const updatedList = await List.findById(createdList.body.id);
    expect(updatedList.items[0].content).toEqual(updatedItemContent);
  });
});

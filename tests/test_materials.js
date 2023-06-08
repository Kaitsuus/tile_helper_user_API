const mongoose = require('mongoose');

const users = [
  {
    email: 'user1@example.com',
    password: 'password1',
  },
  {
    email: 'user2@example.com',
    password: 'password2',
  },
];

const lists = [
  {
    title: 'List 1',
    items: [],
  },
  {
    title: 'List 2',
    items: [{ content: 'test-item' }],
  },
];

const items = [
  {
    content: 'Item 1',
  },
  {
    content: 'Item 2',
  },
];

module.exports = {
  users,
  lists,
  items,
};

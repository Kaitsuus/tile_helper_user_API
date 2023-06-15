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
    items: [{ content: { name: 'Item 1', amount: 1, unit: 'piece' } }],
  },
];

const items = [
  {
    content: { name: 'Item 1', amount: 1, unit: 'piece' },
  },
  {
    content: { name: 'Item 2', amount: 2, unit: 'piece' },
  },
];

module.exports = {
  users,
  lists,
  items,
};

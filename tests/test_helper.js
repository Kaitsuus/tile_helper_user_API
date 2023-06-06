const List = require('../models/listModel');
const User = require('../models/userModel');

const nonExistingId = async () => {
  const list = new List({
    title: 'title-soon-to-be-removed',
  });
  await list.save();
  await list.remove();

  return list._id.toString();
};

const listsInDb = async () => {
  const lists = await List.find({});
  return lists.map((list) => list.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((user) => user.toJSON());
};

module.exports = {
  nonExistingId,
  listsInDb,
  usersInDb
};

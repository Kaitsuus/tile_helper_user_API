const testingRouter = require('express').Router();
const List = require('../models/listModel');
const User = require('../models/userModel');

testingRouter.post('/reset', async (request, response) => {
  try {
    await List.deleteMany({});
    await User.deleteMany({});
    response.status(204).end();
  } catch (error) {
    console.error('Error occurred while resetting test data:', error);
    response.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = testingRouter;

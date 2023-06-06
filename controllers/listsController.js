const router = require('express').Router();
const List = require('../models/listModel');
const User = require('../models/userModel');
const { userExtractor, requireToken } = require('../utils/middleware');
router.use(userExtractor);

router.get('/', async (request, response) => {
  const lists = await List.find({})
    .populate('user', { email: 1 });

  response.json(lists);
});

router.get('/:id', async (request, response) => {
  const list = await List.findById(request.params.id)
    .populate('user', { email: 1 })
    .populate('items');

  if (list) {
    response.json(list);
  } else {
    response.status(404).end();
  }
});

router.post('/', requireToken, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const user = request.user;
  const list = new List({ ...request.body, user: user.id });

  const savedList = await list.save();

  user.lists = user.lists.concat(savedList._id);
  await user.save();

  const listToReturn = await List.findById(savedList._id).populate('user', {
    email: 1,
  });

  response.status(201).json(listToReturn);
});

router.delete('/:id',requireToken, async (request, response) => {
  const listToDelete = await List.findById(request.params.id);
  if (!listToDelete) {
    return response.status(204).end();
  }

  if (listToDelete.user && listToDelete.user.toString() !== request.user.id) {
    return response.status(401).json({
      error: 'only the creator can delete a list',
    });
  }

  const userId = listToDelete.user;

  await List.findByIdAndRemove(request.params.id);

  // Remove the list ID from the user's lists array
  await User.findByIdAndUpdate(userId, {
    $pull: { lists: request.params.id },
  });

  response.status(204).end();
});

router.put('/:id', requireToken, async (request, response) => {
  const list = request.body;

  const updatedList = await List.findByIdAndUpdate(request.params.id, list, {
    new: true,
    runValidators: true,
    context: 'query',
  }).populate('user', { email: 1 });

  response.json(updatedList);
});

module.exports = router;

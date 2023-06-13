const mongoose = require('mongoose');
const router = require('express').Router();
const List = require('../models/listModel');
const User = require('../models/userModel');
const { userExtractor, requireToken } = require('../utils/middleware');
router.use(userExtractor);

// Get all lists
router.get('/', async (request, response) => {
  const lists = await List.find({}).populate('user', { email: 1 });
  response.json(lists);
});

// Get a specific list
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

// Get items of a specific list
router.get('/:id/items', async (request, response) => {
  const list = await List.findById(request.params.id)
    .populate('user', { email: 1 })
    .populate('items');
  if (list) {
    response.json(list.items);
  } else {
    response.status(404).end();
  }
});

// Get a specific item from a specific list
router.get('/:listId/items/:itemId', async (request, response) => {
  const list = await List.findById(request.params.listId)
    .populate('user', { email: 1 })
    .populate('items');
  if (list) {
    const item = list.items.id(request.params.itemId);
    if (item) {
      response.json(item);
    } else {
      response.status(404).json({ error: 'item not found' });
    }
  } else {
    response.status(404).json({ error: 'list not found' });
  }
});

router.post('/', requireToken, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const user = request.user;
  const itemsWithIds = request.body.items.map((item) => ({
    _id: mongoose.Types.ObjectId(),
    content: item.content,
  }));

  const list = new List({
    title: request.body.title,
    user: user.id,
    items: itemsWithIds,
  });

  const savedList = await list.save();

  user.lists = user.lists.concat(savedList._id);
  await user.save();

  const listToReturn = await List.findById(savedList._id).populate('user', {
    email: 1,
  });

  response.status(201).json(listToReturn);
});

router.delete('/:id', requireToken, async (request, response) => {
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

router.post('/:listId/items', requireToken, async (request, response) => {
  if (!request.user) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const listId = request.params.listId;
  const list = await List.findById(listId);

  if (!list) {
    return response.status(404).json({ error: 'list not found' });
  }

  const newItem = {
    _id: mongoose.Types.ObjectId(),
    content: request.body.content,
  };

  list.items = list.items.concat(newItem);
  await list.save();

  response.status(201).json(newItem);
});

router.delete(
  '/:listId/items/:itemId',
  requireToken,
  async (request, response) => {
    if (!request.user) {
      return response.status(401).json({ error: 'token missing or invalid' });
    }

    const listId = request.params.listId;
    const itemId = request.params.itemId;
    const list = await List.findById(listId);

    if (!list) {
      return response.status(404).json({ error: 'list not found' });
    }

    const item = list.items.id(itemId);

    if (!item) {
      return response.status(404).json({ error: 'item not found' });
    }

    list.items.pull(itemId); // Use pull() method to remove the item from the list
    await list.save();

    response.status(204).end();
  }
);

router.put(
  '/:listId/items/:itemId',
  requireToken,
  async (request, response) => {
    if (!request.user) {
      return response.status(401).json({ error: 'token missing or invalid' });
    }

    const listId = request.params.listId;
    const itemId = request.params.itemId;
    const list = await List.findById(listId);

    if (!list) {
      return response.status(404).json({ error: 'list not found' });
    }

    const item = list.items.id(itemId);

    if (!item) {
      return response.status(404).json({ error: 'item not found' });
    }

    item.content = request.body.content;
    await list.save();

    response.status(200).json(item);
  }
);

module.exports = router;

const router = require('express').Router();
const List = require('../models/listModel');
const ListItem = require('../models/itemModel');
const { userExtractor, requireToken } = require('../utils/middleware');
router.use(userExtractor);

router.get('/', async (request, response) => {
  const list = await List.findOne({
    _id: request.listId, 
    user: request.user._id
  }).populate('items');

  if (list) {
    response.json(list.items);
  } else {
    response.status(404).end();
  }
});

router.post('/',requireToken, async (request, response) => {
  const { item } = request.body;

  const listItem = new ListItem({
    item,
    list: request.listId
  });

  const savedListItem = await listItem.save();

  const listToUpdate = await List.findByIdAndUpdate(
    request.listId,
    { $push: { items: savedListItem._id } },
    { new: true }
  )
    .populate('items');

  response.status(201).json(listToUpdate);
});

router.delete('/:itemId',requireToken, async (request, response) => {
  const list = await List.findOne({
    _id: request.listId,
    user: request.user._id
  });

  if (!list) {
    return response.status(404).json({ error: 'List not found' });
  }

  const listItemIndex = list.items.indexOf(request.params.itemId);

  if (listItemIndex === -1) {
    return response.status(404).json({ error: 'List item not found' });
  }

  list.items.splice(listItemIndex, 1);
  await ListItem.findByIdAndRemove(request.params.itemId);
  await list.save();

  response.status(204).end();
});

router.put('/:itemId',requireToken, async (request, response) => {
  const { item } = request.body;

  const listItem = await ListItem.findOne({
    _id: request.params.itemId,
    list: request.listId
  });

  if (!listItem) {
    return response.status(404).json({ error: 'List item not found' });
  }

  listItem.item = item;
  const updatedListItem = await listItem.save();

  response.json(updatedListItem);
});


module.exports = router;

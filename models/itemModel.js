const mongoose = require('mongoose');

const listItemSchema = mongoose.Schema({
  item: { type: String, required: true },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true,
  },
});

listItemSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const ListItem = mongoose.model('ListItem', listItemSchema);

module.exports = ListItem;

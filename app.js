const config = require('./utils/config');
const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('express-async-errors');

const listsRouter = require('./controllers/listsController');
const usersRouter = require('./controllers/usersController');
const loginRouter = require('./controllers/loginController');
const itemRouter = require('./controllers/itemController');
const { errorHandler, userExtractor } = require('./utils/middleware');
const logger = require('./utils/logger');

logger.info('connecting to helperData');

mongoose
  .connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB');
  })
  .catch((error) => {
    logger.error('error connection to MongoDB:', error.message);
  });

app.use(cors());
app.use(express.static('build'));
app.use(express.json());

app.use('/api/login', loginRouter);
app.use('/api/users/:userId/lists', userExtractor, listsRouter);
app.use('/api/users/:userId/lists/:listId/items', userExtractor, itemRouter);
app.use('/api/users', usersRouter);

if (process.env.NODE_ENV === 'test') {
  const testingRouter = require('./controllers/testing');
  app.use('/api/testing', testingRouter);
}

app.use(errorHandler);

module.exports = app;

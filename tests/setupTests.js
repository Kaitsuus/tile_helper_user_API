const mongoose = require('mongoose');
const config = require('../utils/config');

beforeAll(async () => {
  await mongoose.connect(config.TEST_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
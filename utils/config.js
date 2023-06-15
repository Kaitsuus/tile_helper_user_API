require('dotenv').config();

let PORT = process.env.PORT || 3003;

const MONGODB_URI =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;
const TEST_MONGODB_URI = process.env.TEST_MONGODB_URI;
const SECRET =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_SECRET
    : process.env.SECRET;

module.exports = {
  MONGODB_URI,
  PORT,
  SECRET,
  TEST_MONGODB_URI,
};

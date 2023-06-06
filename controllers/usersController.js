const bcrypt = require('bcryptjs');
const router = require('express').Router();
const User = require('../models/userModel');
const { userExtractor, requireToken } = require('../utils/middleware');
router.use(userExtractor);

router.get('/', async (request, response) => {
  const users = await User.find({}).populate('lists', {
    title: 1,
    items: 1,
  });

  response.json(users);
});

router.get('/:id', async (request, response) => {
  const user = await User.findById(request.params.id).populate('lists', {
    title: 1,
    items: 1
  });

  if (user) {
    response.json(user);
  } else {
    response.status(404).end();
  }
});

router.post('/', requireToken, async (request, response) => {
  const { email, avatar, languagePreference, password } = request.body;

  if (!password || password.length < 3) {
    return response.status(400).json({
      error: 'invalid password'
    });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return response.status(400).json({
      error: 'email must be unique'
    });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    email,
    passwordHash,
    avatar,
    languagePreference,
    lists: []
  }); 

  const savedUser = await user.save();

  response.status(201).json(savedUser);
});

module.exports = router;

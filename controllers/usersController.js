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
    items: 1,
  });

  if (user) {
    response.json(user);
  } else {
    response.status(404).end();
  }
});

router.post('/', async (request, response) => {
  const { email, password } = request.body;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return response.status(400).json({ error: 'Invalid email format' });
  }

  // Validate password length
  if (password.length < 7) {
    return response
      .status(400)
      .json({ error: 'Password must be at least 7 characters long' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return response.status(400).json({ error: 'Email must be unique' });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    email,
    passwordHash,
    lists: [],
  });

  const savedUser = await user.save();

  response.status(201).json(savedUser);
});

router.put('/:id', requireToken, async (request, response) => {
  const { password, languagePreference } = request.body;

  if (password && password.length < 7) {
    return response
      .status(400)
      .json({ error: 'Password must be at least 7 characters long' });
  }

  if (languagePreference && !['fi', 'en'].includes(languagePreference)) {
    return response.status(400).json({ error: 'Invalid language preference' });
  }

  const userId = request.params.id;
  const user = await User.findById(userId);

  if (!user) {
    return response.status(404).json({ error: 'User not found' });
  }

  if (password) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    user.passwordHash = passwordHash;
  }

  if (languagePreference) {
    user.languagePreference = languagePreference;
  }

  const updatedUser = await user.save();
  response.json(updatedUser);
});

router.delete('/:id', requireToken, async (request, response) => {
  const userId = request.params.id;
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return response.status(404).json({ error: 'User not found' });
  }

  response.status(200).json({ message: 'User deleted successfully' });
});

module.exports = router;

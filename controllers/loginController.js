const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = require('express').Router();
const User = require('../models/userModel');

router.post('/', async (request, response) => {
  const { email, password } = request.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return response.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const passwordCorrect = await bcrypt.compare(password, user.passwordHash);

    if (!passwordCorrect) {
      return response.status(401).json({
        error: 'Invalid email or password',
      });
    }

    const userForToken = {
      email: user.email,
      id: user._id,
    };

    const token = jwt.sign(userForToken, process.env.SECRET);

    response.status(200).json({
      token,
      email: user.email,
    });
  } catch (error) {
    response.status(500).json({
      error: 'An error occurred while processing the request',
    });
  }
});

module.exports = router;

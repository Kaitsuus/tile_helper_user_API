const bcrypt = require('bcryptjs');
const router = require('express').Router();
const User = require('../models/userModel');
const { userExtractor, requireToken } = require('../utils/middleware');
const transporter = require('../utils/email'); // Import the transporter from email.js

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

  const verificationToken = generateVerificationToken(); // Generate a verification token

  const user = new User({
    email,
    passwordHash: password,
    verificationToken,
    lists: [],
  });

  const savedUser = await user.save();

  // Send verification email with the verification token
  const verificationLink = `${request.protocol}://${request.get(
    'host'
  )}/api/users/verify-email/${verificationToken}`;
  const mailOptions = {
    from: 'kai.jukarainen@kaijukarainen.com',
    to: email,
    subject: 'Email Verification',
    text: `Click the following link to verify your email: ${verificationLink}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return response
        .status(500)
        .json({ error: 'Failed to send verification email' });
    }
    console.log('Email sent: ' + info.response);
    response.status(201).json(savedUser);
  });
});

router.get('/verify-email/:token', async (request, response) => {
  const { token } = request.params;

  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    return response.status(400).json({ error: 'Invalid verification token' });
  }

  // Update the user's verification status
  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  const message = `
  <html>
    <head>
      <title>Email Verification</title>
    </head>
    <body>
      <h1>Email Verified Successfully</h1>
      <p>Your email has been successfully verified.</p>
    </body>
  </html>
`;

  response.send(message);
});

router.post('/request-verification-email', async (request, response) => {
  const { email } = request.body;

  // Find the user by email
  const user = await User.findOne({ email });
  console.log(user);

  if (!user) {
    return response.status(404).json({ error: 'User not found' });
  }

  if (user.isVerified) {
    return response.status(400).json({ error: 'Email is already verified' });
  }

  // Generate a new verification token
  const verificationToken = generateVerificationToken();
  user.verificationToken = verificationToken;
  await user.save();

  // Send the verification email with the new token
  const verificationLink = `${request.protocol}://${request.get(
    'host'
  )}/api/users/verify-email/${verificationToken}`;
  const mailOptions = {
    from: 'kai.jukarainen@kaijukarainen.com',
    to: email,
    subject: 'Email Verification',
    text: `Click the following link to verify your email: ${verificationLink}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return response
        .status(500)
        .json({ error: 'Failed to send verification email' });
    }
    console.log('Email sent: ' + info.response);
    response.json({ message: 'Verification email sent' });
  });
});

router.post('/request-new-password', async (request, response) => {
  const { email } = request.body;

  // Find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    return response.status(404).json({ error: 'User not found' });
  }

  // Generate a new token unique to the user
  const tempToken = generateToken(user.email);

  user.passwordResetToken = tempToken;
  await user.save();

  console.log(tempToken); // Verify the value of the token
  console.log(user.passwordResetToken); // Verify the stored token in the user document

  // Send a password reset email with the temp token
  const passwordResetLink = `${request.protocol}://${request.get(
    'host'
  )}/api/users/reset-password/${tempToken}`;
  const mailOptions = {
    from: 'kai.jukarainen@kaijukarainen.com',
    to: email,
    subject: 'Password Reset Request',
    text: `Click the following link to reset your password: ${passwordResetLink}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return response
        .status(500)
        .json({ error: 'Failed to send password reset email' });
    }
    console.log('Email sent: ' + info.response);
    response.json({ message: 'Password reset email sent' });
  });
});

router.get('/reset-password/:token', async (request, response) => {
  const { token } = request.params;

  try {
    const user = await User.findOne({ passwordResetToken: token });

    if (!user) {
      return response.status(400).json({ error: 'Invalid reset token' });
    }

    // Generate new password
    const newPassword = generatePassword();

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user's password
    user.passwordHash = newPassword;
    user.passwordResetToken = undefined;

    const enteredPassword = newPassword;
    const storedHashedPassword = hashedPassword;

    // Compare the entered password with the stored hashed password
    bcrypt.compare(enteredPassword, storedHashedPassword, (err, result) => {
      if (err) {
        // Handle error
        return;
      }

      if (result) {
        // Passwords match
        console.log('Passwords match');
      } else {
        // Passwords do not match
        console.log('Passwords do not match');
      }
    });

    try {
      await user.save();
    } catch (err) {
      console.log(err); // Check for validation errors
      return response
        .status(500)
        .json({ error: 'An error occurred during save' });
    }

    // Send the new password to the user via email
    const mailOptions = {
      from: 'kai.jukarainen@kaijukarainen.com',
      to: user.email,
      subject: 'Password Reset',
      text: `Your new password is: ${newPassword}. Please change it next time you log in.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return response
          .status(500)
          .json({ error: 'Failed to send password reset email' });
      }
      console.log('Email sent: ' + info.response);
      const message = `
      <html>
        <head>
          <title>RESET PASSWORD</title>
        </head>
        <body>
          <p>Password reset email sent Successfully</p>
        </body>
      </html>
    `;
      response.send(message);
    });
  } catch (err) {
    return response.status(500).json({ error: 'An error occurred' });
  }
});

router.put('/change-password', requireToken, async (request, response) => {
  const { oldPassword, newPassword } = request.body;

  // Validate new password length
  if (newPassword.length < 7) {
    return response
      .status(400)
      .json({ error: 'New password must be at least 7 characters long' });
  }

  try {
    // Find the user by their ID from the JWT token (from requireToken middleware)
    const userId = request.user.id;
    const user = await User.findById(userId);

    // Check if the old password provided matches the stored password
    const isOldPasswordValid = await bcrypt.compare(
      oldPassword,
      user.passwordHash
    );
    if (!isOldPasswordValid) {
      return response.status(400).json({ error: 'Invalid old password' });
    }

    user.passwordHash = newPassword;
    await user.save();

    response.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    return response.status(500).json({ error: 'An error occurred' });
  }
});

router.delete('/:id', requireToken, async (request, response) => {
  const userId = request.params.id;
  const user = await User.findByIdAndDelete(userId);

  if (!user) {
    return response.status(404).json({ error: 'User not found' });
  }

  response.status(200).json({ message: 'User deleted successfully' });
});

// Generate a unique verification token
function generateVerificationToken() {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const tokenLength = 32;
  let token = '';
  for (let i = 0; i < tokenLength; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
}

function generateToken(identifier) {
  const randomString = Math.random().toString(36).substring(2, 15);
  return `${identifier}-${randomString}`;
}

function generatePassword() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  console.log('this is generated pw', password);
  return password;
}

module.exports = router;

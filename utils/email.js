require('dotenv').config();
const nodemailer = require('nodemailer');
const email = process.env.EMAIL;
const password = process.env.PASSWORD;

const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: email,
    pass: password,
  },
});

module.exports = transporter;

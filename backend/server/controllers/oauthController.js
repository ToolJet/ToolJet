// oauthController.js
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User'); // your User model

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.query; // token from frontend
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({ email: payload.email, name: payload.name });
    }

    // create session or JWT
    req.session.user = user;

    res.redirect('/dashboard'); // redirect to ToolJet dashboard
  } catch (err) {
    console.error(err);
    res.status(400).send('Google login failed');
  }
};

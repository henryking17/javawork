// server.js
const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
app.use(cookieParser());
const path = require('path');
// Serve static frontend files
app.use(express.static(path.join(__dirname)));

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const JWT_SECRET = process.env.SESSION_SECRET || 'session_secret_dev';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '197636188354-2nrc48grt63t2dpj4jcs332oonrt3sor.apps.googleusercontent.com';

// Initialize payment
app.post("/initialize-payment", async (req, res) => {
  try {
    const { email, amount } = req.body;

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      { email, amount: amount * 100 }, // Paystack expects kobo
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify payment
app.get("/verify-payment/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Google ID token and create session cookie
app.post('/api/auth/google', async (req, res) => {
  try {
    const { id_token } = req.body || {};
    if (!id_token) return res.status(400).json({ error: 'id_token required' });

    const infoRes = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`);
    const info = infoRes.data;

    // debug log useful during development
    console.log('Google token info:', { aud: info.aud, email: info.email, verified: info.email_verified });

    // validate audience (handle string or array)
    const aud = info.aud;
    const audOk = aud === GOOGLE_CLIENT_ID || (Array.isArray(aud) && aud.includes(GOOGLE_CLIENT_ID));
    if (!audOk) return res.status(401).json({ error: 'Token audience mismatch', aud });

    // optional: require email verified (you can relax this if you prefer)
    if (info.email_verified === 'false' || info.email_verified === false) {
      console.warn('Google email not verified for', info.email);
      // continue but inform client
    }

    // create a small session JWT
    const payload = { sub: info.sub, email: info.email, name: info.name, picture: info.picture };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    // set cookie (httpOnly). For production, set secure: true and proper domain
    res.cookie('session', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ ok: true, user: payload });
  } catch (err) {
    console.error('Google auth error:', err.response ? err.response.data : err.message || err);
    const details = err.response && err.response.data ? (err.response.data.error_description || err.response.data.error || JSON.stringify(err.response.data)) : err.message;
    res.status(401).json({ error: 'Invalid token', details });
  }
});

// Get current session user
app.get('/api/me', (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const token = req.cookies && req.cookies.session;
    if (!token) return res.status(401).json({ error: 'No session' });
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ user: payload });
  } catch (err) {
    res.status(401).json({ error: 'Invalid session' });
  }
});

// Logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('session');
  res.json({ ok: true });
});




const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// helper for creating transfer recipients (used manually)
async function createRecipient() {
  const response = await axios.post(
    "https://api.paystack.co/transferrecipient",
    {
      type: "nuban",
      name: "cympet and co nigeria enterprises",
      account_number: "8170779071",
      bank_code: "FIDELITY BANK" // GTBank example
    },
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );

  console.log(response.data);
}


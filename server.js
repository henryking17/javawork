// server.js
const express = require("express");
const axios = require("axios");
const cors = require('cors');
require("dotenv").config();
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using service account JSON if present,
// otherwise fall back to GOOGLE_APPLICATION_CREDENTIALS or skip initialization.
try {
  // Adjust path if your service account JSON is in a different location
  const serviceAccount = require('./paystack-backend/cympet-electronics-firebase-adminsdk-fbsvc-c67e468e79.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized using service account JSON.');
} catch (e) {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // If the environment variable points to a service account file, the SDK will pick it up
    admin.initializeApp();
    console.log('Firebase Admin initialized using GOOGLE_APPLICATION_CREDENTIALS env var.');
  } else {
    console.warn('Firebase Admin not initialized: service account JSON not found and GOOGLE_APPLICATION_CREDENTIALS not set.');
  }
} 

const app = express();
app.use(express.json());
app.use(cors()); // enable CORS for dev and client pages

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// Optional SMTP transporter (configure via env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
let smtpTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  try {
    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } catch (e) {
    console.error('Failed to create SMTP transporter:', e);
    smtpTransporter = null;
  }
}

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


// Newsletter subscription endpoint (persists subscriptions to a JSON file)
const fs = require('fs').promises;
app.post('/newsletter-subscribe', async (req, res) => {
  try {
    const { email, message } = req.body || {};
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });

    const filePath = 'newsletter_subscribers.json';
    let list = [];
    try {
      const raw = await fs.readFile(filePath, 'utf8');
      list = JSON.parse(raw || '[]');
    } catch (e) {
      // file not found or invalid JSON -> start with empty list
      list = [];
    }

    list.push({ email, message: (message || '').toString(), created: new Date().toISOString() });
    await fs.writeFile(filePath, JSON.stringify(list, null, 2), 'utf8');

    // Attempt to send confirmation email if SMTP configured
    const fromAddress = process.env.NOREPLY_FROM || process.env.SMTP_USER || 'Cympet and Co <no-reply@cympet.local>';
    const subject = 'Welcome to Cympet and Co Newsletter!';
    const defaultMessage = `Hi there!\n\nThanks for subscribing to Cympet and Co. You're now signed up to receive exclusive offers, product launches and updates. Use code WELCOME10 on your next purchase.\n\nBest regards,\nCympet and Co Team`;
    const textMessage = (message && message.toString().trim()) ? message.toString().trim() : defaultMessage;
    const htmlMessage = `<p>${textMessage.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;

    if (smtpTransporter) {
      try {
        await smtpTransporter.sendMail({
          from: fromAddress,
          to: email,
          subject,
          text: textMessage,
          html: htmlMessage
        });
      } catch (mailErr) {
        console.error('SMTP send error:', mailErr);
        // non-fatal: still respond success but log the error
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Newsletter save error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Authentication: Google Sign-In integration (server-side verify + session cookie)

// Helper: read/write JSON files for users and sessions
const USERS_FILE = 'users.json';
const SESSIONS_FILE = 'sessions.json';

async function readJsonFile(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw || 'null');
  } catch (e) {
    return fallback;
  }
}

async function writeJsonFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Simple cookie parser (no extra dependency)
function parseCookies(req) {
  const header = req.headers.cookie || '';
  const pairs = header.split(';').map(p => p.trim()).filter(Boolean);
  const out = {};
  pairs.forEach(pair => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function makeSessionToken() {
  return 't_' + Date.now() + '_' + Math.random().toString(36).slice(2,10);
}

async function createSessionForUser(userId) {
  const sessions = await readJsonFile(SESSIONS_FILE, {});
  const token = makeSessionToken();
  sessions[token] = { userId: userId, created: new Date().toISOString() };
  await writeJsonFile(SESSIONS_FILE, sessions);
  return token;
}

async function getUserFromSessionToken(token) {
  if (!token) return null;
  const sessions = await readJsonFile(SESSIONS_FILE, {});
  const s = sessions[token];
  if (!s || !s.userId) return null;
  const users = await readJsonFile(USERS_FILE, []);
  return users.find(u => u.id === s.userId) || null;
}

// Public config endpoint for client-side Google Client ID (safe to expose)
app.get('/config', (req, res) => {
  res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID || '' });
});

// Verify Google ID token using Google's tokeninfo endpoint
app.post('/auth/google', async (req, res) => {
  try {
    const idToken = req.body && req.body.id_token;
    if (!idToken) return res.status(400).json({ error: 'id_token required' });

    // Verify with Google's tokeninfo endpoint
    const verifyRes = await axios.get('https://oauth2.googleapis.com/tokeninfo', { params: { id_token: idToken } });
    const payload = verifyRes.data || {};

    // Ensure the token is intended for our client
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Server not configured with GOOGLE_CLIENT_ID' });
    }
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ error: 'Invalid token audience' });
    }
    if (!payload.email_verified) {
      return res.status(400).json({ error: 'Email not verified by Google' });
    }

    const email = payload.email;
    const name = payload.name || '';
    const picture = payload.picture || '';

    // Find or create user
    let users = await readJsonFile(USERS_FILE, []);
    let user = users.find(u => u.email && u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) {
      user = {
        id: 'u_' + Date.now().toString(36),
        name: name || email.split('@')[0],
        email: email,
        picture: picture,
        provider: 'google',
        created: new Date().toISOString()
      };
      users.push(user);
      await writeJsonFile(USERS_FILE, users);
    } else {
      // update picture / name when available
      let changed = false;
      if (picture && user.picture !== picture) { user.picture = picture; changed = true; }
      if (name && user.name !== name) { user.name = name; changed = true; }
      if (changed) await writeJsonFile(USERS_FILE, users);
    }

    // Create session and set HttpOnly cookie
    const token = await createSessionForUser(user.id);
    const cookieOptions = [];
    const secure = (process.env.NODE_ENV === 'production');
    let cookieStr = `session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`;
    if (secure) cookieStr += '; Secure';
    // Set cookie via header to avoid adding cookie-parser dependency
    res.setHeader('Set-Cookie', cookieStr);

    // Return user info (excluding sensitive fields)
    return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
  } catch (e) {
    console.error('Google auth error', e && e.response ? e.response.data : e.message || e);
    return res.status(400).json({ error: 'Invalid Google token' });
  }
});

// Firebase token verification endpoint (uses firebase-admin)
// POST { idToken: string }
app.post('/auth/verify-firebase-token', async (req, res) => {
  const idToken = req.body && req.body.idToken;
  if (!idToken) return res.status(400).json({ error: 'idToken required' });
  if (!admin || !admin.auth) return res.status(500).json({ error: 'Firebase Admin not initialized on server' });
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return res.json({ success: true, decoded });
  } catch (err) {
    console.error('verify-firebase-token error', err);
    return res.status(401).json({ error: err.message || 'Invalid token' });
  }
});

// Get current user from session cookie
app.get('/auth/me', async (req, res) => {
  try {
    const cookies = parseCookies(req);
    const token = cookies.session;
    if (!token) return res.json({ user: null });
    const user = await getUserFromSessionToken(token);
    if (!user) return res.json({ user: null });
    return res.json({ user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
  } catch (e) { return res.json({ user: null }); }
});

// Logout: clear session cookie and remove session
app.post('/auth/logout', async (req, res) => {
  try {
    const cookies = parseCookies(req);
    const token = cookies.session;
    if (token) {
      const sessions = await readJsonFile(SESSIONS_FILE, {});
      if (sessions[token]) { delete sessions[token]; await writeJsonFile(SESSIONS_FILE, sessions); }
    }
    // Clear cookie
    res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax');
    return res.json({ success: true });
  } catch (e) { return res.json({ success: false }); }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


async function createRecipient() {
  const axios = require('axios');
  // Note: Use Paystack numeric bank_code (e.g., First Bank of Nigeria = "011")
  const response = await axios.post(
    "https://api.paystack.co/transferrecipient",
    {
      type: "nuban",
      name: "CYMPET ENTERPRISES CO.NIGERIA",
      account_number: "2008885373",
      bank_code: "011" // First Bank of Nigeria (Paystack bank code)
    },
    { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
  );

  console.log(response.data);
}


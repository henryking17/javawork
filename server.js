// server.js
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

// SMTP / email helper (optional - configure via env vars)
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false') === 'true';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
let mailer = null;
if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  mailer = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: SMTP_SECURE, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  mailer.verify().then(() => console.log('SMTP ready')).catch(e => console.warn('SMTP verify failed', e));
}

async function sendEmail(to, subject, text, html) {
  if (!mailer) {
    console.log('Email not sent (SMTP not configured):', { to, subject, text });
    return { simulated: true };
  }
  try {
    const info = await mailer.sendMail({ from: SMTP_FROM, to, subject, text, html });
    return { success: true, info };
  } catch (err) {
    console.error('sendEmail error', err);
    return { success: false, error: String(err && err.message ? err.message : err) };
  }
} 

const app = express();
app.use(cors());
app.use(express.json());

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// receipts storage file
const RECEIPTS_FILE = path.join(__dirname, 'receipts.json');
function readReceipts() {
  try {
    if (!fs.existsSync(RECEIPTS_FILE)) return [];
    const raw = fs.readFileSync(RECEIPTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) { return []; }
}
function writeReceipts(receipts) {
  try { fs.writeFileSync(RECEIPTS_FILE, JSON.stringify(receipts, null, 2), 'utf8'); } catch (e) { console.error('writeReceipts error', e); }
}

// users storage file (simple JSON for demo)
const USERS_FILE = path.join(__dirname, 'users.json');
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) { return []; }
}
function writeUsers(users) {
  try { fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8'); } catch (e) { console.error('writeUsers error', e); }
}

// Access requests storage (users can request access to receipts they don't own)
const ACCESS_REQUESTS_FILE = path.join(__dirname, 'access_requests.json');
function readAccessRequests() {
  try {
    if (!fs.existsSync(ACCESS_REQUESTS_FILE)) return [];
    const raw = fs.readFileSync(ACCESS_REQUESTS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) { return []; }
}
function writeAccessRequests(arr) {
  try { fs.writeFileSync(ACCESS_REQUESTS_FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch (e) { console.error('writeAccessRequests error', e); }
}

// Notifications storage (in-app notifications for users)
const NOTIFICATIONS_FILE = path.join(__dirname, 'notifications.json');
function readNotifications() {
  try {
    if (!fs.existsSync(NOTIFICATIONS_FILE)) return [];
    const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) { return []; }
}
function writeNotifications(arr) {
  try { fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch (e) { console.error('writeNotifications error', e); }
}

// Auth endpoints (demo-only): sign up and sign in
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if ((!email && !phone) || !password) return res.status(400).json({ success: false, message: 'Provide email or phone and a password' });
    const users = readUsers();
    if (email && users.find(u => u.email && u.email.toLowerCase() === String(email).toLowerCase())) return res.status(409).json({ success: false, message: 'Email already exists' });
    if (phone && users.find(u => u.phone && u.phone === phone)) return res.status(409).json({ success: false, message: 'Phone already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: 'u_' + Date.now(), name: name || '', email: email || null, phone: phone || null, phoneNormalized: (phone ? normalizePhone(phone) : null), pwd: hashed, created: new Date().toISOString() };
    users.push(user); writeUsers(users);
    const { pwd, ...safe } = user;
    // create session token
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const token = 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    sessions[token] = { userId: user.id, created: new Date().toISOString() };
    try { fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2), 'utf8'); } catch (e) { console.error('save session error', e); }
    return res.json({ success: true, user: safe, token });
  } catch (err) {
    console.error('signup error', err); return res.status(500).json({ success: false, message: err.message });
  }
});

// Helper: normalize phone by removing non-digits
function normalizePhone(p) {
  if (!p) return null;
  return String(p).replace(/\D/g, '');
}

app.post('/api/signin', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) return res.status(400).json({ success: false, message: 'Missing identifier or password' });
    const idRaw = String(identifier).trim();
    const idLower = idRaw.toLowerCase();
    const idDigits = normalizePhone(idRaw);

    const users = readUsers();
    const user = users.find(u => {
      // email match (case-insensitive)
      if (u.email && u.email.toLowerCase() === idLower) return true;
      // phone match (normalized digits), allow suffix match to tolerate country code or leading 0
      if (u.phone && idDigits) {
        const up = normalizePhone(u.phone) || '';
        if (!up) return false;
        if (up === idDigits) return true;
        if (up.endsWith(idDigits) || idDigits.endsWith(up)) return true;
      }
      return false;
    });
    if (!user) return res.status(404).json({ success: false, message: 'Account not found' });
    const ok = await bcrypt.compare(password, user.pwd || '');
    if (!ok) return res.status(401).json({ success: false, message: 'Invalid password' });
    const { pwd, ...safe } = user;
    // create session token
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const token = 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    sessions[token] = { userId: user.id, created: new Date().toISOString() };
    try { fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2), 'utf8'); } catch (e) { console.error('save session error', e); }
    return res.json({ success: true, user: safe, token });
  } catch (err) { console.error('signin error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// Protected profile endpoint: requires Authorization: Bearer <token>
app.get('/api/profile', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });
    const users = readUsers();
    const user = users.find(u => u.id === s.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { pwd, ...safe } = user;
    return res.json({ success: true, user: safe });
  } catch (err) { console.error('profile error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// Sign out: invalidate token
app.post('/api/signout', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(400).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    if (sessions[token]) { delete sessions[token]; try { fs.writeFileSync(sessionsFile, JSON.stringify(sessions, null, 2), 'utf8'); } catch (e) { console.error('remove session error', e); } }
    return res.json({ success: true });
  } catch (err) { console.error('signout error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// Initialize payment
app.post('/initialize-payment', async (req, res) => {
  try {
    const { email, amount } = req.body;
    const response = await axios.post('https://api.paystack.co/transaction/initialize', { email, amount: amount * 100 }, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } });
    res.json(response.data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Verify payment
app.get('/verify-payment/:reference', async (req, res) => {
  try {
    const { reference } = req.params;
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } });
    res.json(response.data);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Create receipt for current user (protected)
app.post('/api/receipts', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });

    const payload = req.body || {};
    const receipts = readReceipts();
    const order = Object.assign({}, payload);
    if (!order.orderId) order.orderId = 'ORD' + Date.now();
    if (!order.timestamp) order.timestamp = new Date().toISOString();
    order.userId = s.userId;
    receipts.push(order);
    writeReceipts(receipts);
    return res.json({ success: true, receipt: order });
  } catch (err) { console.error('create receipt error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// List receipts for current user (protected)
app.get('/api/receipts', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });

    const receipts = readReceipts();
    const mine = receipts.filter(r => r.userId === s.userId);
    return res.json({ success: true, receipts: mine });
  } catch (err) { console.error('list receipts error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// Get a single receipt by orderId (protected)
app.get('/api/receipts/:orderId', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });

    const receipts = readReceipts();
    const orderId = req.params.orderId;
    const receipt = receipts.find(r => String(r.orderId) === String(orderId));
    if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });

    // allow owner, or if receipt.sharedWith includes the user, or admin users
    const users = readUsers();
    const user = users.find(u => u.id === s.userId) || null;
    const isAdmin = (user && user.isAdmin) || (process.env.ADMIN_EMAIL && user && user.email && user.email.toLowerCase() === String(process.env.ADMIN_EMAIL).toLowerCase());

    if (receipt.userId !== s.userId && !(Array.isArray(receipt.sharedWith) && receipt.sharedWith.includes(s.userId)) && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    return res.json({ success: true, receipt });
  } catch (err) { console.error('get receipt error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// Allow authenticated users to request access to a receipt they don't own
app.post('/api/receipt-access-request', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });

    const { orderId, message } = req.body || {};
    if (!orderId) return res.status(400).json({ success: false, message: 'Missing orderId' });

    const requests = readAccessRequests();
    const reqObj = { id: 'ar_' + Date.now(), orderId: String(orderId), message: message || '', userId: s.userId, timestamp: new Date().toISOString(), status: 'open' };
    requests.push(reqObj);
    writeAccessRequests(requests);
    return res.json({ success: true, request: reqObj });
  } catch (err) { console.error('access request error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// ADMIN: list all access requests (requires admin user)
app.get('/api/access-requests', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });

    // find user
    const users = readUsers();
    const user = users.find(u => u.id === s.userId) || null;
    const isAdmin = (user && user.isAdmin) || (process.env.ADMIN_EMAIL && user && user.email && user.email.toLowerCase() === String(process.env.ADMIN_EMAIL).toLowerCase());
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Forbidden - admin only' });

    const requests = readAccessRequests();
    return res.json({ success: true, requests });
  } catch (err) { console.error('list access requests error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// Notifications: get current user's notifications (protected)
// Supports pagination via ?limit=&offset= and search via ?q= and filter via ?status=all|read|unread
app.get('/api/notifications', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });

    const limit = Math.min(100, parseInt(req.query.limit || '20', 10) || 20);
    const offset = Math.max(0, parseInt(req.query.offset || '0', 10) || 0);
    const q = (req.query.q || '').toLowerCase();
    const status = (req.query.status || 'all').toLowerCase();

    const notifs = readNotifications();
    let mine = notifs.filter(n => n.userId === s.userId).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
    if (q) {
      mine = mine.filter(n => (n.title && n.title.toLowerCase().includes(q)) || (n.body && n.body.toLowerCase().includes(q)));
    }
    if (status === 'unread') {
      mine = mine.filter(n => !n.read);
    } else if (status === 'read') {
      mine = mine.filter(n => !!n.read);
    }
    const total = mine.length;
    const page = mine.slice(offset, offset + limit);
    return res.json({ success: true, notifications: page, total, limit, offset });
  } catch (err) { console.error('list notifications error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// Mark notification read
app.post('/api/notifications/:id/read', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });

    const id = req.params.id;
    const notifs = readNotifications();
    const idx = notifs.findIndex(n => n.id === id && n.userId === s.userId);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Notification not found' });
    notifs[idx].read = true; notifs[idx].readAt = new Date().toISOString();
    writeNotifications(notifs);
    return res.json({ success: true, notification: notifs[idx] });
  } catch (err) { console.error('mark notification read error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// Admin: create a notification for a user (optional)
app.post('/api/notifications', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });

    const users = readUsers();
    const user = users.find(u => u.id === s.userId) || null;
    const isAdmin = (user && user.isAdmin) || (process.env.ADMIN_EMAIL && user && user.email && user.email.toLowerCase() === String(process.env.ADMIN_EMAIL).toLowerCase());
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Forbidden - admin only' });

    const { userId, title, body, link } = req.body || {};
    if (!userId || !title) return res.status(400).json({ success: false, message: 'Missing parameters' });
    const notifs = readNotifications();
    const n = { id: 'n_' + Date.now(), userId, title, body: body || '', link: link || '', read: false, timestamp: new Date().toISOString() };
    notifs.push(n); writeNotifications(notifs);
    return res.json({ success: true, notification: n });
  } catch (err) { console.error('create notification error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// Batch mark notifications read for current user
app.post('/api/notifications/mark-read', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });

    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    if (!ids.length) return res.status(400).json({ success: false, message: 'Missing ids' });
    const notifs = readNotifications();
    let updated = [];
    ids.forEach(id => {
      const idx = notifs.findIndex(n => n.id === id && n.userId === s.userId);
      if (idx !== -1) { notifs[idx].read = true; notifs[idx].readAt = new Date().toISOString(); updated.push(notifs[idx]); }
    });
    writeNotifications(notifs);
    return res.json({ success: true, updated });
  } catch (err) { console.error('batch mark read error', err); return res.status(500).json({ success: false, message: err.message }); }
});

// Mark all notifications read for current user
app.post('/api/notifications/mark-all-read', (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });

    const notifs = readNotifications();
    let updated = [];
    notifs.forEach(n => { if (n.userId === s.userId && !n.read) { n.read = true; n.readAt = new Date().toISOString(); updated.push(n); } });
    writeNotifications(notifs);
    return res.json({ success: true, updated });
  } catch (err) { console.error('mark all read error', err); return res.status(500).json({ success: false, message: err.message }); }
});



// ADMIN: resolve (approve/deny) an access request
app.post('/api/access-requests/:id/resolve', async (req, res) => {
  try {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'Missing token' });
    const token = parts[1];
    const sessionsFile = path.join(__dirname, 'sessions.json');
    let sessions = {};
    try { if (fs.existsSync(sessionsFile)) sessions = JSON.parse(fs.readFileSync(sessionsFile, 'utf8') || '{}'); } catch (e) { sessions = {}; }
    const s = sessions[token];
    if (!s) return res.status(401).json({ success: false, message: 'Invalid token' });

    const users = readUsers();
    const user = users.find(u => u.id === s.userId) || null;
    const isAdmin = (user && user.isAdmin) || (process.env.ADMIN_EMAIL && user && user.email && user.email.toLowerCase() === String(process.env.ADMIN_EMAIL).toLowerCase());
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Forbidden - admin only' });

    const id = req.params.id;
    const { status, note } = req.body || {};
    if (!id || !['approved','denied'].includes(status)) return res.status(400).json({ success: false, message: 'Missing/invalid parameters' });

    const requests = readAccessRequests();
    const idx = requests.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Request not found' });
    requests[idx].status = status;
    requests[idx].resolvedAt = new Date().toISOString();
    requests[idx].resolvedBy = s.userId;
    if (note) requests[idx].note = note;
    writeAccessRequests(requests);

    // If approved, grant access by adding requester to receipt.sharedWith
    let accessGranted = false;
    if (status === 'approved') {
      const receipts = readReceipts();
      const rec = receipts.find(r => String(r.orderId) === String(requests[idx].orderId));
      if (rec) {
        rec.sharedWith = rec.sharedWith || [];
        if (!rec.sharedWith.includes(requests[idx].userId)) {
          rec.sharedWith.push(requests[idx].userId);
          writeReceipts(receipts);
        }
        accessGranted = true;
      }
    }

    // send email notification to requester (if email available)
    let emailResult = null;
    const requesterUser = users.find(u => u.id === requests[idx].userId);
    if (requesterUser && requesterUser.email) {
      const to = requesterUser.email;
      const subj = status === 'approved' ? `Access approved for receipt ${requests[idx].orderId}` : `Access request denied for receipt ${requests[idx].orderId}`;
      const body = `${status === 'approved' ? 'Your request has been approved.' : 'Your request has been denied.'}\n\n${note ? ('Note: ' + note + '\n\n') : ''}Order ID: ${requests[idx].orderId}\nView: ${process.env.SITE_ORIGIN || 'http://localhost:5000'}/receipt.html?orderId=${encodeURIComponent(requests[idx].orderId)}`;
      emailResult = await sendEmail(to, subj, body, body.replace(/\n/g, '<br>'));
    }

    // Create in-app notification for the requester
    if (requesterUser) {
      const notifs = readNotifications();
      const title = status === 'approved' ? `Access approved for ${requests[idx].orderId}` : `Access request denied for ${requests[idx].orderId}`;
      const body = (note ? ('Note: ' + note + '\n\n') : '') + `Order ID: ${requests[idx].orderId}`;
      const link = `/receipt.html?orderId=${encodeURIComponent(requests[idx].orderId)}`;
      const n = { id: 'n_' + Date.now(), userId: requesterUser.id, title, body, link, read: false, timestamp: new Date().toISOString() };
      notifs.push(n); writeNotifications(notifs);
    }

    return res.json({ success: true, request: requests[idx], accessGranted, emailResult });
  } catch (err) { console.error('resolve access request error', err); return res.status(500).json({ success: false, message: err.message }); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


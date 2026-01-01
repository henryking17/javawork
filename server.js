// server.js
const express = require("express");
const axios = require("axios");
require("dotenv").config();
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

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


const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


async function createRecipient() {
  const axios = require('axios');
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


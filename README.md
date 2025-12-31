# Cympet and Co. Enterprises Website

A beautiful, responsive website for an electronics shop built with HTML, CSS, and JavaScript.

## Features

- Responsive design that works on desktop and mobile
- Smooth scrolling navigation
- Product showcase with featured items
- Shopping cart functionality
- Paystack payment integration for Visa and Mastercard
- Contact form with basic validation
- Modern gradient backgrounds and hover effects

## Payment Integration

This website uses Paystack for secure card payments. To set up payments:

1. Sign up for a Paystack account at https://paystack.com
2. Get your test public key from the Paystack dashboard
3. Replace `pk_test_YOUR_PAYSTACK_PUBLIC_KEY` in `script.js` with your actual test key
4. For production, use your live public key

## Usage

1. Install dependencies and start the server (so Google sign-in and APIs work):
   - npm install
   - npm start
2. Open http://localhost:5000 in your browser to view the site.
3. Sign in with Google using the button in the header. The server verifies the token and creates a session cookie.

**Environment**
- You may set these env vars in a `.env` file:
  - `GOOGLE_CLIENT_ID` (optional; defaults to the client id embedded in the page)
  - `SESSION_SECRET` (optional; default is a dev secret; set a strong value for production)

4. Browse featured products and add items to cart.
5. Click on Visa or Mastercard payment options to initiate checkout via Paystack.
6. Fill out the contact form to send messages.

## Files

- `index.html` - Main HTML structure
- `styles.css` - CSS styling for layout and design
- `script.js` - JavaScript for interactivity and Paystack integration

## Browser Support

Works in all modern browsers that support CSS Grid and Flexbox.

## Troubleshooting

- If images don't load, they are placeholder emojis in the CSS.
- For local development, ensure all files are in the same directory.
- If JavaScript doesn't work, check browser console for errors.
- For payment testing, use Paystack test cards: https://paystack.com/docs/payments/test-payments/"# javawork" 

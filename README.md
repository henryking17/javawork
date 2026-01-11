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

1. Open `index.html` in your web browser to view the website.
2. Navigate through the sections using the header menu.
3. Browse featured products and add items to cart.
4. Click on Visa or Mastercard payment options to initiate checkout via Paystack.
5. Fill out the contact form to send messages.

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
- For payment testing, use Paystack test cards: https://paystack.com/docs/payments/test-payments/

## Google Sign-In (OAuth)

This project supports Sign in with Google using a server-side verification flow (recommended). Setup steps:

1. Create OAuth 2.0 Client ID in Google Cloud Console and copy the **Client ID** (Web application).
2. Set the environment variable `GOOGLE_CLIENT_ID` on your server (e.g., in a `.env` file):

   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

3. In production, host the site using HTTPS and set `NODE_ENV=production` so session cookies are marked Secure.
4. The client will use Google's One Tap / GSI client to obtain an ID token and post it to `/auth/google` where the server verifies it and creates a secure HttpOnly session cookie.

Security notes:

- Keep `GOOGLE_CLIENT_ID` private on the server environment and never embed secrets in client code.
- Use HTTPS in production and set the `Secure` flag on cookies by setting `NODE_ENV=production`.
- Consider using the `google-auth-library` or `openid-client` for stricter verification if you plan to expand the auth features.
 

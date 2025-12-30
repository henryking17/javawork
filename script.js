








// Simple product search — filters product cards by title and description.
// Include this file after your main script.js or merge the logic into it.

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const productCards = () => Array.from(document.querySelectorAll('.product-card'));
  const productsSection = document.querySelector('#products .product-grid');

  // small "no results" placeholder
  let noResultsEl = null;
  function showNoResults() {
    if (!noResultsEl) {
      noResultsEl = document.createElement('div');
      noResultsEl.className = 'no-results';
      noResultsEl.style.padding = '18px';
      noResultsEl.style.textAlign = 'center';
      noResultsEl.style.color = '#666';
      noResultsEl.style.fontSize = '1rem';
      noResultsEl.textContent = 'No products found.';
    }
    if (productsSection && !productsSection.contains(noResultsEl)) {
      productsSection.parentNode.insertBefore(noResultsEl, productsSection.nextSibling);
    }
  }
  function hideNoResults() {
    if (noResultsEl && noResultsEl.parentNode) noResultsEl.parentNode.removeChild(noResultsEl);
  }

  function performSearch() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const cards = productCards();
    if (!q) {
      // show all
      cards.forEach(c => c.style.display = '');
      hideNoResults();
      return;
    }

    let foundAny = false;
    cards.forEach(card => {
      const titleEl = card.querySelector('h3');
      const descEl = card.querySelector('p');
      const title = titleEl ? titleEl.textContent.toLowerCase() : '';
      const desc = descEl ? descEl.textContent.toLowerCase() : '';
      if (title.includes(q) || desc.includes(q)) {
        card.style.display = '';
        foundAny = true;
      } else {
        card.style.display = 'none';
      }
    });

    if (!foundAny) showNoResults();
    else hideNoResults();
  }

  // live search while typing (optional): uncomment the listener below if you want instant filtering
  // searchInput.addEventListener('input', performSearch);

  // search on Enter
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performSearch();
    }
  });

  // search on button click
  searchBtn.addEventListener('click', (e) => {
    e.preventDefault();
    performSearch();
  });

  // optional: clear search when input is emptied
  searchInput.addEventListener('input', () => {
    if (!searchInput.value.trim()) performSearch();
  });
});
  
  
  
  
  
  
  
  
  // --- Small notification helpers that fall back to alert() ---
  function notifySuccess(msg) {
    if (typeof window.showSuccessToast === 'function') {
      window.showSuccessToast(msg);
    } else if (typeof window.showToast === 'function') {
      window.showToast(msg, 'success');
    } else {
      window.alert(msg);
    }
  }

  /* Toasts.js
   - Provides showToast(message, type, options)
   - Overrides window.alert(...) to display modern toasts
   - Load this script BEFORE your main script.js so alert calls are captured
*/

(function () {
  // Create container
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Default options
  const DEFAULT_DURATION = 4200; // ms

  // Utility: create SVG check and X icons
  function svgCheck() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  function svgX() {
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  // Show a toast
  window.showToast = function (message, type = 'success', opts = {}) {
    const duration = typeof opts.duration === 'number' ? opts.duration : DEFAULT_DURATION;
    const title = opts.title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Notice');
    // Create elements
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'error' ? 'toast-error' : 'toast-success');
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    // inner HTML
    toast.innerHTML = `
      <div class="icon" aria-hidden="true">${type === 'error' ? svgX() : svgCheck()}</div>
      <div class="content">
        <div class="title">${escapeHtml(title)}</div>
        <div class="message">${escapeHtml(message)}</div>
      </div>
      <div class="actions">
        <button class="close-btn" aria-label="Close notification">&times;</button>
      </div>
      <div class="progress"><span></span></div>
    `;

    // append
    container.prepend(toast);

    // show with animation
    // small timeout to allow insertion to DOM
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // progress bar animation (scaleX from 1 -> 0)
    const progressBar = toast.querySelector('.progress > span');
    if (progressBar) {
      // set transition equal to duration
      progressBar.style.transitionDuration = duration + 'ms';
      // start a tiny tick then scaleX to 0
      requestAnimationFrame(() => progressBar.style.transform = 'scaleX(0)');
    }

    // close handler
    const closeBtn = toast.querySelector('.close-btn');
    const removeToast = () => {
      toast.classList.remove('show');
      // wait for transition to complete then remove
      setTimeout(() => {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
      }, 260);
    };

    closeBtn.addEventListener('click', removeToast);

    // auto dismiss
    let dismissTimeout = setTimeout(removeToast, duration);

    // pause on hover/focus
    toast.addEventListener('mouseenter', () => {
      clearTimeout(dismissTimeout);
      // pause progress (freeze by computing current transform and setting inline)
      if (progressBar) {
        const computed = window.getComputedStyle(progressBar);
        // get transform matrix and compute scaleX
        const matrix = computed.transform || computed.webkitTransform;
        // Try to extract scaleX (simpler: compute elapsed by transition timing)
        progressBar.style.transitionDuration = '0ms';
      }
    });
    toast.addEventListener('mouseleave', () => {
      // resume with remaining time: simply set another timeout for some fraction (not exact, but sufficient)
      dismissTimeout = setTimeout(removeToast, 1800);
      if (progressBar) {
        progressBar.style.transitionDuration = (1800) + 'ms';
        requestAnimationFrame(() => progressBar.style.transform = 'scaleX(0)');
      }
    });

    return {
      dismiss: removeToast
    };
  };

  // Small helper to escape html in messages
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Heuristic to classify alert message as success or error (works for most of current app messages)
  function classifyMessage(msg) {
    const s = String(msg).toLowerCase();
    const positiveKeywords = ['success', 'successful', 'added', 'thank', 'placed', 'payment successful', 'order placed', 'added to cart', 'confirmed'];
    const negativeKeywords = ['error', 'failed', 'cancel', 'cancelled', 'invalid', 'empty', 'please', 'cannot', 'not'];
    for (const k of positiveKeywords) if (s.includes(k)) return 'success';
    for (const k of negativeKeywords) if (s.includes(k)) return 'error';
    // fallback: treat short messages that look positive as success (e.g., "OK", "Done")
    if (s.length <= 4 && /ok|done|yay|nice/.test(s)) return 'success';
    return 'success'; // default to success for positive UX; change to 'error' if you prefer conservative
  }

  // Save original alert
  const nativeAlert = window.alert.bind(window);

  // Override global alert
  window.alert = function (msg) {
    try {
      const type = classifyMessage(msg);
      // allow passing objects/arrays; stringify
      const text = (typeof msg === 'string') ? msg : JSON.stringify(msg);
      showToast(text, type);
    } catch (e) {
      // fallback to native in case of unexpected failure
      nativeAlert(msg);
    }
  };

  // also expose showSuccess/showError helpers
  window.showSuccessToast = function (message, opts) { return showToast(message, 'success', opts); };
  window.showErrorToast = function (message, opts) { return showToast(message, 'error', opts); };

  // optional: expose a method to restore native alert
  window._restoreNativeAlert = function () {
    window.alert = nativeAlert;
  };
})();


  function notifyError(msg) {
    if (typeof window.showErrorToast === 'function') {
      window.showErrorToast(msg);
    } else if (typeof window.showToast === 'function') {
      window.showToast(msg, 'error');
    } else {
      window.alert(msg);
    }
  }



// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
        // Close mobile menu after clicking
        if (typeof navUl !== 'undefined' && navUl) navUl.classList.remove('show');
    });
});

// Hamburger menu toggle
const hamburger = document.getElementById('hamburger');
const navUl = document.querySelector('nav ul');

if (hamburger && navUl) {
    hamburger.addEventListener('click', () => {
        navUl.classList.toggle('show');
    });
}

// Paystack initialization (replace with your own public key if needed)
const paystackPublicKey = 'pk_live_b6107994278a9ccd508d5e7a08c12586e64b1ee1';

// Web3Forms API key (used for sending order summary emails)
const WEB3FORMS_KEY = '22b0c187-7f5e-48e5-91cf-d3481d9cd44f';

// -------------------- Helpers --------------------
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}
function parsePrice(priceStr) {
    if (!priceStr) return 0;
    const digits = priceStr.replace(/[^\d]/g, '');
    return digits ? parseInt(digits, 10) : 0;
}
function formatPrice(amount) {
    return '₦' + Number(amount).toLocaleString();
}
function escapeForJs(str) {
    return String(str).replace(/'/g, "\\'");
}

// -------------------- Contact form (unchanged) --------------------
const contactForm = document.getElementById('contact-form');
const submitBtn = document.getElementById('submit-btn');
const formStatus = document.getElementById('form-status');

if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !subject || !message) {
            showFormStatus('Please fill in all required fields.', 'error');
            return;
        }
        if (!isValidEmail(email)) {
            showFormStatus('Please enter a valid email address.', 'error');
            return;
        }
        if (phone && !isValidPhone(phone)) {
            showFormStatus('Please enter a valid phone number.', 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        setTimeout(() => {
            const contactData = { name, email, phone, subject, message, timestamp: new Date().toISOString() };
            let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
            contacts.push(contactData);
            localStorage.setItem('contacts', JSON.stringify(contacts));
            contactForm.reset();
            showFormStatus('Thank you for your message! We will get back to you within 24 hours.', 'success');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Message';
            console.log('Contact form submitted:', contactData);
        }, 2000);
    });
}
function showFormStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = type;
    formStatus.style.display = 'block';
    setTimeout(() => {
        formStatus.style.display = 'none';
    }, 5000);
}

// -------------------- Product & Catalog Data --------------------
// Variants (used for detailed variant-level cart items if variant names are added)
const productVariants = {
    'Refrigerator': [
        { name: 'LG Double Door', description: 'Energy-efficient double door fridge', price: '₦250,000', emoji: '🧊', unit_price: 250000 },
        { name: 'Samsung Side-by-Side', description: 'Large capacity side-by-side refrigerator', price: '₦450,000', emoji: '🧊', unit_price: 450000 },
        { name: 'Whirlpool Single Door', description: 'Compact single door refrigerator', price: '₦150,000', emoji: '🧊', unit_price: 150000 }
    ],
    'Freezer': [
        { name: 'Haier Chest Freezer', description: 'Large capacity chest freezer', price: '₦180,000', emoji: '❄️', unit_price: 180000 },
        { name: 'LG Upright Freezer', description: 'Upright freezer with multiple compartments', price: '₦220,000', emoji: '❄️', unit_price: 220000 },
        { name: 'Samsung Deep Freezer', description: 'Deep freezer for long-term storage', price: '₦200,000', emoji: '❄️', unit_price: 200000 }
    ],
    'Sound Systems': [
        { name: 'Sony 5.1 Home Theatre', description: 'Complete 5.1 surround sound', price: '₦150,000', emoji: '🎬', unit_price: 150000 }
    ]
    // Add more variants if needed
};

// Catalog entries used when user adds the displayed product card items directly to cart
const productCatalog = {
    'Air Conditioners': { name: 'Air Conditioners', description: 'Energy-saving split and window AC units', priceStr: '₦250,000', unit_price: 250000 },
    'Blenders': { name: 'Blenders', description: 'High-performance kitchen blenders', priceStr: '₦60,000', unit_price: 60000 },
    'Ceiling Fans': { name: 'Ceiling Fans', description: 'Quiet, energy-efficient ceiling fans', priceStr: '₦35,000', unit_price: 35000 },
    'Elepaq Constant Generators': { name: 'Elepaq Constant Generators', description: 'Reliable petrol/diesel generators', priceStr: '₦380,000', unit_price: 380000 },
    'Freezer': { name: 'Freezer', description: 'Chest and upright freezers', priceStr: '₦180,000', unit_price: 180000 },
    'Sound Systems': { name: 'Sound Systems', description: 'Home theatre systems & soundbars', priceStr: '₦150,000', unit_price: 150000 },
    'Microphones': { name: 'Microphones', description: 'Wired and wireless microphones', priceStr: '₦45,000', unit_price: 45000 },
    'Rechargeable Standing Fans': { name: 'Rechargeable Standing Fans', description: 'Battery powered standing fans', priceStr: '₦35,000', unit_price: 35000 },
    'Refrigerator': { name: 'Refrigerator', description: 'Single & double-door refrigerators', priceStr: '₦250,000', unit_price: 250000 },
    'Standing Fans': { name: 'Standing Fans', description: 'Adjustable-height standing fans', priceStr: '₦25,000', unit_price: 25000 },
    'Stabilizers': { name: 'Stabilizers', description: 'Voltage stabilizers', priceStr: '₦30,000', unit_price: 30000 },
    'Sumec Firman Generators': { name: 'Sumec Firman Generators', description: 'Portable & industrial generators', priceStr: '₦350,000', unit_price: 350000 },
    'Wall Fans': { name: 'Wall Fans', description: 'Wall-mounted fans', priceStr: '₦30,000', unit_price: 30000 }
};

// Helper to get product details by key (variant name or catalog title)
function getProductDetails(key) {
    // Try to find variant by exact name
    for (const category in productVariants) {
        for (const variant of productVariants[category]) {
            if (variant.name === key) {
                const unit = variant.unit_price || parsePrice(variant.price);
                return {
                    name: variant.name,
                    description: variant.description || '',
                    priceStr: variant.price || formatPrice(unit),
                    unit_price: unit
                };
            }
        }
    }
    // Try catalog entry
    if (productCatalog[key]) {
        return {
            name: productCatalog[key].name,
            description: productCatalog[key].description || '',
            priceStr: productCatalog[key].priceStr || formatPrice(productCatalog[key].unit_price || 0),
            unit_price: productCatalog[key].unit_price || 0
        };
    }
    // Fallback
    return { name: key, description: '', priceStr: '₦0', unit_price: 0 };
}

// -------------------- Lightbox + Product-card UI --------------------
const imageModal = document.getElementById('image-modal');
const imageModalClose = document.getElementById('image-modal-close');
const lightboxImage = document.getElementById('lightbox-image');

document.querySelectorAll('.product-image').forEach(container => {
    // zoom icon
    const zoom = document.createElement('span');
    zoom.className = 'zoom-icon';
    zoom.setAttribute('aria-hidden', 'true');
    zoom.textContent = '🔍';
    container.appendChild(zoom);

    const img = container.querySelector('img');
    if (img) {
        img.addEventListener('click', function(evt) {
            evt.stopPropagation();
            openImageModal(this.src);
        });
    }

    // add quick "Add to Cart" button to the product-card
    const productCard = container.closest('.product-card');
    if (productCard && !productCard.querySelector('.add-now')) {
        const addBtn = document.createElement('button');
        addBtn.className = 'btn add-now';
        addBtn.textContent = 'Add to Cart';
        addBtn.style.margin = '12px';
        addBtn.addEventListener('click', function(evt) {
            evt.stopPropagation();
            const titleEl = productCard.querySelector('h3');
            const title = titleEl ? titleEl.textContent.trim() : null;
            if (title) addToCart(title);
        });
        productCard.appendChild(addBtn);
    }
});

function openImageModal(src) {
    lightboxImage.src = src;
    imageModal.style.display = 'block';
    imageModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}
function closeImageModal() {
    imageModal.style.display = 'none';
    imageModal.setAttribute('aria-hidden', 'true');
    lightboxImage.src = '';
    document.body.style.overflow = '';
}
if (imageModalClose) {
    imageModalClose.addEventListener('click', closeImageModal);
}
window.addEventListener('click', function(e) {
    if (e.target === imageModal) closeImageModal();
});

// -------------------- Product modal & Specs --------------------
const modal = document.getElementById('product-modal');
const productModalClose = document.getElementById('product-modal-close');

document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', function(e) {
        // ignore clicks on add-now or zoom
        if (e.target.classList.contains('add-now') || e.target.classList.contains('zoom-icon')) return;

        const title = this.querySelector('h3') ? this.querySelector('h3').textContent.trim() : '';
        const description = this.querySelector('p') ? this.querySelector('p').textContent.trim() : '';
        const imageSrc = this.querySelector('img') ? this.querySelector('img').src : '';

        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-image').src = imageSrc;
        document.getElementById('modal-description').textContent = description;

        // Reset view
        document.getElementById('product-details').style.display = 'block';
        document.getElementById('modal-specs').style.display = 'none';
        document.getElementById('modal-variants').style.display = 'none';
        modal.style.display = 'block';
        modal.setAttribute('aria-hidden', 'false');

        // add "Add to Cart" inside modal if not present
        if (!document.getElementById('modal-add-btn')) {
            const btn = document.createElement('button');
            btn.id = 'modal-add-btn';
            btn.className = 'btn';
            btn.textContent = 'Add to Cart';
            btn.style.marginLeft = '8px';
            btn.addEventListener('click', function() {
                const titleNow = document.getElementById('modal-title').textContent;
                if (titleNow) addToCart(titleNow);
            });
            const detailsDiv = document.getElementById('product-details');
            if (detailsDiv) detailsDiv.appendChild(btn);
        }
    });
});

if (productModalClose) {
    productModalClose.addEventListener('click', function() {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        const specsEl = document.getElementById('modal-specs');
        if (specsEl) specsEl.innerHTML = '';
    });
}
window.addEventListener('click', function(e) {
    if (e.target === modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        const specsEl = document.getElementById('modal-specs');
        if (specsEl) specsEl.innerHTML = '';
    }
    if (e.target === document.getElementById('delivery-modal')) {
        closeDeliveryModal();
    }
});

// -------------------- Cart (fully functional) --------------------
let cart = JSON.parse(localStorage.getItem('cart')) || {};
updateCartCount();

function addToCart(productKey) {
    const key = productKey.trim();
    if (!key) return;

    if (cart[key]) cart[key] += 1;
    else cart[key] = 1;

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.classList.add('animate');
        setTimeout(() => cartCountEl.classList.remove('animate'), 600);
    }
    alert(`${key} added to cart.`);
}

function updateCartCount() {
    let totalItems = 0;
    for (const p in cart) totalItems += cart[p];
    const el = document.getElementById('cart-count');
    if (el) el.textContent = totalItems;
}

function showCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';
    let total = 0;

    if (Object.keys(cart).length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        for (const productKey in cart) {
            const quantity = cart[productKey];
            const details = getProductDetails(productKey);
            const itemTotal = details.unit_price * quantity;
            total += itemTotal;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'cart-item';
            itemDiv.innerHTML = `
                <div class="cart-item-details">
                    <h4>${details.name}</h4>
                    <p>${details.description || ''}</p>
                    <span class="cart-item-price">${details.priceStr} x ${quantity} = ${formatPrice(itemTotal)}</span>
                </div>
                <div class="quantity-controls">
                    <button class="btn qty-btn" onclick="changeQuantity('${escapeForJs(productKey)}', -1)">-</button>
                    <span>${quantity}</span>
                    <button class="btn qty-btn" onclick="changeQuantity('${escapeForJs(productKey)}', 1)">+</button>
                    <button class="btn remove-btn" onclick="removeFromCart('${escapeForJs(productKey)}')">Remove</button>
                </div>
            `;
            cartItems.appendChild(itemDiv);
        }
    }

    document.getElementById('cart-total').textContent = `Total: ${formatPrice(total)}`;
    document.getElementById('cart-modal').style.display = 'block';
}

function changeQuantity(productKey, delta) {
    const key = productKey;
    const prevTotal = Object.values(cart).reduce((s, v) => s + v, 0);
    if (!cart[key]) return;
    cart[key] += delta;
    if (cart[key] <= 0) delete cart[key];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    const newTotal = Object.values(cart).reduce((s, v) => s + v, 0);
    if (newTotal > prevTotal) {
        const cartCountEl = document.getElementById('cart-count');
        if (cartCountEl) {
            cartCountEl.classList.add('animate');
            setTimeout(() => cartCountEl.classList.remove('animate'), 600);
        }
    }
    showCart();
}

function removeFromCart(productKey) {
    const key = productKey;
    delete cart[key];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCart();
}

function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

// -------------------- Paystack checkout & Cash on Delivery (restored) --------------------

// Helper to compute cart total (returns integer NGN)
function computeCartTotal() {
    let total = 0;
    for (const key in cart) {
        const details = getProductDetails(key);
        total += (details.unit_price || 0) * cart[key];
    }
    return total;
}

// Initiate paying with Paystack (opens cart then checkout)
function initiateCardPayment() {
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty! Add items before paying.');
        return;
    }
    // show cart first
    showCart();
    // then start checkout after short delay (ensures modal visible)
    setTimeout(() => checkout(), 100);
}

function checkout() {
    const totalNGN = computeCartTotal();
    if (totalNGN <= 0) {
        alert('Cart total is zero. Add items before checkout.');
        return;
    }
    const amountInKobo = totalNGN * 100;

    // Create a snapshot so modifications during payment don't affect the record
    const checkoutSnapshot = JSON.parse(JSON.stringify(cart));

    const handler = PaystackPop.setup({
        key: paystackPublicKey,
        email: 'customer@example.com', // For production, collect the real customer email before calling
        amount: amountInKobo,
        currency: 'NGN',
        ref: 'PS_' + Math.floor((Math.random() * 1000000000) + 1),
        callback: function(response) {
            alert('Payment successful! Reference: ' + response.reference);

            // Build items array from snapshot
            const items = [];
            let paymentTotal = 0;
            for (const productKey in checkoutSnapshot) {
                const details = getProductDetails(productKey);
                const quantity = checkoutSnapshot[productKey];
                const itemTotal = details.unit_price * quantity;
                paymentTotal += itemTotal;
                items.push({
                    name: details.name,
                    description: details.description,
                    unit_price: details.priceStr,
                    quantity,
                    item_total: formatPrice(itemTotal)
                });
            }

            const paymentOrder = {
                name: 'Paystack Customer',
                email: 'customer@example.com',
                phone: '',
                cart: items,
                total: formatPrice(paymentTotal),
                timestamp: new Date().toISOString(),
                orderId: 'PS_' + response.reference,
                payment_reference: response.reference,
                payment_method: 'Paystack'
            };

            // send order email
            sendOrderEmail(paymentOrder, 'payment')
                .then(() => console.log('Payment order email sent'))
                .catch(err => console.error('Error sending payment email:', err));

            // Clear cart
            cart = {};
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            closeCart();
        },
        onClose: function() {
            alert('Payment cancelled.');
        }
    });
    handler.openIframe();
}

// Cash on Delivery flow
function initiateCashOnDelivery() {
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty! Add items before placing an order.');
        return;
    }
    showDeliveryModal();
}

function showDeliveryModal() {
    const deliveryCartItems = document.getElementById('delivery-cart-items');
    deliveryCartItems.innerHTML = '';
    let total = 0;

    if (Object.keys(cart).length === 0) {
        deliveryCartItems.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        for (const productKey in cart) {
            const details = getProductDetails(productKey);
            const quantity = cart[productKey];
            const itemTotal = details.unit_price * quantity;
            total += itemTotal;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'delivery-cart-item';
            itemDiv.innerHTML = `
                <div class="delivery-item-details">
                    <h4>${details.name}</h4>
                    <p>${details.description}</p>
                    <span class="delivery-item-price">${details.priceStr} x ${quantity} = ${formatPrice(itemTotal)}</span>
                </div>
            `;
            deliveryCartItems.appendChild(itemDiv);
        }
    }

    document.getElementById('delivery-total').textContent = `Total: ${formatPrice(total)}`;
    document.getElementById('delivery-modal').style.display = 'block';
}

// Close delivery modal
function closeDeliveryModal() {
    document.getElementById('delivery-modal').style.display = 'none';
}

// -------------------- Delivery form submission (sends email + stores locally) --------------------
const deliveryForm = document.getElementById('delivery-form');
const deliverySubmitBtn = document.getElementById('delivery-submit-btn');
const deliveryStatus = document.getElementById('delivery-status');

if (deliveryForm) {
    deliveryForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('delivery-name').value.trim();
        const phone = document.getElementById('delivery-phone').value.trim();
        const email = document.getElementById('delivery-email') ? document.getElementById('delivery-email').value.trim() : '';
        const address = document.getElementById('delivery-address').value.trim();
        const city = document.getElementById('delivery-city').value.trim();
        const notes = document.getElementById('delivery-notes').value.trim();

        if (!name || !phone || !address || !city) {
            showDeliveryStatus('Please fill in all required fields.', 'error');
            return;
        }
        if (!isValidPhone(phone)) {
            showDeliveryStatus('Please enter a valid phone number.', 'error');
            return;
        }
        if (email && !isValidEmail(email)) {
            showDeliveryStatus('Please enter a valid email address.', 'error');
            return;
        }

        deliverySubmitBtn.disabled = true;
        deliverySubmitBtn.textContent = 'Processing Order...';

        setTimeout(async () => {
            // Build order items & total
            const items = [];
            let total = 0;
            for (const productKey in cart) {
                const details = getProductDetails(productKey);
                const quantity = cart[productKey];
                const itemTotal = details.unit_price * quantity;
                total += itemTotal;
                items.push({
                    name: details.name,
                    unit_price: details.priceStr,
                    quantity,
                    item_total: formatPrice(itemTotal)
                });
            }

            const deliveryData = {
                name,
                phone,
                email,
                address,
                city,
                notes,
                cart: items,
                total: formatPrice(total),
                timestamp: new Date().toISOString(),
                orderId: 'COD_' + Math.floor((Math.random() * 1000000) + 1),
                payment_method: 'Cash on Delivery'
            };

            // store locally for demo
            let orders = JSON.parse(localStorage.getItem('cash_orders')) || [];
            orders.push(deliveryData);
            localStorage.setItem('cash_orders', JSON.stringify(orders));

            // send email
            try {
                await sendOrderEmail(deliveryData, 'cod');
                console.log('COD order email sent');
            } catch (err) {
                console.error('Error sending COD email:', err);
            }

            // Clear cart and update UI
            cart = {};
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();

            deliveryForm.reset();
            showDeliveryStatus(`Order placed successfully! Your order ID is ${deliveryData.orderId}. We will contact you at ${phone} for delivery arrangements.`, 'success');

            deliverySubmitBtn.disabled = false;
            deliverySubmitBtn.textContent = 'Confirm Order';

            // close after a short delay
            setTimeout(() => {
                closeDeliveryModal();
            }, 3000);

            console.log('Cash on Delivery order submitted:', deliveryData);
        }, 1500);
    });
}

function showDeliveryStatus(message, type) {
    deliveryStatus.textContent = message;
    deliveryStatus.className = type;
    deliveryStatus.style.display = 'block';

    if (type === 'error') {
        setTimeout(() => {
            deliveryStatus.style.display = 'none';
        }, 5000);
    }
}

// -------------------- Email sending (Web3Forms) --------------------
async function sendOrderEmail(orderData, type = 'order') {
    try {
        const lines = [];
        lines.push(`Order ID: ${orderData.orderId || 'N/A'}`);
        lines.push(`Order Type / Payment Method: ${orderData.payment_method || type}`);
        lines.push(`Customer Name: ${orderData.name || ''}`);
        lines.push(`Phone: ${orderData.phone || ''}`);
        if (orderData.email) lines.push(`Email: ${orderData.email}`);
        if (orderData.address) lines.push(`Address: ${orderData.address}`);
        if (orderData.city) lines.push(`City/State: ${orderData.city}`);
        lines.push('');
        lines.push('Items:');
        if (Array.isArray(orderData.cart) && orderData.cart.length > 0) {
            orderData.cart.forEach((item, idx) => {
                lines.push(`${idx + 1}. ${item.name} — ${item.unit_price || ''} x ${item.quantity || 1} = ${item.item_total || ''}`);
            });
        } else {
            lines.push('No items (empty cart).');
        }
        lines.push('');
        lines.push(`Total: ${orderData.total || 'N/A'}`);
        lines.push(`Timestamp: ${orderData.timestamp || new Date().toISOString()}`);
        if (orderData.notes) {
            lines.push('');
            lines.push('Customer Notes:');
            lines.push(orderData.notes);
        }

        const message = lines.join('\n');

        const payload = {
            access_key: WEB3FORMS_KEY,
            subject: `New ${type === 'payment' ? 'Payment' : 'Order'} - ${orderData.orderId || ''}`,
            name: orderData.name || 'Customer',
            email: orderData.email || 'no-reply@cympet.co',
            message: message,
            data: orderData
        };

        const res = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (json.success) {
            console.log('Order email accepted by Web3Forms:', json);
            return json;
        } else {
            console.error('Web3Forms rejected the request:', json);
            throw new Error('Failed to send order email');
        }
    } catch (err) {
        console.error('sendOrderEmail error:', err);
        throw err;
    }
}

// -------------------- Product Specifications (View Specifications) --------------------
const productSpecs = {
    'Air Conditioners': {
        'Types': 'Split, Window, Portable',
        'Capacity Range': '0.75 HP to 2.5 HP',
        'Energy Efficiency': 'Inverter models available (R32, R410A)',
        'Features': 'Auto-restart, Sleep mode, Remote control, Timer',
        'Warranty': '1-3 years'
    },
    'Blenders': {
        'Power': '500W - 1200W',
        'Jar Material': 'Glass and BPA-free plastic options',
        'Speeds': 'Multi-speed with pulse setting',
        'Accessories': 'Chopper, Grinder, Travel lid (model dependent)',
        'Warranty': '1 year'
    },
    'Ceiling Fans': {
        'Blade Sizes': '42", 48", 56"',
        'Motor Type': 'Copper winding, energy-efficient motors',
        'Features': 'Reverse function, Remote control (select models)',
        'Noise Level': 'Low noise operation (≤ 55 dB)',
        'Warranty': '1-2 years'
    },
    'Elepaq Constant Generators': {
        'Fuel Type': 'Petrol / Diesel',
        'Capacity Range': '2.5kVA - 25kVA',
        'Start Type': 'Recoil and Electric start options',
        'Fuel Tank': 'Large tank options for extended run-time',
        'Warranty': '1 year'
    },
    'Freezer': {
        'Types': 'Chest and Upright',
        'Capacity Range': '100 L – 500 L',
        'Temperature Range': '-18°C to -25°C (deep-freeze models)',
        'Defrost': 'Manual and Auto-defrost options',
        'Warranty': '1-2 years'
    },
    'Sound Systems': {
        'Configurations': '2.1, 5.1, soundbars, portable speakers',
        'Connectivity': 'Bluetooth, AUX, Optical, USB',
        'Power Range': '50W - 1000W depending on model',
        'Specials': 'Subwoofer included in many home theatre sets',
        'Warranty': '1 year'
    },
    'Microphones': {
        'Types': 'Dynamic, Condenser, USB, Wireless',
        'Use Cases': 'Vocal performance, Studio recording, Podcasting',
        'Connectivity': 'XLR, USB, Wireless receivers',
        'Accessories': 'Stands, Pop filters, Cables (model dependent)',
        'Warranty': '1 year'
    },
    'Rechargeable Standing Fans': {
        'Battery Type': 'Lithium-ion or lead-acid options',
        'Run Time': '4 - 24 hours depending on speed and battery',
        'Charging': 'AC charger and sometimes solar-compatible',
        'Features': 'Multiple speed levels, Oscillation, Remote (some models)',
        'Warranty': '6 months - 1 year'
    },
    'Refrigerator': {
        'Types': 'Single door, Double door, Side-by-side',
        'Capacity Range': '90 L – 600 L',
        'Compressor': 'Inverter compressors for energy saving',
        'Features': 'Frost-free, Multi-air flow, Water dispenser (select models)',
        'Warranty': '1-3 years'
    },
    'Standing Fans': {
        'Speeds': '3-6 speed settings',
        'Oscillation': 'Yes (most models)',
        'Height Adjustment': 'Yes',
        'Blade Material': 'Plastic / Metal',
        'Warranty': '1 year'
    },
    'Stabilizers': {
        'Capacity Range': '1000VA - 10000VA',
        'Display': 'Digital/Analog voltage display',
        'Protection': 'Over-voltage, Under-voltage, Surge protection',
        'Use Case': 'TVs, Refrigerators, Home electronics',
        'Warranty': '1 year'
    },
    'Sumec Firman Generators': {
        'Fuel Type': 'Petrol',
        'Capacity Range': '1kVA - 7.9kVA (typical models)',
        'Start Type': 'Recoil and electric start',
        'Features': 'Oil alert, Voltage regulator, AVR in some models',
        'Warranty': '1 year'
    },
    'Wall Fans': {
        'Sizes': '12" - 18"',
        'Mount Type': 'Wall bracket with adjustable tilt',
        'Power': 'Low power consumption models',
        'Use Case': 'Workshops, kitchens, rooms with limited floor space',
        'Warranty': '1 year'
    }
};

// Show specs inside product modal
function showSpecs() {
    const title = document.getElementById('modal-title').textContent;
    const specsContainer = document.getElementById('modal-specs');
    specsContainer.innerHTML = '';

    const specs = productSpecs[title];

    if (!specs) {
        specsContainer.innerHTML = '<p>No detailed specifications available for this product at the moment.</p>';
    } else {
        let html = '<div class="specs-list"><dl>';
        for (const key in specs) {
            html += `<dt style="font-weight:700; margin-top:6px;">${key}</dt><dd style="margin-left:0; margin-bottom:6px;">${specs[key]}</dd>`;
        }
        html += '</dl></div>';
        specsContainer.innerHTML = html;
    }

    document.getElementById('product-details').style.display = 'none';
    document.getElementById('modal-variants').style.display = 'none';
    specsContainer.style.display = 'block';
}

// -------------------- End of script --------------------
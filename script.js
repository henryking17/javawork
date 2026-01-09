// ========== USER ACCOUNT MANAGEMENT ==========
// Check if user is logged in and display account status
function initializeUserSession() {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  const accountLink = document.querySelector('.account-link');
  const dropdownMenu = document.querySelector('.dropdown-menu');
  const signInLink = document.querySelector('.dropdown-signin');
  const logoutBtn = document.querySelector('.dropdown-logout');
  const custNotifLink = document.getElementById('customerNotifLink');
  const receiptsSection = document.getElementById('receipts');
  
  if (currentUser && accountLink) {
    // User is logged in
    accountLink.innerHTML = `<b>👤 ${currentUser.name.split(' ')[0]}</b>`;
    
    // Show logout, hide signin
    if (signInLink) signInLink.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    
    // Show customer notifications link
    if (custNotifLink) {
      custNotifLink.style.display = 'block';
      updateCustomerNotificationsBadge();
    }

    // Show receipts section for logged-in users
    if (receiptsSection) {
      receiptsSection.style.display = '';
    }
  } else {
    // User is not logged in
    accountLink.innerHTML = `<b>👤 Account</b>`;
    
    // Show signin, hide logout
    if (signInLink) signInLink.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    // Hide customer notifications link if not logged in
    if (custNotifLink) {
      custNotifLink.style.display = 'none';
    }

    // Hide receipts section for non-logged-in users
    if (receiptsSection) {
      receiptsSection.style.display = 'none';
    }
  }

  // Update admin notifications badge
  updateNotificationsBadge();
  
  // Setup dropdown menu toggle or direct logout
  if (accountLink && dropdownMenu) {
    accountLink.addEventListener('click', (e) => {
      e.preventDefault();
      // If user is logged in, logout immediately; otherwise toggle dropdown
      if (currentUser) {
        logoutBtn.click();
      } else {
        dropdownMenu.classList.toggle('show');
      }
    });
    
    // Setup logout button
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showNotification(`Logged out successfully. See you soon!`, 'success');
        setTimeout(() => {
          sessionStorage.removeItem('currentUser');
          window.location.href = 'admin.html';
        }, 300);
      });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.account-dropdown')) {
        dropdownMenu.classList.remove('show');
      }
    });
  }
}

// Update customer notifications badge count
function updateCustomerNotificationsBadge() {
  const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  if (!currentUser) return;

  const notifications = JSON.parse(localStorage.getItem('customer_notifications_' + currentUser.id) || '[]');
  const unreadCount = notifications.filter(n => !n.read).length;
  const badge = document.getElementById('custNotifBadge');
  
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Update admin notifications badge count
function updateNotificationsBadge() {
  const notifications = JSON.parse(localStorage.getItem('admin_notifications') || '[]');
  const unreadCount = notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notifBadge');
  
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeUserSession);

// Update badges every 3 seconds
setInterval(() => {
  updateNotificationsBadge();
  updateCustomerNotificationsBadge();
}, 3000);

// Show notification if login/signup was successful
window.addEventListener('load', function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('login') === 'success') {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      showNotification(`Welcome back, ${currentUser.name}!`, 'success');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } else if (params.get('signup') === 'success') {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      showNotification(`Welcome, ${currentUser.name}! Your account has been created.`, 'success');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }
});

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#22c55e' : '#3b82f6'};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// --- Receipts: collapsible inline view + open in new tab ---
// Replace the existing renderReceipts(), viewReceipt(), and printReceipt() functions
// with the code below (they integrate with the same localStorage keys used elsewhere).

/**
 * Return HTML string for a receipt (used for inline expanded view).
 * @param {Object} order
 * @returns {string}
 */
function renderReceiptHtml(order) {
  const itemsHtml = (Array.isArray(order.cart) && order.cart.length)
    ? order.cart.map(it => {
        const qty = it.quantity || 1;
        const line = it.item_total || it.unit_price || '';
        return `<tr>
                  <td style="padding:6px; border-bottom:1px solid #fafafa;">${escapeHtml(it.name)}</td>
                  <td style="padding:6px; text-align:right; border-bottom:1px solid #fafafa;">${qty}</td>
                  <td style="padding:6px; text-align:right; border-bottom:1px solid #fafafa;">${escapeHtml(line)}</td>
                </tr>`;
      }).join('')
    : `<tr><td colspan="3" style="padding:6px;">No items recorded.</td></tr>`;

  const addressRow = order.address ? `<div><strong>Address:</strong> ${escapeHtml(order.address)}</div>` : '';
  const emailRow = order.email ? `<div><strong>Email:</strong> ${escapeHtml(order.email)}</div>` : '';
  const deliveryRow = order.delivery_type ? `<div><strong>Delivery Type:</strong> ${escapeHtml(order.delivery_type === 'pickup' ? 'Pickup' : 'Home Delivery')}</div>` : '';
  const paymentText = order.payment_method ? order.payment_method : (order._type === 'paid' ? 'Paid via Paystack' : (order.delivery_type ? (order.delivery_type === 'pickup' ? 'Pickup' : 'Home Delivery') : 'Cash on Delivery'));

  return `
    <div class="receipt-inline">
      <div style="text-align:center; margin-bottom:8px;"><img src="Copilot_20251226_202609.png" alt="Cympet and Co Logo" style="height:40px; display:inline-block;"></div>
      <div style="color:#666; margin-bottom:8px;">${escapeHtml(paymentText)}</div>
      <div><strong>Customer:</strong> ${escapeHtml(order.name || '')}</div>
      ${order.phone ? `<div><strong>Phone:</strong> ${escapeHtml(order.phone)}</div>` : ''}
      ${emailRow}
      ${deliveryRow}
      ${addressRow}
      <div style="margin-top:10px;"><strong>Items</strong></div>
      <table style="width:100%; border-collapse:collapse; margin-top:6px;">
        <thead>
          <tr>
            <th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Item</th>
            <th style="text-align:right; padding:6px; border-bottom:1px solid #eee;">Qty</th>
            <th style="text-align:right; padding:6px; border-bottom:1px solid #eee;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div style="margin-top:12px; font-weight:700; text-align:right;">Total: ${escapeHtml(order.total || '')}</div>
      <div style="margin-top:8px; color:#666;">Order Date: ${formatDateTime12(order.timestamp)}</div>
      <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:12px;">
        <button class="btn inline-print">Print / Save PDF</button>
        <a class="btn ghost" href="receipt.html?orderId=${encodeURIComponent(order.orderId)}&type=${order._type === 'paid' ? 'paid' : 'cod'}" target="_blank" rel="noopener noreferrer">Open in new tab</a>
      </div>
    </div>
  `;
}

/**
 * Renders the receipts list. Each receipt card has a collapsible details area.
 */
function renderReceipts() {
  const receiptsListEl = document.getElementById('receipts-list');
  if (!receiptsListEl) return;
  receiptsListEl.innerHTML = '';

  // Check if user is logged in
  const currentUserData = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
  if (!currentUserData) {
    receiptsListEl.innerHTML = '<p style="text-align:center; color:#666;">You must create an account and login to view your receipts.</p>';
    return;
  }

  const currentUserId = currentUserData.email; // Use email as unique userId
  const paid = JSON.parse(localStorage.getItem('paid_orders') || '[]');
  const cod = JSON.parse(localStorage.getItem('cash_orders') || '[]');

  // Filter by current user only
  const userPaid = paid.filter(o => o.userId === currentUserId);
  const userCod = cod.filter(o => o.userId === currentUserId);

  const all = [
    ...userPaid.map(o => ({ ...o, _type: 'paid' })),
    ...userCod.map(o => ({ ...o, _type: 'cod' }))
  ];

  // Search/filter support: read query from receipts-search input
  const searchEl = document.getElementById('receipts-search');
  const q = searchEl ? (searchEl.value || '').trim().toLowerCase() : '';

  function receiptMatches(order, q) {
    if (!q) return true;
    const parts = [
      order.orderId || '',
      order.payment_reference || '',
      order.name || '',
      order.phone || '',
      order.total || '',
      formatDateTime12(order.timestamp || ''),
      (order.timestamp ? new Date(order.timestamp).getFullYear().toString() : ''),
      (order.timestamp ? new Date(order.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '')
    ].join(' ').toLowerCase();
    return q.split(/\s+/).every(term => parts.includes(term));
  }

  const filtered = all.filter(o => receiptMatches(o, q));

  if (filtered.length === 0) {
    if (q) {
      receiptsListEl.innerHTML = '<p style="text-align:center; color:#666;">No receipts match your search.</p>';
    } else {
      receiptsListEl.innerHTML = '<p style="text-align:center; color:#666;">No receipts found yet. Complete a purchase to see receipts here.</p>';
    }
    return;
  }

  // sort by timestamp desc
  const list = filtered;
  list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  list.forEach(order => {
    const card = document.createElement('div');
    card.className = 'receipt-card';
    card.style.padding = '12px';
    card.style.borderBottom = '1px solid #eee';
    const type = order._type === 'paid' ? 'paid' : 'cod';
    const orderIdEsc = encodeURIComponent(order.orderId || '');
    const dateStr = order.timestamp ? formatDateTime12(order.timestamp) : '';

    card.innerHTML = `
      <div class="receipt-summary" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <div style="font-weight:700;">${escapeHtml(order.orderId)}</div>
          <div style="color:#666; font-size:0.95rem;">${escapeHtml(order.name || '')} • ${escapeHtml(order.phone || '')} • ${escapeHtml(order.email || '')}</div>
          <div style="color:#666; font-size:0.92rem; margin-top:6px;">${type === 'paid' ? 'Paid via Paystack' : 'Cash on Delivery'}${order.delivery_type ? ' • ' + (order.delivery_type === 'pickup' ? 'Pickup' : 'Home Delivery') : ''}</div>
          <div style="color:#666; font-size:0.88rem; margin-top:6px;">${escapeHtml(dateStr)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700; color:#e74c3c;">${escapeHtml(order.total || '')}</div>
          <div style="margin-top:8px;">
            <a class="btn" href="receipt.html?orderId=${orderIdEsc}&type=${type}" target="_blank" rel="noopener noreferrer" style="margin-left:8px;">Open</a>
          </div>
        </div>
      </div>
      <div class="receipt-details" data-order-id="${escapeHtml(order.orderId)}" aria-hidden="true" style="display:none; margin-top:10px;"></div>
    `;

    receiptsListEl.appendChild(card);

    // wire up toggle button and inline print (toggle removed; keep details placeholder for future features)
    const toggleBtn = card.querySelector('.toggle-receipt');
    const detailsEl = card.querySelector('.receipt-details');

    // If a toggle button exists (for backward compatibility), attach handler — otherwise nothing happens.
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        if (!expanded) {
          // Expand: populate details
          detailsEl.innerHTML = renderReceiptHtml(order);
          detailsEl.style.display = 'block';
          detailsEl.setAttribute('aria-hidden', 'false');
          toggleBtn.setAttribute('aria-expanded', 'true');
          toggleBtn.textContent = 'Collapse';

          // Hook up inline print for this expanded block
          const printBtn = detailsEl.querySelector('.inline-print');
          if (printBtn) {
            printBtn.addEventListener('click', () => {
              // Print only the inline receipt content
              const printable = detailsEl.innerHTML;
              const w = window.open('', '_blank', 'width=800,height=600');
              if (!w) {
                alert('Please allow popups to print receipt.');
                return;
              }
              w.document.write(`<html><head><title>Receipt ${escapeHtml(order.orderId)}</title><style>body{font-family:Arial,sans-serif;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{padding:8px;border-bottom:1px solid #eee;}</style></head><body>${printable}<div style="text-align:center;margin-top:12px;"><button onclick="window.print()">Print / Save as PDF</button></div></body></html>`);
              w.document.close();
              w.focus();
            });
          }

        } else {
          // Collapse
          detailsEl.style.display = 'none';
          detailsEl.setAttribute('aria-hidden', 'true');
          toggleBtn.setAttribute('aria-expanded', 'false');
          toggleBtn.textContent = 'Expand';
          detailsEl.innerHTML = '';
        }
      });
    }
  });
}

/**
 * Optional fallback modal-based view kept for compatibility.
 * (Kept minimal - still available but not used for inline expansion)
 */
function viewReceipt(orderId, typeHint) {
  const paid = JSON.parse(localStorage.getItem('paid_orders')) || [];
  const cod = JSON.parse(localStorage.getItem('cash_orders')) || [];
  const order = paid.find(o => o.orderId === orderId) || cod.find(o => o.orderId === orderId);
  if (!order) {
    alert('Receipt not found.');
    return;
  }

  const lines = [];
  lines.push(`<div style="text-align:center; margin-bottom:8px;"><img src="Copilot_20251226_202609.png" alt="Cympet and Co Logo" style="height:48px; display:inline-block;"></div>`);
  lines.push(`<h3>Receipt — ${escapeHtml(order.orderId)}</h3>`);
  const displayMethod = order.payment_method ? order.payment_method : (typeHint === 'paid' ? 'Paid via Paystack' : (order.delivery_type ? (order.delivery_type === 'pickup' ? 'Pickup' : 'Home Delivery') : 'Cash on Delivery'));
  lines.push(`<div style="color:#666; margin-bottom:8px;">${escapeHtml(displayMethod)}</div>`);
  lines.push(`<div><strong>Customer:</strong> ${escapeHtml(order.name || '')}</div>`);
  if (order.phone) lines.push(`<div><strong>Phone:</strong> ${escapeHtml(order.phone)}</div>`);
  if (order.email) lines.push(`<div><strong>Email:</strong> ${escapeHtml(order.email)}</div>`);
  if (order.delivery_type) lines.push(`<div><strong>Delivery Type:</strong> ${escapeHtml(order.delivery_type === 'pickup' ? 'Pickup' : 'Home Delivery')}</div>`);
  if (order.address) lines.push(`<div><strong>Address:</strong> ${escapeHtml(order.address)}</div>`);
  lines.push(`<div style="margin-top:10px;"><strong>Items</strong></div>`);
  lines.push('<table style="width:100%; border-collapse:collapse; margin-top:6px;">');
  lines.push('<thead><tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Item</th><th style="text-align:right; padding:6px; border-bottom:1px solid #eee;">Qty</th><th style="text-align:right; padding:6px; border-bottom:1px solid #eee;">Line Total</th></tr></thead>');
  lines.push('<tbody>');
  if (Array.isArray(order.cart) && order.cart.length) {
    order.cart.forEach(it => {
      const qty = it.quantity || 1;
      const line = it.item_total || it.unit_price || '';
      lines.push(`<tr><td style="padding:6px; border-bottom:1px solid #fafafa;">${escapeHtml(it.name)}</td><td style="padding:6px; text-align:right; border-bottom:1px solid #fafafa;">${qty}</td><td style="padding:6px; text-align:right; border-bottom:1px solid #fafafa;">${escapeHtml(line)}</td></tr>`);
    });
  } else {
    lines.push('<tr><td colspan="3" style="padding:6px;">No items recorded.</td></tr>');
  }
  lines.push('</tbody>');
  lines.push('</table>');
  lines.push(`<div style="margin-top:12px; font-weight:700; text-align:right;">Total: ${escapeHtml(order.total || '')}</div>`);
  lines.push(`<div style="margin-top:8px; color:#666;">Order Date: ${formatDateTime12(order.timestamp)}</div>`);

  if (receiptContent) {
    receiptContent.innerHTML = lines.join('');
    receiptModal.style.display = 'block';
    receiptModal.setAttribute('aria-hidden', 'false');
  } else {
    // fallback: open new tab with receipt.html
    const url = `receipt.html?orderId=${encodeURIComponent(orderId)}&type=${typeHint || (order._type === 'paid' ? 'paid' : 'cod')}`;
    window.open(url, '_blank');
  }
}

// Helper to escape HTML in user-supplied strings used above
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Render specs (object, array, or string) into HTML for the product modal
function renderSpecsHtml(specs) {
  if (!specs) return '';
  if (typeof specs === 'string') return `<div class="specs-text">${escapeHtml(specs)}</div>`;
  if (Array.isArray(specs)) return `<ul class="specs-list">${specs.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`;
  if (typeof specs === 'object') {
    const rows = Object.entries(specs).map(([k,v]) => `<tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee; width:45%;">${escapeHtml(k)}</th><td style="text-align:left; padding:6px; border-bottom:1px solid #eee;">${escapeHtml(String(v))}</td></tr>`).join('');
    return `<table class="specs-table" style="width:100%; border-collapse:collapse; margin-top:6px;">${rows}</table>`;
  }
  return '';
}

// Centralized date/time formatter that ensures 12-hour clock (e.g., "Dec 31, 2025, 2:05 PM")
function formatDateTime12(input) {
  if (!input) return '';
  const d = (input instanceof Date) ? input : new Date(input);
  // Use locale-sensitive formatting with explicit 12-hour option
  const opts = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true };
  try {
    return d.toLocaleString(undefined, opts);
  } catch (e) {
    // Fallback to a simple formatted string
    const hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    const hr12 = ((hh + 11) % 12) + 1;
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${hr12}:${mm} ${ampm}`;
  }
}

// Helpers to persist receipts locally
function savePaidOrder(order) {
  try {
    const paidOrders = JSON.parse(localStorage.getItem('paid_orders') || '[]');
    paidOrders.push(order);
    localStorage.setItem('paid_orders', JSON.stringify(paidOrders));
  } catch (e) {
    console.error('Error saving paid order locally', e);
  }
}

function saveCODOrder(order) {
  try {
    const codOrders = JSON.parse(localStorage.getItem('cash_orders') || '[]');
    codOrders.push(order);
    localStorage.setItem('cash_orders', JSON.stringify(codOrders));
  } catch (e) {
    console.error('Error saving COD order locally', e);
  }
}

// Prevent initial auto-scroll to anchors on page load and ensure receipts render
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

document.addEventListener('DOMContentLoaded', () => {
  // If the page was opened with a hash (e.g., /index.html#products), browsers typically jump to it.
  // Reset scroll to top immediately and remove the hash so the page doesn't auto-scroll.
  if (location.hash) {
    // Jump to the top immediately (no animation) to avoid visible jump
    window.scrollTo(0, 0);
    // Remove the hash from the URL without creating a history entry
    history.replaceState(null, '', location.pathname + location.search);
  }

  renderReceipts();

  // On load, restore any pending delivery payment from previous session
  try {
    const pending = JSON.parse(localStorage.getItem('pending_delivery_payment') || 'null');
    // Only restore pending payment state if it matches the current cart snapshot
    const cartSnapshot = JSON.stringify(cart || {});
    if (pending && pending._cartSnapshot === cartSnapshot) {
      deliveryPaymentConfirmed = true;
      deliveryPaymentInfo = pending;
    }
  } catch (e) { /* ignore */ }

  const receiptsClear = document.getElementById('receipts-search-clear');
  if (receiptsSearch) {
    receiptsSearch.addEventListener('input', () => { renderReceipts(); });
    receiptsSearch.addEventListener('keydown', (e) => { if (e.key === 'Escape') { receiptsSearch.value = ''; renderReceipts(); receiptsSearch.blur(); } });
  }
  if (receiptsClear) {
    receiptsClear.addEventListener('click', () => { if (receiptsSearch) { receiptsSearch.value = ''; receiptsSearch.focus(); renderReceipts(); } });
  }
  // Ensure products are ordered according to saved preference on initial load
  try { const mode = getProductSortMode(); if (typeof sortProductGrid === 'function') sortProductGrid(mode); } catch (e) {}
});




// Simple product search — filters product cards by title and description.
// Include this file after your main script.js or merge the logic into it.

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const productCards = () => Array.from(document.querySelectorAll('.product-card'));
  const productsSection = document.querySelector('#products .product-grid');
  
  // Initialize favorite stars on products
  try {
    addFavoriteStarToProducts();
  } catch (e) { /* ignore */ }
  
  // Initialize sort select and sync state
  const sortSelect = document.getElementById('sort-select');
  try {
    const cur = getProductSortMode();
    if (sortSelect) {
      sortSelect.value = cur;
      sortSelect.addEventListener('change', () => {
        setProductSortMode(sortSelect.value);
      });
    }
    // set visual icon and apply sorting immediately
    setProductSortMode(cur);
  } catch (e) { /* ignore */ }
  // Track whether user has an active search so we can restore scroll when cleared
  let isSearching = false;
  let searchPriorScroll = null;
  let lastSearchQuery = '';

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

  // Product sort helpers and sort function (modes: 'az','za','price-asc','price-desc')
  function getProductSortMode() {
    // Backwards compatibility for old 'product_sort_order'
    const legacy = localStorage.getItem('product_sort_order');
    if (legacy === 'asc') return 'az';
    if (legacy === 'desc') return 'za';
    return localStorage.getItem('product_sort_mode') || 'az';
  }

  function setProductSortMode(mode) {
    const valid = ['az', 'za', 'price-asc', 'price-desc'];
    if (!valid.includes(mode)) mode = 'az';
    localStorage.setItem('product_sort_mode', mode);
    const select = document.getElementById('sort-select');
    const icon = document.getElementById('sort-icon');
    if (select) select.value = mode;
    if (icon) {
      if (mode === 'az') icon.textContent = 'A→Z';
      else if (mode === 'za') icon.textContent = 'Z→A';
      else if (mode === 'price-asc') icon.textContent = '₦↑';
      else icon.textContent = '₦↓';
    }
    sortProductGrid(mode);
  }

  function parsePriceFromCard(card) {
    // Try data-price attribute first
    const dp = card.getAttribute('data-price');
    if (dp) {
      const n = Number(String(dp).replace(/[^0-9.-]+/g, ''));
      if (!Number.isNaN(n)) return n;
    }
    // fallback: search for price-like patterns in text
    const txt = (card.textContent || '');
    const m = txt.match(/(?:₦|NGN|NGN\s*|ngn|₦\s*|\$|£|€)?\s*([0-9]{1,3}(?:[,\s][0-9]{3})*(?:\.[0-9]+)?)/);
    if (m && m[1]) {
      const n = Number(m[1].replace(/[, ]+/g, ''));
      if (!Number.isNaN(n)) return n;
    }
    return null;
  }

  function sortProductGrid(mode) {
    const m = mode || getProductSortMode();
    const selectors = ['#products .product-grid', '#category-products'];
    selectors.forEach(sel => {
      const grid = document.querySelector(sel);
      if (!grid) return;
      const cards = Array.from(grid.querySelectorAll('.product-card'));
      if (!cards.length) return;

      if (m === 'az' || m === 'za') {
        cards.sort((a, b) => {
          const ta = (a.querySelector('h3')?.textContent || '').trim().toLowerCase();
          const tb = (b.querySelector('h3')?.textContent || '').trim().toLowerCase();
          const cmp = ta.localeCompare(tb, undefined, { numeric: true, sensitivity: 'base' });
          return m === 'az' ? cmp : -cmp;
        });
      } else {
        // price sort
        const asc = m === 'price-asc';
        cards.sort((a, b) => {
          const pa = parsePriceFromCard(a);
          const pb = parsePriceFromCard(b);
          const va = (pa === null) ? (asc ? Infinity : -Infinity) : pa;
          const vb = (pb === null) ? (asc ? Infinity : -Infinity) : pb;
          return asc ? (va - vb) : (vb - va);
        });
      }

      cards.forEach(c => grid.appendChild(c));
    });
    
    // Re-add favorite stars after sorting
    try {
      addFavoriteStarToProducts();
    } catch (e) { /* ignore */ }
  }

  function performSearch() {
    const qRaw = (searchInput.value || '').trim();
    const q = qRaw.toLowerCase();
    const cards = productCards();

    // If clearing the search, restore UI and previous scroll position
    if (!q) {
      cards.forEach(c => c.style.display = '');
      hideNoResults();
      // Clear any search-related hash so stale links aren't left behind
      try { if ('replaceState' in history) history.replaceState(null, '', location.pathname + location.search); } catch (e) {}

      // Remove any active category selection and clear category results so Featured reappears
      try {
        document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
        const catArea = document.getElementById('category-products');
        if (catArea) catArea.innerHTML = '';
      } catch (e) {}

      // Scroll to Featured Products header to keep the user focused on featured items
      const featured = document.getElementById('featured-products');
      if (featured) {
        try { featured.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (err) { window.scrollTo(0, featured.getBoundingClientRect().top + window.pageYOffset - 20); }
      }

      // reset search tracking
      isSearching = false;
      searchPriorScroll = null;
      lastSearchQuery = '';
      // Restore alphabetical ordering when search is cleared
      try { sortProductGrid(); } catch (e) { /* ignore */ }
      return;
    }

    // Save the user's position the first time they run a search so we can return them
    if (!isSearching) {
      isSearching = true;
      searchPriorScroll = window.pageYOffset || window.scrollY || 0;
      lastSearchQuery = qRaw;
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

    if (!foundAny) {
      showNoResults();
      // Remove search-related hash since there are no matches
      try { if ('replaceState' in history) history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    } else {
      hideNoResults();

      // Scroll the products section into view when there are matching results
      const productsRoot = document.getElementById('products');
      if (productsRoot) {
        try {
          productsRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (err) {
          // fallback for older browsers
          window.scrollTo(0, productsRoot.getBoundingClientRect().top + window.pageYOffset - 20);
        }
      }

      // Store a shareable hash with the search query (replaceState doesn't trigger navigation)
      try {
        const encoded = encodeURIComponent(qRaw);
        const newHash = '#products?search=' + encoded;
        if ('replaceState' in history) history.replaceState(null, '', location.pathname + location.search + newHash);
      } catch (e) {}
    }
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
        // Close mobile menu after clicking (cleanup drawer/backdrop and return focus)
        if (typeof navUl !== 'undefined' && navUl) {
            navUl.classList.remove('show');
            try { navUl.setAttribute('aria-hidden', 'true'); } catch (err) {}
            const closeBtn = navUl.querySelector('.nav-close');
            if (closeBtn) closeBtn.remove();
        }
        const navBackdrop = document.getElementById('nav-backdrop');
        if (navBackdrop) {
            navBackdrop.classList.remove('show');
            setTimeout(() => { if (navBackdrop.parentNode) navBackdrop.parentNode.removeChild(navBackdrop); }, 260);
        }
        if (typeof hamburger !== 'undefined' && hamburger) {
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            try { hamburger.innerHTML = '☰'; hamburger.setAttribute('aria-label', 'Open menu'); hamburger.focus(); } catch (e) {}
        }
        document.body.classList.remove('nav-open');
    });
});

// Hamburger menu toggle
const hamburger = document.getElementById('hamburger');
const navUl = document.querySelector('nav ul');

if (hamburger && navUl) {
    // Prevent event propagation on hamburger click to avoid closing immediately
    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = navUl.classList.toggle('show');
        try { navUl.setAttribute('aria-hidden', String(!isOpen)); } catch (e) {}
        hamburger.classList.toggle('active', isOpen);
        hamburger.setAttribute('aria-expanded', String(!!isOpen));

        // change hamburger icon to X when open, revert when closed
        try {
            hamburger.innerHTML = isOpen ? '&times;' : '☰';
            hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        } catch (e) {}

        // Show/hide mobile search but do NOT automatically focus it (prevents keyboard on mobile)
        const mobileSearchLi = document.querySelector('.mobile-search');
        const mobileInput = document.getElementById('mobile-search-input');
        if (mobileSearchLi) mobileSearchLi.setAttribute('aria-hidden', String(!isOpen));
        if (!isOpen && mobileInput) {
            // blur any lingering focus when closing the menu
            try { mobileInput.blur(); } catch (e) {}
        }
    }, { passive: false });

    // Close menu when clicking on a nav link
    const navLinks = navUl.querySelectorAll('li a, li button');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Check if it's a dropdown toggle (account button)
            if (link.classList.contains('dropdown-toggle')) {
                e.preventDefault();
                e.stopPropagation();
                // Let the dropdown menu toggle handle it - don't close the hamburger menu
                return;
            }
            
            // Check if it's a hash link (navigation within same page)
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                navUl.classList.remove('show');
                try { navUl.setAttribute('aria-hidden', 'true'); } catch (err) {}
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                try { hamburger.innerHTML = '☰'; hamburger.setAttribute('aria-label', 'Open menu'); } catch (err) {}
            }
        });
    });

    // Close menu when clicking outside of it
    document.addEventListener('click', (e) => {
        if (!e.target.closest('nav') && !e.target.closest('.hamburger')) {
            if (navUl.classList.contains('show')) {
                navUl.classList.remove('show');
                try { navUl.setAttribute('aria-hidden', 'true'); } catch (err) {}
                hamburger.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
                try { hamburger.innerHTML = '☰'; hamburger.setAttribute('aria-label', 'Open menu'); } catch (err) {}
            }
        }
    });

    // add ESC to close menu and remove active state
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navUl.classList.contains('show')) {
            navUl.classList.remove('show');
            try { navUl.setAttribute('aria-hidden', 'true'); } catch (err) {}
            hamburger.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
            try { hamburger.innerHTML = '☰'; hamburger.setAttribute('aria-label', 'Open menu'); } catch (err) {}
        }
    });
}

// Mobile search: copy the query to the main search input and trigger existing search behavior
const mobileSearchBtn = document.getElementById('mobile-search-btn');
const mobileSearchInput = document.getElementById('mobile-search-input');
if (mobileSearchBtn && mobileSearchInput) {
    mobileSearchBtn.addEventListener('click', () => {
        const q = mobileSearchInput.value.trim();
        const mainInput = document.getElementById('search-input');
        const mainBtn = document.getElementById('search-btn');
        if (mainInput) mainInput.value = q;
        if (mainBtn) mainBtn.click();
        // Close menu after searching on mobile (cleanup)
        if (navUl) {
            navUl.classList.remove('show');
            try { navUl.setAttribute('aria-hidden', 'true'); } catch (err) {}
            try { hamburger.innerHTML = '☰'; hamburger.setAttribute('aria-label', 'Open menu'); hamburger.classList.remove('active'); hamburger.setAttribute('aria-expanded', 'false'); } catch (e) {}
        }
    });
    mobileSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            mobileSearchBtn.click();
        }
    });

    // When the mobile search input changes, mirror it to the main input and auto-refresh when emptied
    mobileSearchInput.addEventListener('input', () => {
        const q = mobileSearchInput.value.trim();
        const mainInput = document.getElementById('search-input');
        const mainBtn = document.getElementById('search-btn');
        if (mainInput) mainInput.value = q;
        if (!q && mainBtn) {
            // trigger the shared search handler to show all products and scroll to featured
            setTimeout(() => mainBtn.click(), 0);
        }
    });

    // Allow Escape to clear mobile input and refresh
    mobileSearchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            mobileSearchInput.value = '';
            const mainInput = document.getElementById('search-input');
            const mainBtn = document.getElementById('search-btn');
            if (mainInput) mainInput.value = '';
            if (mainBtn) mainBtn.click();
        }
    });
}

// Paystack initialization (replace with your own public key if needed)
const paystackPublicKey = 'pk_test_593e1983178a6edb96ece69a294b43f33ac1c1f6';

// Main bank details (used for bank transfer instructions and copying)
const BANK_ACCOUNT_NUMBER = '2008885373';
const BANK_NAME = 'First Bank of Nigeria';
const BANK_ACCOUNT_NAME = 'CYMPET ENTERPRISES CO. NIGERIA';

// Show bank instructions panel for a given context ('checkout' | 'delivery')


function hideBankInstructions(context) {
    const containerId = (context === 'delivery') ? 'delivery-bank-instructions' : 'checkout-bank-instructions';
    const container = document.getElementById(containerId);
    if (!container) return;
    container.style.display = 'none';
}

function copyToClipboard(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const prev = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = prev, 1500);
        }).catch(() => {
            fallbackCopy(text, btn);
        });
    } else {
        fallbackCopy(text, btn);
    }
}

function fallbackCopy(text, btn) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        const prev = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = prev, 1500);
    } catch (e) {
        alert('Copy not supported in this browser. Account number: ' + text);
    }
    ta.remove();
}

// Attach copy buttons once DOM is ready
// (Account-copy buttons removed — keep this placeholder for future copy handlers)
document.addEventListener('DOMContentLoaded', () => {
    // No account copy handlers attached as per request
});

// Build "Shop by Category" area (keeps Featured Products unchanged)
document.addEventListener('DOMContentLoaded', function() {
  try {
    const productsGrid = document.querySelector('#products .product-grid');
    if (!productsGrid) return;

    const originalCards = Array.from(productsGrid.querySelectorAll('.product-card'));
    const categories = [
      { name: 'Cooling & Fans', test: t => /\b(?:fan|fans|ceiling fan|ceiling fans|standing fan|standing fans|wall fan|wall fans|air conditioner|air conditioners|air)\b/i.test(t) },
      { name: 'Kitchen Appliances', test: t => /\b(blender|freezer|refrigerator|fridge|microwave|oven|kettle|toaster)\b/i.test(t) },
      { name: 'Power & Generators', test: t => /\b(generator|generators|stabilizer|stabilizers|inverter)\b/i.test(t) },
      { name: 'Audio & Music', test: t => /\b(sound|microphone|microphones|speaker|sound system|soundbar)\b/i.test(t) },
      { name: 'Television and Video', test: t => /\b(tv|television|smart tv|smart television|led television|lcd television|oled television)\b/i.test(t) },
      { name: 'Computing & Accessories', test: t => /\b(laptop|computer|pc|keyboard|mouse|printer)\b/i.test(t) }
    ];

    const map = new Map();
    categories.forEach(c => map.set(c.name, []));

    originalCards.forEach(card => {
      const title = card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : '';
      let matched = false;
      for (const c of categories) {
        if (c.test(title)) { map.get(c.name).push(card); matched = true; break; }
      }
      if (!matched) map.get('Kitchen Appliances').push(card);
    });

    const barInner = document.getElementById('categories-inner');
    const productsArea = document.getElementById('category-products');
    if (!barInner || !productsArea) return;

    barInner.innerHTML = '';
    const icons = {
      'Cooling & Fans': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><g transform="translate(12 12)"><rect x="-1" y="-6" width="2" height="6" rx="1"/><rect x="-1" y="-6" width="2" height="6" rx="1" transform="rotate(120)"/><rect x="-1" y="-6" width="2" height="6" rx="1" transform="rotate(240)"/></g></svg>
      `,
      'Kitchen Appliances': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="18" height="8" rx="1"/><rect x="7" y="4" width="10" height="3" rx="1"/></svg>
      `,
      'Power & Generators': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10v4a5 5 0 0 0 10 0v-4h-2v4a3 3 0 0 1-6 0v-4z"/><rect x="9" y="2" width="2" height="3"/><rect x="13" y="2" width="2" height="3"/></svg>
      `,
      'Audio & Music': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/></svg>
      `,
      'Television and Video': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="1"/><path d="M8 21h8v-2H8z"/></svg>
      `,
      'Computing & Accessories': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="1"/><rect x="1" y="19" width="22" height="2"/></svg>
      `
    };

    const available = Array.from(map.entries()).filter(([k,v]) => v && v.length > 0);

    // helper to render a category into the productsArea. If scroll === true, the view will scroll to the category area.
    function renderCategory(cards, btn, scroll) {
      // active state
      document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
      if (btn) btn.classList.add('active');

      // render cards for this category (clone so featured remains unchanged)
      productsArea.innerHTML = '';
      if (!cards || cards.length === 0) {
        productsArea.innerHTML = '<div class="category-empty">No products in this category.</div>';
        return;
      }
      const grid = document.createElement('div');
      grid.className = 'category-grid-full';

      cards.forEach(orig => {
        const clone = orig.cloneNode(true);

        // ensure add-to-cart on clones works (create if absent)
        let addBtn = clone.querySelector('button.add-now');
        if (!addBtn) {
          addBtn = document.createElement('button');
          addBtn.className = 'btn add-now';
          addBtn.textContent = 'Add to Cart';
          addBtn.style.margin = '12px';
          clone.appendChild(addBtn);
        }
        // bind add-to-cart
        addBtn.addEventListener('click', function(e) { e.stopPropagation(); const t = clone.querySelector('h3') ? clone.querySelector('h3').textContent.trim() : ''; if (t) addToCart(t); });

        // ensure image/lightbox works on clones
        const img = clone.querySelector('.product-image img');
        if (img) {
          img.addEventListener('click', function(e) { e.stopPropagation(); openImageModal(this.src); });
          const container = clone.querySelector('.product-image');
          if (container) container.addEventListener('click', function(e) { if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === 'img') return; e.stopPropagation(); openImageModal(img.src); });
        }

        // clicking clone opens product modal
        clone.addEventListener('click', function(e) {
          if (e.target.classList.contains('add-now') || e.target.classList.contains('zoom-icon')) return;
          const title = this.querySelector('h3') ? this.querySelector('h3').textContent.trim() : '';
          const description = this.querySelector('p') ? this.querySelector('p').textContent.trim() : '';
          const imageSrc = this.querySelector('img') ? this.querySelector('img').src : '';

          document.getElementById('modal-title').textContent = title;
          const details = getProductDetails(title || '');
          document.getElementById('modal-image').src = details.image || imageSrc;
          document.getElementById('modal-description').textContent = description || details.description || '';
          const modalPriceEl = document.getElementById('modal-price');
          if (modalPriceEl) modalPriceEl.textContent = details.priceStr || '';

          // Show specs if available
          const specsEl = document.getElementById('modal-specs');
          if (specsEl) {
            if (details.specs) {
              specsEl.innerHTML = renderSpecsHtml(details.specs);
              specsEl.style.display = 'block';
            } else {
              specsEl.innerHTML = '';
              specsEl.style.display = 'none';
            }
          }

          document.getElementById('product-details').style.display = 'block';
          document.getElementById('modal-variants').style.display = 'none';
          modal.style.display = 'block';
        });

        // add favorite star to clone if function exists
        try {
          const title = clone.querySelector('h3') ? clone.querySelector('h3').textContent.trim() : '';
          if (title) {
            const starBtn = document.createElement('button');
            starBtn.className = 'favorite-star';
            starBtn.type = 'button';
            starBtn.textContent = favorites[title] ? '⭐' : '☆';
            starBtn.style.cssText = 'position:absolute; top:12px; right:12px; background:rgba(255,255,255,0.9); border:1px solid rgba(0,0,0,0.1); border-radius:50%; width:40px; height:40px; font-size:20px; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center;';
            starBtn.addEventListener('click', (ev) => { ev.stopPropagation(); toggleFavorite(title); });
            const imgContainer = clone.querySelector('.product-image');
            if (imgContainer) {
              imgContainer.style.position = 'relative';
              imgContainer.appendChild(starBtn);
            }
          }
        } catch (e) { /* ignore */ }

        grid.appendChild(clone);
      });

      productsArea.appendChild(grid);
      if (scroll) {
        try {
          // Scroll so the first product fits nicely below the fixed header
          const firstCard = grid.querySelector('.product-card') || grid;
          const header = document.querySelector('header');
          const headerHeight = header ? header.offsetHeight : 0;
          const extraPadding = 12; // px spacing below header
          const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          const targetY = Math.max(0, window.pageYOffset + firstCard.getBoundingClientRect().top - headerHeight - extraPadding);
          window.scrollTo({ top: targetY, behavior: prefersReduced ? 'auto' : 'smooth' });

          // For keyboard users, make the first card focusable and focus it
          firstCard.setAttribute('tabindex', '-1');
          try { firstCard.focus(); } catch (err) { /* ignore */ }
        } catch (e) { }
      }
    }

    available.forEach(([name, cards], idx) => {
      const btn = document.createElement('button');
      btn.className = 'category-item';
      btn.type = 'button';
      btn.dataset.name = name;
      btn.innerHTML = `<div class="icon">${icons[name] || '📁'}</div><div class="label">${name}</div>`;

      btn.addEventListener('click', () => renderCategory(cards, btn, true));

      barInner.appendChild(btn);
    });

    // Do not auto-open any category on load. Show a small placeholder prompting selection.
    productsArea.innerHTML = '<div class="category-placeholder">Click a category to view products.</div>'; 

  } catch (err) {
    console.error('Error building categories:', err);
  }
});

// Web3Forms API key (used for sending order summary emails)
const WEB3FORMS_KEY = '22b0c187-7f5e-48e5-91cf-d3481d9cd44f';

// -------------------- Helpers --------------------
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
// Normalize phone numbers to local 0XXXXXXXXXX format when possible
function normalizePhone(phone) {
  if (phone === undefined || phone === null) return '';
  let p = String(phone || '').replace(/[\s\-\(\)]/g, '');
  if (p.startsWith('+234')) {
    p = '0' + p.slice(4);
  } else if (p.startsWith('234')) {
    p = '0' + p.slice(3);
  } else if (/^[1-9]\d{9}$/.test(p)) {
    // 10 digits without leading 0 -> assume local number, add leading 0
    p = '0' + p;
  }
  return p;
}

function isValidPhone(phone) {
  const p = normalizePhone(phone);
  // Accept exactly 11 digits starting with 0 (Nigerian local format)
  return /^0\d{10}$/.test(p);
}

// Migrate stored phone numbers in localStorage to normalized 0XXXXXXXXXX format
function migrateStoredPhones() {
  const keys = ['contacts', 'paid_orders', 'cash_orders', 'customerInfo'];
  keys.forEach(k => {
    const raw = localStorage.getItem(k);
    if (!raw) return;
    try {
      let data = JSON.parse(raw);
      let changed = false;
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item && item.phone && typeof item.phone === 'string') {
            const norm = normalizePhone(item.phone);
            if (norm && norm !== item.phone) { item.phone = norm; changed = true; }
          }
        });
      } else if (data && typeof data === 'object') {
        if (data.phone && typeof data.phone === 'string') {
          const norm = normalizePhone(data.phone);
          if (norm && norm !== data.phone) { data.phone = norm; changed = true; }
        }
      }
      if (changed) localStorage.setItem(k, JSON.stringify(data));
    } catch (e) {
      // ignore malformed data
    }
  });
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

        // Basic validation
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

        // Disable submit button while sending
        const btn = contactForm.querySelector('button[type="submit"]');
        const prevText = btn ? btn.textContent : 'Send Message';
        if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

        // Prepare payload (FormData preserves file inputs and encoding)
        const endpoint = contactForm.action || 'https://api.web3forms.com/submit';
        const payload = new FormData(contactForm);
        // Add a timestamp for our records
        payload.append('timestamp', new Date().toISOString());

        fetch(endpoint, {
            method: 'POST',
            body: payload
        })
        .then(response => response.json())
        .then(data => {
            // Web3forms returns { success: true, message: "Email sent" ... }
            if (data && data.success) {
                // store a copy locally as well
                const contactData = { name, email, phone, subject, message, timestamp: new Date().toISOString(), remoteResponse: data };
                let contacts = JSON.parse(localStorage.getItem('contacts')) || [];
                contacts.push(contactData);
                localStorage.setItem('contacts', JSON.stringify(contacts));

                contactForm.reset();
                showFormStatus('Message sent! You should receive a confirmation email shortly.', 'success');
                console.log('Contact form submitted (remote):', data);
            } else {
                const errMsg = (data && data.message) ? data.message : 'Failed to send message. Please try again later.';
                showFormStatus('Send failed: ' + errMsg, 'error');
                console.error('Web3Forms error:', data);
            }
        })
        .catch(err => {
            showFormStatus('Send failed: ' + (err.message || err), 'error');
            console.error('Contact form send error:', err);
        })
        .finally(() => {
            if (btn) { btn.disabled = false; btn.textContent = prevText; }
        });
    });
}
function showFormStatus(message, type) {
    if (!formStatus) return;
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
        { name: 'LG Double Door', description: 'Energy-efficient double door fridge', price: '₦250,000', emoji: '🧊', unit_price: 250000, stock: 4 },
        { name: 'Samsung Side-by-Side', description: 'Large capacity side-by-side refrigerator', price: '₦450,000', emoji: '🧊', unit_price: 450000, stock: 2 },
        { name: 'Whirlpool Single Door', description: 'Compact single door refrigerator', price: '₦150,000', emoji: '🧊', unit_price: 150000, stock: 10 }
    ],
    'Freezer': [
        { name: 'Haier Chest Freezer', description: 'Large capacity chest freezer', price: '₦180,000', emoji: '❄️', unit_price: 180000, stock: 5 },
        { name: 'LG Upright Freezer', description: 'Upright freezer with multiple compartments', price: '₦220,000', emoji: '❄️', unit_price: 220000, stock: 3 },
        { name: 'Samsung Deep Freezer', description: 'Deep freezer for long-term storage', price: '₦200,000', emoji: '❄️', unit_price: 200000, stock: 4 }
    ],
    'Sound Systems': [
        { name: 'Sony 5.1 Home Theatre', description: 'Complete 5.1 surround sound', price: '₦150,000', emoji: '🎬', unit_price: 150000, stock: 6 }
    ],
    'Air Conditioners': [
        { name: 'LG Split AC 1.5HP', description: 'Energy-saving split AC unit', price: '₦100,000', emoji: '❄️', unit_price: 100000, stock: 8 },
        { name: 'Samsung Window AC 1HP', description: 'Compact window AC unit', price: '₦80,000', emoji: '❄️', unit_price: 80000, stock: 5 }
    ]
    // Add more variants if needed
};

// Catalog entries used when user adds the displayed product card items directly to cart
const productCatalog = {
    'Hisense Air Conditioner': { name: 'Air Conditioners', description: 'Energy-saving split and window AC units', priceStr: '₦100', unit_price: 100, stock: 8 },
    'Kenwood Blender': { name: 'Blenders', description: 'High-performance kitchen blenders', priceStr: '₦60,000', unit_price: 60000, stock: 12, specs: { 'Capacity': '1.5 L', 'Warranty':'2years',  'Power': '800W', 'Speeds': '3' }, image: 'https://www.bing.com/th/id/OIP.388XH-VhQEqoNURALL__qAHaMI?w=160&h=211&c=8&rs=1&qlt=90&o=6&cb=ucfimg1&pid=3.1&rm=2&ucfimg=1' },
    'Ceiling Fans': { name: 'Ceiling Fans', description: 'Quiet, energy-efficient ceiling fans', priceStr: '₦35,000', unit_price: 35000, stock: 18 },
    'Elepaq Constant Generators': { name: 'Elepaq Constant Generators', description: 'Reliable petrol/diesel generators', priceStr: '₦380,000', unit_price: 380000, stock: 6 },
    'Freezer': { name: 'Freezer', description: 'Chest and upright freezers', priceStr: '₦180,000', unit_price: 180000, stock: 10 },
    'Sound Systems': { name: 'Sound Systems', description: 'Home theatre systems & soundbars', priceStr: '₦150,000', unit_price: 150000, stock: 6 },
    'Microphones': { name: 'Microphones', description: 'Wired and wireless microphones', priceStr: '₦45,000', unit_price: 45000, stock: 15 },
    'Rechargeable Standing Fans': { name: 'Rechargeable Standing Fans', description: 'Battery powered standing fans', priceStr: '₦35,000', unit_price: 35000, stock: 9 },
    'Refrigerator': { name: 'Refrigerator', description: 'Single & double-door refrigerators', priceStr: '₦250,000', unit_price: 250000, stock: 7 },
    'Standing Fans': { name: 'Standing Fans', description: 'Adjustable-height standing fans', priceStr: '₦25,000', unit_price: 25000, stock: 20 },
    'Stabilizers': { name: 'Stabilizers', description: 'Voltage stabilizers', priceStr: '₦30,000', unit_price: 30000, stock: 14 },
    'Sumec Firman Generators': { name: 'Sumec Firman Generators', description: 'Portable & industrial generators', priceStr: '₦350,000', unit_price: 350000, stock: 5 },
    'Wall Fans': { name: 'Wall Fans', description: 'Wall-mounted fans', priceStr: '₦30,000', unit_price: 30000, stock: 11 },
    'Elepaq Constant Generator SV6800E2': { name: 'Elepaq Constant Generator SV6800E2', description: 'Reliable petrol/diesel generators', priceStr: '₦380,000', unit_price: 380000, stock: 6 },
    'Hisense Microwave 20 Litres': { name: 'Hisense Microwave 20 Litres', description: '20-litre microwave oven', priceStr: '₦45,000', unit_price: 45000, stock: 12, specs: { 'Capacity': '20 Litres', 'Power': '1000W', 'Features': 'Auto-rotation, 10 power levels, Child lock', 'Controls': 'Touch panel with timer', 'Warranty': '1 year' } },
    'Elepaq Constant Generator SV2200': { name: 'Elepaq Constant Generator SV2200', description: 'Reliable petrol/diesel generators', priceStr: '₦380,000', unit_price: 380000, stock: 6, specs: { 'Fuel Type': 'Petrol', 'Capacity Range': '2.2kVA', 'Start Type': 'Recoil start', 'Features': 'Oil alert, Voltage regulator, AVR in some models', 'Warranty': '1 year' } },
    'Elepaq Constant Generator EC5800CX': { name: 'Elepaq Constant Generator EC5800CX', description: 'Reliable petrol/diesel generators', priceStr: '₦150,000', unit_price: 150000, stock: 10, specs: { 'Fuel Type': 'Diesel', 'Capacity Range': '1.2kVA', 'Start Type': 'Recoil start', 'Features': 'Oil alert, Voltage regulator', 'Warranty': '1 year' } },
    'Sumec Firman Generator SPG2900': { name: 'Sumec Firman Generator SPG2900', description: 'Portable & industrial generators', priceStr: '₦350,000', unit_price: 350000, stock: 5, specs: { 'Fuel Type': 'Petrol', 'Capacity Range': '1.0kVA', 'Start Type': 'Recoil start', 'Features': 'Oil alert, Voltage regulator', 'Warranty': '1 year' } },
    'Sumec Firman Generator SPG3000 Manual': { name: 'Sumec Firman Generator SPG3000 Manual', description: 'Portable & industrial generators', priceStr: '₦400,000', unit_price: 400000, stock: 4, specs: { 'Fuel Type': 'Petrol', 'Capacity Range': '2.2kVA', 'Start Type': 'Recoil start', 'Features': 'Oil alert, Voltage regulator, AVR', 'Warranty': '1 year' } },
    'LG 43\' Smart Television': { name: "LG 43' Smart Television", description: "43-inch Smart LED TV — Smart apps, WiFi" , priceStr: '₦185,000', unit_price: 185000, stock: 3, specs: { 'Screen Size': '43 inch', 'Resolution': '1920x1080 (Full HD)', 'Smart TV': 'Yes', 'WiFi': 'Built-in' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/45/0364104/1.jpg?5586' },
    'Elepaq Constant Generator SV22000E2': { name: "Elepaq Constant Generator SV22000E2", description: "Reliable petrol/diesel generators", priceStr: "₦2,500,000", unit_price: 2500000, stock: 1 },
    'Elepaq Constant Generator SV6800E2': { name: "Elepaq Constant Generator SV6800E2", description: "Reliable petrol/diesel generators", priceStr: "₦800,000", unit_price: 800000, stock: 2 },
    'Snowsea Freezer BD-178': { name: "Snowsea Freezer BD-178", description: "178-litre chest freezer", priceStr: "₦220,000", unit_price: 220000, stock: 7, specs: { 'Capacity': '178 Litres', 'Type': 'Chest Freezer', 'Energy Rating': '4-star', 'Defrosting': 'Manual', 'Warranty': '1 year' }, image: 'https://tse3.mm.bing.net/th/id/OIP.wSRj1sgYRKuDgiV9wEgGhgAAAA?rs=1&pid=ImgDetMain&o=7&rm=3' },
    'Snowsea Freezer BD-208': { name: "Snowsea Freezer BD-208", description: "208-litre upright freezer", priceStr: "₦340,000", unit_price: 340000, stock: 5, specs: { 'Capacity': '208 Litres', 'Type': 'Upright Freezer', 'Energy Rating': '4-star', 'Defrosting': 'Manual', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/87/194761/1.jpg?5262' },
    'Snowsea Freezer BD-370': { name: "Snowsea Freezer BD-370", description: "370-litre upright freezer", priceStr: "₦390,000", unit_price: 390000, stock: 3, specs: { 'Capacity': '370 Litres', 'Type': 'Upright Freezer', 'Energy Rating': '4-star', 'Defrosting': 'Manual', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/87/194761/1.jpg?5262' },
    'LG Sound System': { name: "LG Sound System", description: "Powerful home theatre sound system", priceStr: "₦150,000", unit_price: 150000, stock: 6, specs: { 'Channels': '5.1', 'Power Output': '1000W', 'Connectivity': 'Bluetooth, HDMI, Optical' }, image: 'https://ng.jumia.is/unsafe/fit-in/680x680/filters:fill(white)/product/90/422308/1.jpg?2431' },
    'Elepaq Constant Generator SV6800': { name: "Elepaq Constant Generator SV6800", description: "Reliable petrol/diesel generators", priceStr: "₦600,000", unit_price: 600000, stock: 3 },
    'Kenwood Blender': { name: "Kenwood Blender", description: "High-performance kitchen blender", priceStr: "₦60,000", unit_price: 60000, stock: 12, specs: { 'Capacity': '1.5 L', 'Power': '800W', 'Speeds': '3', 'Blades': 'Stainless steel', 'Warranty': '2 years' }, image: 'https://tse4.mm.bing.net/th/id/OIP.OUde7dLqbbII2iOvtur-YQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' },
    'Maxi Microwave 20 Litres': { name: "Maxi Microwave 20 Litres", description: "20-litre microwave oven", priceStr: "₦40,000", unit_price: 40000, stock: 15, specs: { 'Capacity': '20 Litres', 'Power': '700W', 'Features': 'Auto-rotation, 8 power levels, Child lock', 'Controls': 'Dial with timer', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/87/8785814/1.jpg?6115' },
    'Snowsea Freezer BD-370': { name: "Snowsea Freezer BD-370", description: "370-litre upright freezer", priceStr: "₦200,000", unit_price: 200000, stock: 3, specs: { 'Capacity': '370 Litres', 'Type': 'Upright Freezer', 'Energy Rating': '4-star', 'Defrosting': 'Manual', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/29/0258353/1.jpg?1892' },
    'Snowsea Freezer BD-208': { name: "Snowsea Freezer BD-208", description: "208-litre upright freezer", priceStr: "₦140,000", unit_price: 140000, stock: 5, specs: { 'Capacity': '208 Litres', 'Type': 'Upright Freezer', 'Energy Rating': '4-star', 'Defrosting': 'Manual', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/59/5602573/1.jpg?9413' },
    'Sumec Firman Generator ECO-10990ES': { name: "Sumec Firman Generator ECO-10990ES", description: "Portable & industrial generators", priceStr: "₦1,200,000", unit_price: 1200000, stock: 2, specs: { 'Fuel Type': 'Diesel', 'Capacity Range': '9kVA', 'Start Type': 'Electric start', 'Features': 'Oil alert, Voltage regulator, AVR', 'Warranty': '1 year' } },
    'Power Deluxe Stabilizer 5000Watts': { name: "Power Deluxe Stabilizer 5000Watts", description: "Voltage stabilizer for home appliances", priceStr: "₦45,000", unit_price: 45000, stock: 10, specs: { 'Capacity': '5000 Watts', 'Input Voltage Range': '140V-260V', 'Output Voltage': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/23/225972/1.jpg?5293' },
    'Power Deluxe Stabilizer 2000Watts': { name: "Power Deluxe Stabilizer 2000Watts", description: "Voltage stabilizer for home appliances", priceStr: "₦30,000", unit_price: 30000, stock: 15, specs: { 'Capacity': '2000 Watts', 'Input Voltage Range': '140V-260V', 'Output Voltage': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/23/225972/1.jpg?5293' },
    'Power Deluxe Stabilizer 1000Watts': { name: "Power Deluxe Stabilizer 1000Watts", description: "Voltage stabilizer for home appliances", priceStr: "₦25,000", unit_price: 25000, stock: 20, specs: { 'Capacity': '1000 Watts', 'Input Voltage Range': '140V-260V', 'Output Voltage': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/23/225972/1.jpg?5293' },
    'OX Wall Fan': { name: "OX Wall Fan", description: "Wall-mounted fan with adjustable tilt", priceStr: "₦30,000", unit_price: 30000, stock: 11, specs: { 'Blade Size': '16 inch', 'Speeds': '3', 'Oscillation': 'Yes', 'Tilt Adjustment': 'Yes', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/23/987981/1.jpg?9202' },
    'OX Standing Fan': { name: "OX Standing Fan", description: "Adjustable-height standing fan", priceStr: "₦25,000", unit_price: 25000, stock: 20, specs: { 'Blade Size': '16 inch', 'Speeds': '3', 'Height Adjustment': 'Yes', 'Oscillation': 'Yes', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/23/987981/1.jpg?9202' },
    'ORL Giant 62\' Ceiling Fan': { name: "ORL Giant 62'", description: "Quality ORL Ceiling Fan for home and office use", priceStr: "₦50,000", unit_price: 50000, stock: 7, specs: { 'Blade Size': '18 inch', 'Speeds': '3', 'Remote Control': 'Yes', 'Battery Capacity': '12 hours', 'Warranty': '1 year' }, image: 'https://th.bing.com/th/id/OIP.P813Fe5maQjXKGWnCM7ZbwHaHa?w=182&h=182&c=7&r=0&o=7&cb=ucfimg2&pid=1.7&rm=3&ucfimg=1' },
    'ORL Giant 60\' Ceiling Fan': { name: "ORL Giant 60'", description: "Quality ORL Ceiling Fan for home and office use", priceStr: "₦45,000", unit_price: 45000, stock: 9, specs: { 'Blade Size': '16 inch', 'Speeds': '3', 'Remote Control': 'Yes', 'Battery Capacity': '10 hours', 'Warranty': '1 year' }, image: 'https://tse3.mm.bing.net/th/id/OIP.hzbba50ZTX4hmAIiNZrGVgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' },
    'SHURE Microphone': { name: "SHURE Microphone", description: "Professional wired microphone for vocals", priceStr: "₦45,000", unit_price: 45000, stock: 15, specs: { 'Type': 'Dynamic', 'Polar Pattern': 'Cardioid', 'Frequency Response': '50Hz-15kHz', 'Connector': 'XLR', 'Warranty': '2 years' }, image: 'https://ng.jumia.is/unsafe/fit-in/300x300/filters:fill(white)/product/75/8883251/1.jpg?8299' },
    'Hisense Inverter Air Conditioner 2HP': { name: "Hisense Inverter Air Conditioner 2HP", description: "Energy-efficient inverter split AC unit", priceStr: "₦150,000", unit_price: 150000, stock: 5, specs: { 'Capacity': '2HP', 'Type': 'Inverter Split AC', 'Energy Rating': '5-star', 'Features': 'Auto restart, Sleep mode, Timer', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/86/5749811/1.jpg?9203' },
    'Hisense Inverter Air Conditioner 1HP': { name: "Hisense Inverter Air Conditioner 1HP", description: "Energy-efficient inverter split AC unit", priceStr: "₦100,000", unit_price: 100000, stock: 8, specs: { 'Capacity': '1HP', 'Type': 'Inverter Split AC', 'Energy Rating': '5-star', 'Features': 'Auto restart, Sleep mode, Timer', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/86/5749811/1.jpg?9203' },
    'Hisense Inverter Air Conditioner 1.5HP': { name: "Hisense Inverter Air Conditioner 1.5HP", description: "Energy-efficient inverter split AC unit", priceStr: "₦120,000", unit_price: 120000, stock: 6, specs: { 'Capacity': '1.5HP', 'Type': 'Inverter Split AC', 'Energy Rating': '5-star', 'Features': 'Auto restart, Sleep mode, Timer', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/86/5749811/1.jpg?9203' },
    'Century Stabilizer 1000Watts': { name: "Century Stabilizer 1000Watts", description: "Voltage stabilizer for home appliances", priceStr: "₦25,000", unit_price: 25000, stock: 20, specs: { 'Capacity': '1000 Watts', 'Input Voltage Range': '140V-260V', 'Output Voltage': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://d21d281c1yd2en.cloudfront.net/media/product_images/stabilizers-century-century-automatic-voltage-stabilizer-1000va_1.0.webp' },
    'Firman Stabilizer 2000Watts': { name: "Firman Stabilizer 2000Watts", description: "Voltage stabilizer for home appliances", priceStr: "₦30,000", unit_price: 30000, stock: 15, specs: { 'Capacity': '2000 Watts', 'Input Voltage Range': '140V-260V', 'Output Voltage': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://d21d281c1yd2en.cloudfront.net/media/product_images/firman-2000va-stabilizer-with-usb-port-fvr-2000_2.0.webp' },
    'Firman Stabilizer 1000Watts': { name: "Firman Stabilizer 1000Watts", description: "Voltage stabilizer for home appliances", priceStr: "₦25,000", unit_price: 25000, stock: 20, specs: { 'Capacity': '1000 Watts', 'Input Voltage Range': '140V-260V', 'Output Voltage': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://www.sumecplaza.com/cdn/shop/products/Untitleddesign_45_1800x1800.png?v=1657022532' },
    
    // Television models with specs and images
  
    "LG 32' LED television": { name: "LG 32' LED television", description: "32-inch LED TV — HDMI, USB, VGA; 720p HD", priceStr: '₦75,000', unit_price: 75000, stock: 6, specs: { 'Screen Size': '32 inch', 'Resolution': '1366x768 (HD)', 'Smart TV': 'No', 'HDMI Ports': '2', 'USB Ports': '1' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/64/0120121/1.jpg?0503' },
    "LG 32' Smart Television": { name: "LG 32' Smart Television", description: "32-inch Smart LED TV — WiFi, Smart apps, HDMI", priceStr: '₦95,000', unit_price: 95000, stock: 4, specs: { 'Screen Size': '32 inch', 'Resolution': '1366x768 (HD)', 'Smart TV': 'Yes', 'WiFi': 'Built-in', 'HDMI Ports': '2' }, image: 'https://media.us.lg.com/transform/ecomm-PDPGallery-1100x730/622f7911-883c-495a-bedd-bdb32f7e4817/TVs-32LR600BZUC-gallery-01_3000x3000?io=transform:fill,width:596' },
    "LG 43' LED television": { name: "LG 43' LED television", description: "43-inch LED TV — Full HD" , priceStr: '₦150,000', unit_price: 150000, stock: 3, specs: { 'Screen Size': '43 inch', 'Resolution': '1920x1080 (Full HD)', 'Smart TV': 'No', 'HDMI Ports': '2' }, image: 'https://ng.jumia.is/unsafe/fit-in/300x300/filters:fill(white)/product/00/176674/1.jpg?7689' },
    "LG 43' Smart television": { name: "LG 43' Smart television", description: "43-inch Smart LED TV — Smart apps, WiFi" , priceStr: '₦185,000', unit_price: 185000, stock: 3, specs: { 'Screen Size': '43 inch', 'Resolution': '1920x1080 (Full HD)', 'Smart TV': 'Yes', 'WiFi': 'Built-in' }, image: 'https://ng.jumia.is/unsafe/fit-in/300x300/filters:fill(white)/product/00/176674/1.jpg?7689' },
    "Hisense 43' LED Television": { name: "Hisense 43' LED Television", description: "43-inch LED TV — Full HD" , priceStr: '₦140,000', unit_price: 140000, stock: 4, specs: { 'Screen Size': '43 inch', 'Resolution': '1920x1080 (Full HD)', 'Smart TV': 'No' }, image: 'https://tse3.mm.bing.net/th/id/OIP.iUOU6OjGUzDPXRxr9H3V2wHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' },
    "Hisense 32' LED Television": { name: "Hisense 32' LED Television", description: "32-inch LED TV — HD" , priceStr: '₦70,000', unit_price: 70000, stock: 6, specs: { 'Screen Size': '32 inch', 'Resolution': '1366x768 (HD)', 'Smart TV': 'No' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/77/607997/1.jpg?2976' },
    "Hisense 32' Smart Television": { name: "Hisense 32' Smart Television", description: "32-inch Smart TV — WiFi" , priceStr: '₦95,000', unit_price: 95000, stock: 4, specs: { 'Screen Size': '32 inch', 'Resolution': '1366x768 (HD)', 'Smart TV': 'Yes', 'WiFi': 'Built-in' }, image: 'https://www.laptopsdirect.co.uk/Images/32A4NTUK_1_Supersize.jpg?v=5' },
    "Hisense 43' Smart Television": { name: "Hisense 43' Smart Television", description: "43-inch Smart TV — Smart apps" , priceStr: '₦165,000', unit_price: 165000, stock: 3, specs: { 'Screen Size': '43 inch', 'Resolution': '1920x1080 (Full HD)', 'Smart TV': 'Yes' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/41/1976814/1.jpg?5522' },
    "Hisense 65' Smart Television": { name: "Hisense 65' Smart Television", description: "65-inch Smart TV — 4K" , priceStr: '₦550,000', unit_price: 550000, stock: 1, specs: { 'Screen Size': '65 inch', 'Resolution': '3840x2160 (4K)', 'Smart TV': 'Yes' }, image: 'https://s.alicdn.com/@sc04/kf/Hbb3047b72a444b5c8c27d2aa1883a148f.jpg_300x300.jpg' },
    "Hisense 55' Smart Television": { name: "Hisense 55' Smart Television", description: "55-inch Smart TV — 4K" , priceStr: '₦380,000', unit_price: 380000, stock: 2, specs: { 'Screen Size': '55 inch', 'Resolution': '3840x2160 (4K)', 'Smart TV': 'Yes' }, image: 'https://ng.jumia.is/unsafe/fit-in/500x500/filters:fill(white)/product/05/951058/2.jpg?2473' },
    "Firman Stabilizer 5000Watts": { name: "Firman Stabilizer 5000Watts", description: "Reliable 5000Watts Stabilizer for home and office use", priceStr: "₦60,000", unit_price: 60000, stock: 8, specs: { 'Capacity': '5000 Watts', 'Input Range': '140V-260V', 'Output': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://www.sumecplaza.com/cdn/shop/products/STABLIZER5000W_1800x1800.jpg?v=1649261921' },
    "Century Stabilizer 2000Watts": { name: "Century Stabilizer 2000Watts", description: "Reliable 2000Watts Stabilizer for home and office use", priceStr: "₦35,000", unit_price: 35000, stock: 12, specs: { 'Capacity': '2000 Watts', 'Input Range': '140V-260V', 'Output': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://perfectmalls.com.ng/wp-content/uploads/2025/01/2-69.jpg' },
    "Century Stabilizer 5000Watts": { name: "Century Stabilizer 5000Watts", description: "Reliable 5000Watts Stabilizer for home and office use", priceStr: "₦60,000", unit_price: 60000, stock: 8, specs: { 'Capacity': '5000 Watts', 'Input Range': '140V-260V', 'Output': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://ng.jumia.is/bwStb9-30hcpj0QUOrK84gVry_A=/fit-in/500x500/filters:fill(white)/product/63/7496662/1.jpg?1547' },
    "Dura Volt Stabilizer 1000Watts": { name: "Dura Volt Stabilizer 1000Watts", description: "Reliable 1000Watts Stabilizer for home and office use", priceStr: "₦25,000", unit_price: 25000, stock: 15, specs: { 'Capacity': '1000 Watts', 'Input Range': '140V-260V', 'Output': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://tobuy.ng/sites/default/files/products/download%20-%202022-12-09T172537.513.jpg' },
    "Dura Volt Stabilizer 2000Watts": { name: "Dura Volt Stabilizer 2000Watts", description: "Reliable 2000Watts Stabilizer for home and office use", priceStr: "₦40,000", unit_price: 40000, stock: 11, specs: { 'Capacity': '2000 Watts', 'Input Range': '140V-260V', 'Output': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://www-konga-com-res.cloudinary.com/w_auto,f_auto,fl_lossy,dpr_auto,q_auto/media/catalog/product/H/X/119570_1669205609.jpg' },
    "Dura Volt Stabilizer 5000Watts": { name: "Dura Volt Stabilizer 5000Watts", description: "Reliable 5000Watts Stabilizer for home and office use", priceStr: "₦70,000", unit_price: 70000, stock: 7, specs: { 'Capacity': '5000 Watts', 'Input Range': '140V-260V', 'Output': '220V ± 10%', 'Type': 'Automatic', 'Warranty': '1 year' }, image: 'https://tse2.mm.bing.net/th/id/OIP.GJgoTg-o5f1OFM8dWxQwwgAAAA?rs=1&pid=ImgDetMain&o=7&rm=3' },
    "Century Rechargeable Standing Fan": { name: "Century Rechargeable Standing Fan", description: "Battery powered standing fans — portable and efficient", priceStr: "₦40,000", unit_price: 40000, stock: 10, specs: { 'Blade Size': '16 inch', 'Speeds': '3', 'Battery Life': '8-10 hours', 'Oscillation': 'Yes', 'Warranty': '1 year' }, image: 'https://th.bing.com/th/id/OIP.OR4v9AExTZxx2nAPrVKaWgHaHa?w=188&h=188&c=7&r=0&o=7&cb=ucfimg2&pid=1.7&rm=3&ucfimg=1' }
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
                    unit_price: unit,
                    stock: (typeof variant.stock === 'number') ? variant.stock : null,
                    specs: variant.specs || null,
                    image: variant.image || ''
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
            unit_price: productCatalog[key].unit_price || 0,
            stock: (typeof productCatalog[key].stock === 'number') ? productCatalog[key].stock : null,
            specs: productCatalog[key].specs || null,
            image: productCatalog[key].image || ''
        };
    }
    // Fallback
    return { name: key, description: '', priceStr: '₦0', unit_price: 0, specs: null, image: '' };
}

// -------------------- Lightbox + Product-card UI --------------------
const imageModal = document.getElementById('image-modal');
const imageModalClose = document.getElementById('image-modal-close');
const lightboxImage = document.getElementById('lightbox-image');

document.querySelectorAll('.product-image').forEach(container => {
    // zoom icon (kept in DOM but visually hidden for product cards)
    const zoom = document.createElement('span');
    zoom.className = 'zoom-icon';
    zoom.setAttribute('aria-hidden', 'true');
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
        // show price for card using catalog/variants
        const titleElForPrice = productCard.querySelector('h3');
        const titleForPrice = titleElForPrice ? titleElForPrice.textContent.trim() : '';
        const detailsForPrice = getProductDetails(titleForPrice);
        if (!productCard.querySelector('.price')) {
            const priceEl = document.createElement('div');
            priceEl.className = 'price';
            priceEl.textContent = detailsForPrice.priceStr;
            priceEl.style.fontWeight = '700';
            priceEl.style.margin = '8px 12px';
            const descEl = productCard.querySelector('p');
            if (descEl && descEl.parentNode) descEl.parentNode.insertBefore(priceEl, descEl.nextSibling);
            else productCard.appendChild(priceEl);
        }

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
        const details = getProductDetails(title || '');
        document.getElementById('modal-image').src = details.image || imageSrc;
        document.getElementById('modal-description').textContent = description || details.description || '';
        const modalPriceEl = document.getElementById('modal-price');
        if (modalPriceEl) modalPriceEl.textContent = details.priceStr || '';

        // Reset view and show specs when available
        document.getElementById('product-details').style.display = 'block';
        const specsEl = document.getElementById('modal-specs');
        if (specsEl) {
          if (details.specs) {
            specsEl.innerHTML = renderSpecsHtml(details.specs);
            specsEl.style.display = 'block';
          } else {
            specsEl.innerHTML = '';
            specsEl.style.display = 'none';
          }
        }
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
        const modalPriceEl = document.getElementById('modal-price');
        if (modalPriceEl) modalPriceEl.textContent = '';
    });
}
window.addEventListener('click', function(e) {
    if (e.target === modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
        const specsEl = document.getElementById('modal-specs');
        if (specsEl) specsEl.innerHTML = '';
        const modalPriceEl = document.getElementById('modal-price');
        if (modalPriceEl) modalPriceEl.textContent = '';
    }
    // Intentionally do NOT close delivery modal when clicking the overlay.
    // Delivery modal should only be closed via the cancel (×) button.
});

// -------------------- Cart (fully functional) --------------------
let cart = JSON.parse(localStorage.getItem('cart')) || {};
let favorites = JSON.parse(localStorage.getItem('favorites')) || {};
updateCartCount();

// ========== FAVORITES MANAGEMENT ==========
function toggleFavorite(productKey) {
  if (!productKey || productKey.trim() === '') return;
  
  const key = productKey.trim();
  if (favorites[key]) {
    delete favorites[key];
    showNotification(`${key} removed from favorites.`, 'info');
  } else {
    const details = getProductDetails(key);
    favorites[key] = {
      name: key,
      price: details.unit_price,
      image: details.image,
      description: details.description,
      addedAt: new Date().toISOString()
    };
    showNotification(`${key} added to favorites!`, 'success');
  }
  
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavoriteStars();
}

function isFavorite(productKey) {
  return !!favorites[productKey];
}

function updateFavoriteStars() {
  // Update all star buttons to show their current state
  document.querySelectorAll('.product-card').forEach(card => {
    const starBtn = card.querySelector('.favorite-star');
    if (starBtn) {
      const title = card.querySelector('h3')?.textContent.trim() || '';
      if (isFavorite(title)) {
        starBtn.classList.add('favorited');
        starBtn.textContent = '⭐';
      } else {
        starBtn.classList.remove('favorited');
        starBtn.textContent = '☆';
      }
    }
  });
}

function addFavoriteStarToProducts() {
  // Add star button to each product card
  document.querySelectorAll('.product-card').forEach(card => {
    if (card.querySelector('.favorite-star')) return; // Already has one
    
    const starBtn = document.createElement('button');
    starBtn.className = 'favorite-star';
    starBtn.type = 'button';
    starBtn.textContent = '☆';
    starBtn.style.cssText = `
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255,255,255,0.9);
      border: 1px solid rgba(0,0,0,0.1);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      font-size: 20px;
      cursor: pointer;
      z-index: 10;
      transition: all 200ms ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    starBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const title = card.querySelector('h3')?.textContent.trim() || '';
      if (title) {
        toggleFavorite(title);
        // Add animation class
        starBtn.classList.add('clicked');
        // Remove class after animation completes to allow re-triggering
        setTimeout(() => {
          starBtn.classList.remove('clicked');
        }, 600);
      }
    });
    
    starBtn.addEventListener('mouseenter', () => {
      starBtn.style.background = 'rgba(255,193,7,0.3)';
      starBtn.style.transform = 'scale(1.1)';
    });
    
    starBtn.addEventListener('mouseleave', () => {
      starBtn.style.background = 'rgba(255,255,255,0.9)';
      starBtn.style.transform = 'scale(1)';
    });
    
    const productImage = card.querySelector('.product-image');
    if (productImage) {
      productImage.style.position = 'relative';
      productImage.appendChild(starBtn);
    }
  });
  
  updateFavoriteStars();
}

function addToCart(productKey) {
    const key = productKey.trim();
    if (!key) return;

    // Check stock before adding
    const details = getProductDetails(key);
    const available = (typeof details.stock === 'number') ? details.stock : Infinity;
    const currentQty = cart[key] || 0;
    if (currentQty + 1 > available) {
        notifyError(`Only ${available} left in stock for ${key}.`);
        return;
    }

    if (cart[key]) cart[key] += 1;
    else cart[key] = 1;

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();

    // If the cart changed, clear any preserved pending delivery payment that doesn't match
    clearPendingDeliveryPaymentIfCartChanged();

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

// Clear preserved pending delivery payment if the cart has changed since the payment
function clearPendingDeliveryPaymentIfCartChanged() {
    try {
        const pending = JSON.parse(localStorage.getItem('pending_delivery_payment') || 'null');
        const cartSnapshot = JSON.stringify(cart || {});
        if (pending && pending._cartSnapshot !== cartSnapshot) {
            localStorage.removeItem('pending_delivery_payment');
            deliveryPaymentConfirmed = false;
            deliveryPaymentInfo = null;
            const dsb = document.getElementById('delivery-submit-btn');
            if (dsb) { dsb.disabled = true; dsb.classList.remove('glow'); dsb.textContent = 'Confirm Order'; }
            const payBtn = document.getElementById('delivery-pay-btn');
            if (payBtn) payBtn.disabled = false;
        }
    } catch (e) { /* ignore */ }
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
            const incDisabled = (typeof details.stock === 'number' && quantity >= details.stock) ? 'disabled' : '';
            itemDiv.innerHTML = `
                <div class="cart-item-image">
                    <img src="${details.image || 'https://via.placeholder.com/80?text=Product'}" alt="${details.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;">
                </div>
                <div class="cart-item-details">
                    <h4>${details.name}</h4>
                    <p>${details.description || ''}</p>
                    <div class="stock-remaining">In stock: ${(typeof details.stock === 'number') ? details.stock : 'N/A'}</div>
                    <span class="cart-item-price">${details.priceStr} x ${quantity} = ${formatPrice(itemTotal)}</span>
                </div>
                <div class="quantity-controls">
                    <button class="btn qty-btn" onclick="changeQuantity('${escapeForJs(productKey)}', -1)">-</button>
                    <span>${quantity}</span>
                    <button class="btn qty-btn" ${incDisabled} onclick="changeQuantity('${escapeForJs(productKey)}', 1)">+</button>
                    <button class="btn remove-btn" onclick="removeFromCart('${escapeForJs(productKey)}')">Remove</button>
                </div>
            `;
            cartItems.appendChild(itemDiv);
        }
    }

    document.getElementById('cart-total').textContent = `Total: ${formatPrice(total)}`;

    // Enable/disable the CHECKOUT NOW button depending on cart contents
    const cartPayBtn = document.getElementById('cart-pay-btn');
    if (cartPayBtn) {
        if (total <= 0) {
            cartPayBtn.disabled = true;
        } else {
            cartPayBtn.disabled = false;
            cartPayBtn.textContent = 'CHECKOUT NOW';
        }
    }

    // Add checkout section above favorites (total + button)
    const checkoutSection = document.createElement('div');
    checkoutSection.style.cssText = `
      margin-top: 20px;
      padding: 15px;
      background: linear-gradient(180deg, rgba(255,193,7,0.05) 0%, rgba(255,193,7,0.02) 100%);
      border-radius: 8px;
      border: 1px solid rgba(255,193,7,0.2);
    `;
    checkoutSection.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 16px; font-weight: bold; color: #333;">Cart Total:</span>
        <span style="font-size: 20px; font-weight: bold; color: #ff6b6b;">${formatPrice(total)}</span>
      </div>
      <button id="checkout-btn-inline" style="
        width: 100%;
        padding: 12px 16px;
        background: linear-gradient(180deg, #FFD54A 0%, #F0C419 100%);
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #111;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(255,193,7,0.2);
      ">CHECKOUT NOW</button>
    `;
    
    // Link the inline button to the hidden cart pay button's functionality
    const checkoutBtnInline = checkoutSection.querySelector('#checkout-btn-inline');
    if (checkoutBtnInline && cartPayBtn) {
      checkoutBtnInline.addEventListener('click', () => cartPayBtn.click());
      // Sync disabled state
      if (total <= 0) {
        checkoutBtnInline.disabled = true;
        checkoutBtnInline.style.opacity = '0.6';
        checkoutBtnInline.style.cursor = 'not-allowed';
      }
    }
    
    cartItems.appendChild(checkoutSection);

    // Add favorites section below checkout
    const favoritesSection = document.createElement('div');
    favoritesSection.style.cssText = `
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid rgba(0,0,0,0.1);
    `;
    favoritesSection.innerHTML = '<h3 style="margin-bottom: 15px;">💖 Favorites</h3>';
    
    if (Object.keys(favorites).length === 0) {
      favoritesSection.innerHTML += '<p style="color: #999; font-size: 14px;">No favorites yet. Click the ⭐ icon on any product to add it here.</p>';
    } else {
      const favGrid = document.createElement('div');
      favGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 12px;
      `;
      
      for (const productKey in favorites) {
        const fav = favorites[productKey];
        const favCard = document.createElement('div');
        favCard.style.cssText = `
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 8px;
          padding: 10px;
          text-align: center;
          background: #f9f9f9;
          cursor: pointer;
          transition: all 150ms ease;
        `;
        
        favCard.innerHTML = `
          <div style="font-size: 12px; color: #666; margin-bottom: 8px; word-break: break-word;">${productKey}</div>
          <div style="font-weight: bold; margin-bottom: 8px; color: #ff6b6b;">${fav.price ? formatPrice(fav.price) : 'N/A'}</div>
          <button onclick="addToCart('${escapeForJs(productKey)}')" style="
            background: linear-gradient(180deg, #FFD54A 0%, #F0C419 100%);
            border: none;
            border-radius: 6px;
            padding: 6px 10px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 600;
            color: #111;
            width: 100%;
            margin-bottom: 6px;
          ">Add to Cart</button>
          <button onclick="toggleFavorite('${escapeForJs(productKey)}')" style="
            background: transparent;
            border: 1px solid #ccc;
            border-radius: 6px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 12px;
            color: #666;
            width: 100%;
          ">Remove ✕</button>
        `;
        
        favCard.addEventListener('mouseenter', () => {
          favCard.style.background = '#fff';
          favCard.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          favCard.style.transform = 'translateY(-2px)';
        });
        
        favCard.addEventListener('mouseleave', () => {
          favCard.style.background = '#f9f9f9';
          favCard.style.boxShadow = 'none';
          favCard.style.transform = 'translateY(0)';
        });
        
        favGrid.appendChild(favCard);
      }
      
      favoritesSection.appendChild(favGrid);
    }
    
    cartItems.appendChild(favoritesSection);

    document.getElementById('cart-modal').style.display = 'block';
}

function changeQuantity(productKey, delta) {
    const key = productKey;
    const prevTotal = Object.values(cart).reduce((s, v) => s + v, 0);
    if (!cart[key]) return;

    // If increasing, check stock first
    if (delta > 0) {
        const details = getProductDetails(key);
        const available = (typeof details.stock === 'number') ? details.stock : Infinity;
        if (cart[key] + delta > available) {
            notifyError(`Only ${available} left in stock for ${key}.`);
            return;
        }
    }

    cart[key] += delta;
    if (cart[key] <= 0) delete cart[key];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    // If cart changed, clear any preserved pending delivery payment that doesn't match
    clearPendingDeliveryPaymentIfCartChanged();

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
    // If cart changed, clear any preserved pending delivery payment that doesn't match
    clearPendingDeliveryPaymentIfCartChanged();
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

// New: Checkout modal logic to collect customer info before Paystack
const checkoutModal = document.getElementById('checkout-modal');
const checkoutClose = document.getElementById('checkout-close');
const checkoutForm = document.getElementById('checkout-form');
const checkoutPayBtn = document.getElementById('checkout-pay-btn');
const checkoutCancelBtn = document.getElementById('checkout-cancel-btn');
const checkoutSummary = document.getElementById('checkout-summary');

if (checkoutClose) checkoutClose.addEventListener('click', () => { checkoutModal.style.display = 'none'; });
if (checkoutCancelBtn) checkoutCancelBtn.addEventListener('click', () => { checkoutModal.style.display = 'none'; });

function showCheckoutModal() {
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty! Add items before paying.');
        return;
    }
    // populate summary
    const total = computeCartTotal();
    let html = '<div class="delivery-summary" style="padding:10px; border-radius:6px;">';
    for (const key in cart) {
        const details = getProductDetails(key);
        const q = cart[key];
        html += `<div style="display:flex; justify-content:space-between; margin-bottom:6px;"><div>${details.name} x ${q}</div><div>${formatPrice(details.unit_price * q)}</div></div>`;
    }
    html += `<hr><div style="display:flex; justify-content:space-between; font-weight:700;"><div>Total</div><div>${formatPrice(total)}</div></div>`;
    html += '</div>';
    checkoutSummary.innerHTML = html;

    // prefill fields if saved
    const saved = JSON.parse(localStorage.getItem('customerInfo') || '{}');
    if (saved && saved.name) document.getElementById('checkout-name').value = saved.name;
    if (saved && saved.phone) document.getElementById('checkout-phone').value = saved.phone;
    if (saved && saved.email) document.getElementById('checkout-email').value = saved.email;

    checkoutModal.style.display = 'block';
    checkoutModal.setAttribute('aria-hidden', 'false');
}

if (checkoutPayBtn) {
    checkoutPayBtn.addEventListener('click', () => {
        const name = (document.getElementById('checkout-name').value || '').trim();
        const phone = (document.getElementById('checkout-phone').value || '').trim();
        const email = (document.getElementById('checkout-email').value || '').trim();

        if (!name || !phone) {
            showCheckoutMessage('Please enter your full name and phone number.', 'error');
            return;
        }
        if (email && !isValidEmail(email)) {
            showCheckoutMessage('Please enter a valid email address.', 'error');
            return;
        }
        if (!isValidPhone(phone)) {
            showCheckoutMessage('Please enter a valid phone number.', 'error');
            return;
        }

        // store customer info so it's used for receipts later
        const customerInfo = { name, phone, email };
        localStorage.setItem('customerInfo', JSON.stringify(customerInfo));

        // read selected delivery type from the form (defaults to delivery)
        const deliveryTypeEl = document.querySelector('input[name="checkout-delivery-type"]:checked');
        const deliveryType = (deliveryTypeEl && deliveryTypeEl.value) ? deliveryTypeEl.value : 'delivery';

        // hide modal and initiate Paystack checkout with customer info and delivery type
        checkoutModal.style.display = 'none';
        checkout(customerInfo, deliveryType);
    });
}

function showCheckoutMessage(msg, type) {
    const el = document.getElementById('checkout-msg');
    if (!el) return;
    el.textContent = msg;
    el.style.color = (type === 'error') ? '#9f1239' : '#065f46';
    setTimeout(() => { el.textContent = ''; }, 4000);
}

// Replace existing initiateCardPayment() and checkout() with these versions.

// Initiate paying with Paystack (opens checkout modal)
function initiateCardPayment() {
    // Check if user is logged in
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        alert('You must create an account and login before making a purchase. Please go to Account to sign up.');
        window.location.href = 'admin.html';
        return;
    }
    
    showCheckoutModal();
}

function checkout(customerInfo = {}, deliveryType = 'delivery') {
    const totalNGN = computeCartTotal();
    if (totalNGN <= 0) {
        alert('Cart total is zero. Add items before checkout.');
        return;
    }
    const amountInKobo = totalNGN * 100;

    // Create a snapshot so modifications during payment don't affect the record
    const checkoutSnapshot = JSON.parse(JSON.stringify(cart));

    // Build items array from snapshot (used both locally and as metadata)
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

    // Compose a compact string for metadata (Paystack dashboard shows metadata / custom_fields)
    const itemsSummary = items.map(i => `${i.name} x${i.quantity}`).join(' ; ');

    // Use customer info collected from checkout modal if present
    const customerEmail = (customerInfo && customerInfo.email) ? customerInfo.email : (localStorage.getItem('customerInfo') ? (JSON.parse(localStorage.getItem('customerInfo')).email || 'customer@example.com') : 'customer@example.com');
    const customerName = (customerInfo && customerInfo.name) ? customerInfo.name : (localStorage.getItem('customerInfo') ? (JSON.parse(localStorage.getItem('customerInfo')).name || 'Paystack Customer') : 'Paystack Customer');
    const customerPhone = (customerInfo && customerInfo.phone) ? customerInfo.phone : (localStorage.getItem('customerInfo') ? (JSON.parse(localStorage.getItem('customerInfo')).phone || '') : '');

    const handler = PaystackPop.setup({
        key: paystackPublicKey,
        email: customerEmail,
        amount: amountInKobo,
        currency: 'NGN',
        ref: 'PS_' + Math.floor((Math.random() * 1000000000) + 1),
        // Add metadata so product names are visible in Paystack transaction details and webhooks
        metadata: {
            custom_fields: [
                {
                    display_name: "Items",
                    variable_name: "items",
                    value: itemsSummary
                },
                {
                    display_name: "Order Summary (total)",
                    variable_name: "order_summary",
                    value: formatPrice(paymentTotal)
                },
                {
                    display_name: "Customer Name",
                    variable_name: "customer_name",
                    value: customerName
                },
                {
                    display_name: "Customer Phone",
                    variable_name: "customer_phone",
                    value: customerPhone
                },
                {
                    display_name: "Customer Email",
                    variable_name: "customer_email",
                    value: customerEmail
                },
                {
                    display_name: "Delivery Type",
                    variable_name: "delivery_type",
                    value: (deliveryType === 'pickup' ? 'Pickup' : 'Home Delivery')
                }
            ],
            items_json: JSON.stringify(items)
        },
        callback: function(response) {
            alert('Payment successful! Reference: ' + response.reference);

            const currentUserData = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
            const paymentOrder = {
                userId: currentUserData ? currentUserData.email : null,
                name: customerName,
                email: customerEmail,
                phone: customerPhone,
                cart: items,
                total: formatPrice(paymentTotal),
                timestamp: new Date().toISOString(),
                orderId: 'PS_' + response.reference,
                payment_reference: response.reference,
                payment_method: 'Paystack',
                delivery_type: (deliveryType === 'pickup' ? 'pickup' : 'delivery')
            };

            // store paid order locally for receipts
            savePaidOrder(paymentOrder);

            // send order email
            sendOrderEmail(paymentOrder, 'payment')
                .then(() => console.log('Payment order email sent'))
                .catch(err => console.error('Error sending payment email:', err));

            // Clear cart
            cart = {};
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            closeCart();

            // Refresh receipts UI (if visible)
            renderReceipts();
            // Hide any bank instruction panel shown for checkout
            try { hideBankInstructions('checkout'); } catch (e) {}
        },
        onClose: function() {
            alert('Payment cancelled.');
            try { hideBankInstructions('checkout'); } catch (e) {}
        }
    });
    try { showBankInstructions('checkout'); } catch (e) {}
    handler.openIframe();
}

// Cash on Delivery flow
function initiateCashOnDelivery() {
    // Check if user is logged in
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        alert('You must create an account and login before making a purchase. Please go to Account to sign up.');
        window.location.href = 'admin.html';
        return;
    }
    
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty! Add items before placing an order.');
        return;
    }
    showDeliveryModal('delivery');
}

// Pickup flow (same behavior as home delivery)
function initiatePickup() {
    // Check if user is logged in
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        alert('You must create an account and login before making a purchase. Please go to Account to sign up.');
        window.location.href = 'admin.html';
        return;
    }
    
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty! Add items before placing an order.');
        return;
    }
    showDeliveryModal('pickup');
}

// Transient delivery payment state. Confirm remains disabled until a successful Paystack payment is recorded.
let deliveryPaymentConfirmed = false;
let deliveryPaymentInfo = null;

// showDeliveryModal(mode) -- mode: 'delivery' (default) or 'pickup'
function showDeliveryModal(mode = 'delivery') {
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

    // Update modal text/labels depending on mode and show/hide address fields
    const modal = document.getElementById('delivery-modal');
    if (modal) {
      const h2 = modal.querySelector('h2');
      const p = modal.querySelector('p');
      const modeInput = document.getElementById('delivery-mode');
      const deliveryAddrGroup = document.getElementById('delivery-address-group');
      const pickupAddrGroup = document.getElementById('pickup-address-group');
      const deliveryAddrInput = document.getElementById('delivery-address');
      const deliveryCityGroup = document.getElementById('delivery-city-group');
      const deliveryCityInput = document.getElementById('delivery-city');
      const feeWarning = document.getElementById('delivery-fee-warning');
      if (mode === 'pickup') {
        if (h2) h2.textContent = 'Pickup Details';
        if (p) p.textContent = 'Please provide your pickup information. An address for the pickup is already in the form, we will be expecting you';
        if (modeInput) modeInput.value = 'pickup';
        // hide editable delivery address and city
        if (deliveryAddrGroup) deliveryAddrGroup.style.display = 'none';
        if (deliveryCityGroup) deliveryCityGroup.style.display = 'none';
        // show fixed pickup address
        if (pickupAddrGroup) pickupAddrGroup.style.display = '';
        // set hidden value into delivery-address input so form submissions include the pickup address
        const pickupAddress = 'No 41 shogbamu street bale bus stop New garage lagos';
        if (deliveryAddrInput) { deliveryAddrInput.value = pickupAddress; deliveryAddrInput.required = false; }
        if (deliveryCityInput) { deliveryCityInput.value = 'Lagos'; deliveryCityInput.required = false; }
        // hide delivery fees warning for pickup
        if (feeWarning) feeWarning.style.display = 'none';
      } else {
        if (h2) h2.textContent = 'Delivery Details';
        if (p) p.textContent = 'Please provide your delivery information. Receipts will be generated upon successful delivery.';
        if (modeInput) modeInput.value = 'Home-delivery';
        // show editable delivery address and city
        if (deliveryAddrGroup) deliveryAddrGroup.style.display = '';
        if (deliveryCityGroup) deliveryCityGroup.style.display = '';
        // hide pickup address display
        if (pickupAddrGroup) pickupAddrGroup.style.display = 'none';
        // clear any auto-filled values set previously
        if (deliveryAddrInput) { deliveryAddrInput.value = ''; deliveryAddrInput.required = true; }
        if (deliveryCityInput) { deliveryCityInput.value = ''; deliveryCityInput.required = true; }
        // show delivery fees warning for home delivery
        if (feeWarning) feeWarning.style.display = '';
      }
    }

    // If there's an existing confirmed payment that matches the current cart and mode,
    // preserve it so the Confirm button remains available even if the modal was closed.
    const deliveryPayBtn = document.getElementById('delivery-pay-btn');
    const cartSnapshot = JSON.stringify(cart || {});
    const expectedMode = (mode === 'pickup' ? 'pickup' : 'delivery');

    if (deliveryPaymentConfirmed && deliveryPaymentInfo && deliveryPaymentInfo._cartSnapshot === cartSnapshot && deliveryPaymentInfo.delivery_type === expectedMode) {
        // Restore confirmed state: enable Confirm and keep glow to prompt the user
        if (deliverySubmitBtn) { deliverySubmitBtn.disabled = false; deliverySubmitBtn.textContent = 'Confirm Order (Paid)'; deliverySubmitBtn.classList.add('glow'); }
        if (deliveryPayBtn) { deliveryPayBtn.disabled = true; }

        // Show a status message so the user knows a payment is already recorded
        try {
            showDeliveryStatus(`Payment recorded (ref ${deliveryPaymentInfo.payment_reference}). Click Confirm Order to complete your ${expectedMode === 'pickup' ? 'pickup' : 'delivery'}.`, 'success');
        } catch (e) { /* ignore */ }

        // Populate form fields with the saved info only if they are currently empty to avoid overwriting edits
        try {
            if (deliveryPaymentInfo.name) {
                const el = document.getElementById('delivery-name'); if (el && !el.value) el.value = deliveryPaymentInfo.name;
            }
            if (deliveryPaymentInfo.phone) {
                const el = document.getElementById('delivery-phone'); if (el && !el.value) el.value = deliveryPaymentInfo.phone;
            }
            if (deliveryPaymentInfo.email) {
                const el = document.getElementById('delivery-email'); if (el && !el.value) el.value = deliveryPaymentInfo.email;
            }
            if (deliveryPaymentInfo.address) {
                const el = document.getElementById('delivery-address'); if (el && !el.value) el.value = deliveryPaymentInfo.address;
            }
            if (deliveryPaymentInfo.city) {
                const el = document.getElementById('delivery-city'); if (el && !el.value) el.value = deliveryPaymentInfo.city;
            }
        } catch (e) { /* ignore form population errors */ }

    } else {
        // No preserved payment - reset transient state and disable Confirm until payment completes
        deliveryPaymentConfirmed = false;
        deliveryPaymentInfo = null;
        if (deliverySubmitBtn) { deliverySubmitBtn.disabled = true; deliverySubmitBtn.textContent = 'Confirm Order'; deliverySubmitBtn.classList.remove('glow'); }
        if (deliveryPayBtn) { deliveryPayBtn.disabled = false; }
    }

    // Update the Pay Now button label for this mode
    updateDeliveryPayBtnLabel(mode);

    document.getElementById('delivery-modal').style.display = 'block';
}

// Close delivery modal
function closeDeliveryModal() {
    document.getElementById('delivery-modal').style.display = 'none';
}

// Cart PAY NOW button wiring
// When clicked: close the cart, scroll to #payment, highlight it and add an accessible Close button to return to previous scroll position
document.addEventListener('DOMContentLoaded', () => {
  const cartPayBtn = document.getElementById('cart-pay-btn');
  if (!cartPayBtn) return;
  cartPayBtn.addEventListener('click', () => {
    if (Object.keys(cart).length === 0) {
      alert('Your cart is empty! Add items before paying.');
      return;
    }

    // Close the cart modal
    closeCart();

    const paymentSection = document.getElementById('payment');
    if (!paymentSection) {
      // Fallback: open checkout modal
      showCheckoutModal();
      return;
    }

    // Save current scroll position to return later
    const prevScroll = window.pageYOffset || window.scrollY || 0;

    // Add highlight class
    paymentSection.classList.add('payment-active');

    // Create Exit button if not present
    let exitBtn = paymentSection.querySelector('.payment-exit-btn');
    if (!exitBtn) {
      exitBtn = document.createElement('button');
      exitBtn.type = 'button';
      exitBtn.className = 'btn ghost payment-exit-btn';
      exitBtn.textContent = 'Close';
      exitBtn.setAttribute('aria-label', 'Close payment options and return to previous view');

      exitBtn.addEventListener('click', () => {
        paymentSection.classList.remove('payment-active');
        if (exitBtn && exitBtn.parentNode) exitBtn.parentNode.removeChild(exitBtn);
        try { window.scrollTo({ top: prevScroll, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, prevScroll); }
      });

      const h2 = paymentSection.querySelector('h2');
      if (h2) h2.parentNode.insertBefore(exitBtn, h2.nextSibling);
      else paymentSection.insertBefore(exitBtn, paymentSection.firstChild);
    }

    // Scroll payment section into view and focus the first method
    try {
      paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const firstMethod = paymentSection.querySelector('.payment-method');
      if (firstMethod) { firstMethod.setAttribute('tabindex', '0'); firstMethod.focus(); }
    } catch (e) {
      // fallback to checkout modal
      showCheckoutModal();
    }
  });
});
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

        const mode = (document.getElementById('delivery-mode') && document.getElementById('delivery-mode').value) ? document.getElementById('delivery-mode').value : 'delivery';
        if (mode === 'delivery') {
            if (!name || !phone || !address || !city) {
                showDeliveryStatus('Please fill in all required fields.', 'error');
                return;
            }
        } else {
            // pickup: address and city are auto-filled to the pickup location; only require name and phone
            if (!name || !phone) {
                showDeliveryStatus('Please fill in your name and phone number.', 'error');
                return;
            }
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
            // Require a successful Paystack payment before finalizing the order from this form.
            if (!deliveryPaymentConfirmed || !deliveryPaymentInfo) {
                showDeliveryStatus('Please complete payment using the Pay Now button before confirming your order.', 'error');
                return;
            }

            // Merge any form updates into the payment snapshot
            const pd = Object.assign({}, deliveryPaymentInfo);
            pd.name = name;
            pd.phone = phone;
            pd.email = email;
            pd.address = address;
            pd.city = city;
            pd.notes = notes;
            pd.timestamp = new Date().toISOString();

            // Finalize the paid order: store locally and send email
            try {
                savePaidOrder(pd);
                await sendOrderEmail(pd, 'payment');
            } catch (err) {
                console.error('Error finalizing paid order:', err);
            }

            // Clear cart and update UI
            cart = {};
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();

            if (deliveryForm) deliveryForm.reset();
            const arrangementText = (pd.delivery_type === 'pickup') ? 'pickup arrangements' : 'delivery arrangements';
            showDeliveryStatus(`Order confirmed! Your order ID is ${pd.orderId}. We will contact you at ${phone} for ${arrangementText}.`, 'success');

            // Disable Confirm and clear payment snapshot
            if (deliverySubmitBtn) { deliverySubmitBtn.disabled = true; deliverySubmitBtn.textContent = 'Confirm Order'; deliverySubmitBtn.classList.remove('glow'); }
            deliveryPaymentConfirmed = false;
            deliveryPaymentInfo = null;
            try { localStorage.removeItem('pending_delivery_payment'); } catch (e) { /* ignore */ }

            // Close modal shortly after
            setTimeout(() => { closeDeliveryModal(); }, 2000);

            // Refresh receipts UI
            renderReceipts();

            console.log('Paid delivery order finalized:', pd);
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

// Update the Pay Now button label inside the delivery modal based on mode (delivery | pickup)
function updateDeliveryPayBtnLabel(mode) {
    const payBtn = document.getElementById('delivery-pay-btn');
    if (!payBtn) return;
    payBtn.textContent = (mode === 'pickup') ? 'PAY NOW FOR PICKUP' : 'PAY NOW FOR HOME DELIVERY';
}

// Wire up Delivery Pay Now button (uses Paystack) — validates fields and starts an inline payment
document.addEventListener('DOMContentLoaded', () => {
    const deliveryPayBtn = document.getElementById('delivery-pay-btn');
    if (!deliveryPayBtn) return;

    deliveryPayBtn.addEventListener('click', () => {
        if (Object.keys(cart).length === 0) {
            alert('Your cart is empty! Add items before paying.');
            return;
        }

        const name = (document.getElementById('delivery-name').value || '').trim();
        const phone = (document.getElementById('delivery-phone').value || '').trim();
        const email = (document.getElementById('delivery-email') ? document.getElementById('delivery-email').value : '') || '';
        const address = (document.getElementById('delivery-address') ? document.getElementById('delivery-address').value : '') || '';
        const city = (document.getElementById('delivery-city') ? document.getElementById('delivery-city').value : '') || '';
        const notes = (document.getElementById('delivery-notes') ? document.getElementById('delivery-notes').value : '') || '';
        const mode = (document.getElementById('delivery-mode') && document.getElementById('delivery-mode').value) ? document.getElementById('delivery-mode').value : 'delivery';

        // Basic validation (same as regular confirm flow)
        if (mode === 'delivery') {
            if (!name || !phone || !address || !city) {
                showDeliveryStatus('Please fill in all required fields.', 'error');
                return;
            }
        } else {
            if (!name || !phone) {
                showDeliveryStatus('Please fill in your name and phone number.', 'error');
                return;
            }
        }
        if (!isValidPhone(phone)) {
            showDeliveryStatus('Please enter a valid phone number.', 'error');
            return;
        }
        if (email && !isValidEmail(email)) {
            showDeliveryStatus('Please enter a valid email address.', 'error');
            return;
        }

        // Build items and totals similar to checkout()
        const checkoutSnapshot = JSON.parse(JSON.stringify(cart));
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

        if (paymentTotal <= 0) {
            alert('Cart total is zero. Add items before checkout.');
            return;
        }

        if (typeof PaystackPop === 'undefined') {
            alert('Paystack is not loaded. Please try again later.');
            return;
        }

        const amountInKobo = paymentTotal * 100;
        const itemsSummary = items.map(i => `${i.name} x${i.quantity}`).join(' ; ');

        // Disable button while processing
        const originalText = deliveryPayBtn.textContent;
        deliveryPayBtn.disabled = true;
        deliveryPayBtn.textContent = 'Processing payment...';

        const handler = PaystackPop.setup({
            key: paystackPublicKey,
            email: email || (localStorage.getItem('customerInfo') ? (JSON.parse(localStorage.getItem('customerInfo')).email || 'customer@example.com') : 'customer@example.com'),
            amount: amountInKobo,
            currency: 'NGN',
            ref: 'PS_' + Math.floor((Math.random() * 1000000000) + 1),
            metadata: {
                custom_fields: [
                    { display_name: "Items", variable_name: "items", value: itemsSummary },
                    { display_name: "Order Summary (total)", variable_name: "order_summary", value: formatPrice(paymentTotal) },
                    { display_name: "Customer Name", variable_name: "customer_name", value: name },
                    { display_name: "Customer Phone", variable_name: "customer_phone", value: phone },
                    { display_name: "Delivery Type", variable_name: "delivery_type", value: (mode === 'pickup' ? 'Pickup' : 'Home Delivery') },
                    { display_name: "Delivery Address", variable_name: "delivery_address", value: address }
                ]
            },
            callback: function(response) {
                // Payment accepted by Paystack — record the payment and enable Confirm.
                alert('Payment successful! Reference: ' + response.reference);

                const currentUserData = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
                const paymentOrder = {
                    userId: currentUserData ? currentUserData.email : null,
                    name,
                    email,
                    phone,
                    cart: items,
                    // snapshot of cart object at time of payment (used to validate preserved payment)
                    _cartSnapshot: JSON.stringify(checkoutSnapshot || {}),
                    total: formatPrice(paymentTotal),
                    timestamp: new Date().toISOString(),
                    orderId: 'PS_' + response.reference,
                    payment_reference: response.reference,
                    payment_method: 'Paystack',
                    delivery_type: (mode === 'pickup' ? 'pickup' : 'delivery'),
                    address,
                    city,
                    notes
                };

                // Mark payment confirmed and store the snapshot for finalization on Confirm
                deliveryPaymentConfirmed = true;
                deliveryPaymentInfo = paymentOrder;
                try { localStorage.setItem('pending_delivery_payment', JSON.stringify(paymentOrder)); } catch (e) { /* ignore storage errors */ }

                // Inform the user and enable Confirm button (add glow to indicate next action)
                const arrangementText = (mode === 'pickup') ? 'pickup arrangements' : 'delivery arrangements';
                showDeliveryStatus(`Payment successful (ref ${response.reference}). Click Confirm Order to complete your ${arrangementText}.`, 'success');
                if (deliverySubmitBtn) { deliverySubmitBtn.disabled = false; deliverySubmitBtn.textContent = 'Confirm Order (Paid)'; deliverySubmitBtn.classList.add('glow'); }

                // Restore pay button (hide bank instructions and re-enable)
                hideBankInstructions('delivery');
                deliveryPayBtn.disabled = false;
                deliveryPayBtn.textContent = originalText;

                // Do NOT close the modal here — require the user to press Confirm to finalize the order.
            },
            onClose: function() {
                alert('Payment cancelled.');
                deliveryPayBtn.disabled = false;
                deliveryPayBtn.textContent = originalText;
                hideBankInstructions('delivery');
            }
        });

        try { showBankInstructions('delivery'); } catch (e) {}
        handler.openIframe();
    });
});

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
        if (orderData.delivery_type) lines.push(`Delivery Type: ${orderData.delivery_type === 'pickup' ? 'Pickup' : 'Home Delivery'}`);
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
    'Kenwood Blender': {
        'Power': '500W - 1200W',
        'Jar Material': 'Glass and BPA-free plastic options',
        'Speeds': 'Multi-speed with pulse setting',
        'Accessories': 'Chopper, Grinder, Travel lid (model dependent)',
        'Warranty': '1 year'
    },
    'Hisense Microwave 20 Litres': {
        'Capacity': '20 Litres',
        'Power': '1000W',
        'Features': 'Auto-rotation, 10 power levels, Child lock',
        'Controls': 'Touch panel with timer',
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
    'Elepaq Constant Generator SV2200': {
        'Fuel Type': 'Petrol',
        'Capacity Range': '2.2kVA',
        'Start Type': 'Recoil start',
        'coil':'100% Copper winding for durability',
        'Features': 'Oil alert, Voltage regulator, AVR in some models',
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

    const imageSrc = document.getElementById('modal-image') ? document.getElementById('modal-image').src : '';
    const details = getProductDetails(title) || {};

    // Find specs: exact productSpecs entry, then details.specs (from catalog/variants),
    // then try a fuzzy match against known productSpecs keys (category/general matches)
    let specs = productSpecs[title] || details.specs || null;
    if (!specs) {
        const normalize = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/,'');
        const nl = normalize(title);
        for (const k of Object.keys(productSpecs)) {
            if (!k) continue;
            const nk = normalize(k);
            if (!nk) continue;
            if (nl.includes(nk) || nk.includes(nl)) { specs = productSpecs[k]; break; }
        }
    }

    if (!specs) {
        // As a final fallback, if details.specs is an object-like string, try to render it
        if (details && details.specs) {
            specsContainer.innerHTML = renderSpecsHtml(details.specs) || '<p>No detailed specifications available for this product at the moment.</p>';
        } else {
            specsContainer.innerHTML = '<p>No detailed specifications available for this product at the moment.</p>';
        }
    } else {
        // build spec rows
        let rows = '';
        for (const key in specs) {
            rows += `<div class="spec-row"><dt>${escapeHtml(key)}</dt><dd>${escapeHtml(specs[key])}</dd></div>`;
        }

        const html = `
          <div class="specs-grid">
            <div class="specs-image"><img src="${escapeHtml(details.image || imageSrc)}" alt="${escapeHtml(title)}"></div>
            <div class="specs-content">
              <h3>${escapeHtml(title)}</h3>
              <p class="muted">${escapeHtml(details.description || 'Technical specifications and key features of this product.')}</p>
              <div class="specs-dl">${rows}</div>
              <div class="spec-actions">
                <button class="btn ghost" id="spec-back-btn" type="button">Back</button>
                <button class="btn primary" id="spec-buy-btn" type="button">Buy Now</button>
              </div>
            </div>
          </div>
        `;
        specsContainer.innerHTML = html;
    }

    document.getElementById('product-details').style.display = 'none';
    document.getElementById('modal-variants').style.display = 'none';
    specsContainer.style.display = 'block';

    // Small delay to ensure elements are attached before wiring events
    setTimeout(() => {
        const backBtn = document.getElementById('spec-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                document.getElementById('product-details').style.display = 'block';
                specsContainer.style.display = 'none';
                // Return focus to modal title for accessibility
                try { document.getElementById('modal-title').focus(); } catch (e) {}
            });
            try { backBtn.focus(); } catch (e) {}
        }
        const buyBtn = document.getElementById('spec-buy-btn');
        if (buyBtn) {
            buyBtn.addEventListener('click', () => {
                if (title) addToCart(title);
            });
        }
    }, 40);
}

// -------------------- Receipts UI --------------------
const receiptsListEl = document.getElementById('receipts-list');
const receiptModal = document.getElementById('receipt-modal');
const receiptClose = document.getElementById('receipt-close');
const receiptCloseBtn = document.getElementById('receipt-close-btn');
const receiptContent = document.getElementById('receipt-content');
const receiptPrintBtn = document.getElementById('receipt-print-btn');

// -------------------- Wire the Show / Hide Receipts toggle button (works if the button exists in HTML or creates one) ----
// Ensures the receipts list is hidden by default and populated only when shown.

document.addEventListener('DOMContentLoaded', () => {
  try {
    const receiptsSection = document.getElementById('receipts');
    const receiptsList = document.getElementById('receipts-list');
    if (!receiptsSection || !receiptsList) return;

    const container = receiptsSection.querySelector('.container') || receiptsSection;
    const infoP = container.querySelector('p');

    // find existing button or create one
    let btn = document.getElementById('toggle-receipts-btn');
    if (!btn) {
      const wrapper = document.createElement('div');
      wrapper.style.textAlign = 'center';
      wrapper.style.margin = '12px 0';

      btn = document.createElement('button');
      btn.id = 'toggle-receipts-btn';
      btn.className = 'btn ghost';
      btn.type = 'button';
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', 'receipts-list');
      btn.textContent = 'Show Receipts';

      wrapper.appendChild(btn);
      if (infoP && infoP.parentNode) infoP.parentNode.insertBefore(wrapper, infoP.nextSibling);
      else container.insertBefore(wrapper, receiptsList);
    } else {
      // ensure attributes exist
      btn.setAttribute('aria-controls', 'receipts-list');
      if (!btn.getAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');
      if (!btn.textContent || !btn.textContent.trim()) btn.textContent = 'Show Receipts';
    }

    // Start collapsed
    receiptsList.style.display = 'none';

  // Handle footer product link clicks (smooth-scroll + highlight) and direct hash navigation
  function scrollToProductId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // small delay then adjust for header and add highlight
      setTimeout(() => {
        window.scrollBy(0, -120);
        el.classList.add('highlight');
        setTimeout(() => el.classList.remove('highlight'), 2400);
      }, 350);
    } catch (e) {
      try { window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset - 140); } catch (err) {}
    }
  }

  // Intercept clicks on product anchor links to provide smooth behaviour and highlight
  document.querySelectorAll('a[href^="#product-"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      const target = a.getAttribute('href').slice(1);
      if (target) scrollToProductId(target);
      // update the URL hash without scrolling again
      try { history.replaceState(null, '', location.pathname + location.search + '#' + target); } catch (e) {}
    });
  });

  // If page loaded with a product hash, scroll to it and highlight
  if (location.hash && location.hash.startsWith('#product-')) {
    const id = location.hash.slice(1);
    setTimeout(() => scrollToProductId(id), 260);
  }
    const freshBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(freshBtn, btn);
    btn = freshBtn;

    // click handler
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (!expanded) {
        receiptsList.style.display = '';
        try { renderReceipts(); } catch (err) { console.error('Error rendering receipts on show:', err); }
        btn.textContent = 'Hide Receipts';
        btn.setAttribute('aria-expanded', 'true');
        setTimeout(() => receiptsList.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      } else {
        receiptsList.style.display = 'none';
        receiptsList.innerHTML = '';
        btn.textContent = 'Show Receipts';
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    // Indicate if receipts exist (but do NOT auto-open to avoid scrolling on load)
    try {
      const paid = JSON.parse(localStorage.getItem('paid_orders') || '[]');
      const cod = JSON.parse(localStorage.getItem('cash_orders') || '[]');
      const total = (paid ? paid.length : 0) + (cod ? cod.length : 0);
      if (total > 0) {
        // Show a badge in the button text to avoid auto-opening the section (which would scroll)
        btn.textContent = `Show Receipts (${total})`;
        btn.setAttribute('aria-label', `Show ${total} receipts`);
      }
    } catch (err) {
      console.error('Error checking stored receipts for indicator:', err);
    }

  } catch (e) {
    console.error('Error initializing receipts toggle:', e);
  }
});

// -------------------- Existing receipt modal & print wiring --------------------
if (receiptClose) receiptClose.addEventListener('click', () => { receiptModal.style.display = 'none'; });
if (receiptCloseBtn) receiptCloseBtn.addEventListener('click', () => { receiptModal.style.display = 'none'; });
if (receiptPrintBtn) receiptPrintBtn.addEventListener('click', () => { printReceipt(); });

// (Detailed receipt rendering is implemented earlier via renderReceipts() and renderReceiptHtml())
// The button toggle will call the existing renderReceipts() when showing receipts.

// Print receipt content
function printReceipt() {
    const content = receiptContent.innerHTML;
    const w = window.open('', '_blank', 'width=800,height=600');
    if (!w) {
        alert('Please allow popups to print receipt.');
        return;
    }
    w.document.write(`<html><head><title>Receipt</title><style>body{font-family: Arial, sans-serif; padding:20px;} table{width:100%; border-collapse:collapse;} th,td{padding:8px; border:1px solid #ddd;}</style></head><body>${content}<hr><div style="text-align:center; margin-top:12px;"><button onclick="window.print()">Print / Save as PDF</button></div></body></html>`);
    w.document.close();
    w.focus();
}



// Small notification helper for errors
function notifyError(msg) {
  if (typeof window.showErrorToast === 'function') {
    window.showErrorToast(msg);
  } else if (typeof window.showToast === 'function') {
    window.showToast(msg, 'error');
  } else {
    window.alert(msg);
  }
}

// Newsletter subscription handler (shows preview first)
function subscribeNewsletter() {
  const emailEl = document.getElementById('newsletter-email');
  if (!emailEl) return;
  const email = (emailEl.value || '').trim();
  if (!email) { notifyError('Please enter a valid email address.'); return; }

  // Automatically generate acceptance message and send without preview
  const messageText = `Hi ${email.split('@')[0] || ''}!\n\nThanks for subscribing to Cympet and Co. You're now signed up to receive exclusive offers, new arrivals and product updates. Use code WELCOME10 on your next purchase.\n\nBest regards,\nCympet and Co Team`;

  // Directly send the subscription (this will persist on server and trigger confirmation email)
  sendNewsletterSubscription(email, messageText);
}

function showNewsletterPreview(email, messageText) {
  const preview = document.getElementById('newsletter-preview');
  const textarea = document.getElementById('newsletter-preview-textarea');
  if (!preview || !textarea) return;
  textarea.value = messageText;
  preview.style.display = 'block';
  // move focus to textarea so the user can edit immediately
  try { textarea.focus(); textarea.setSelectionRange(textarea.value.length, textarea.value.length); } catch (e) {}

  // wire confirm & cancel once
  const sendBtn = document.getElementById('newsletter-send-btn');
  const cancelBtn = document.getElementById('newsletter-cancel-btn');

  function cleanupHandlers() {
    try { sendBtn.removeEventListener('click', onSend); } catch (e) {}
    try { cancelBtn.removeEventListener('click', onCancel); } catch (e) {}
  }

  function onSend() {
    cleanupHandlers();
    const edited = textarea.value.trim();
    if (!edited) { notifyError('Message cannot be empty.'); return; }
    sendNewsletterSubscription(email, edited);
  }
  function onCancel() {
    cleanupHandlers();
    hideNewsletterPreview();
  }

  sendBtn.addEventListener('click', onSend);
  cancelBtn.addEventListener('click', onCancel);
}

// Send to Web3Forms and save to server-side storage
function sendNewsletterSubscription(email, messageOverride) {
  const emailEl = document.getElementById('newsletter-email');
  const accessKey = (window.NEWSLETTER_ACCESS_KEY && String(window.NEWSLETTER_ACCESS_KEY).trim()) ||
                    (document.getElementById('newsletter-access-key') && document.getElementById('newsletter-access-key').value.trim()) || '';

  const defaultMessage = `Hi there!\n\nThanks for subscribing to Cympet and Co. Congratulations — you're now signed up to receive exclusive offers, new arrivals and product updates. Use code WELCOME10 on your next purchase.\n\nBest regards,\nCympet and Co Team`;
  const messageText = (typeof messageOverride === 'string' && messageOverride.trim()) ? messageOverride.trim() : defaultMessage;
  // convert plain text to simple HTML (escape first)
  const htmlBody = `<p>${escapeHtml(messageText).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;

  const payload = {
    access_key: accessKey,
    subject: 'Welcome to Cympet and Co Newsletter!',
    email: email,
    message: messageText,
    html: htmlBody,
    auto_response: true,
    from_name: 'Cympet and Co',
    data: { email }
  };

  // If accessKey present, submit to Web3Forms; otherwise skip directly to server save
  const doWeb3 = Boolean(accessKey);

  const finishSuccess = () => {
    // Save to backend storage (include message)
    fetch('/newsletter-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, message: messageText })
    }).then(r => r.json()).then(j => {
      // success recorded on server; show success toast
      notifySuccess("Thanks — you're subscribed! A confirmation email has been sent to your address.");
      hideNewsletterPreview();
      if (emailEl) emailEl.value = '';
    }).catch(err => {
      console.error('Server save error:', err);
      // Still consider subscription successful if Web3Forms send succeeded
      notifySuccess("Thanks — you're subscribed! (saved locally)");
      hideNewsletterPreview();
      if (emailEl) emailEl.value = '';
    });
  };

  if (doWeb3) {
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(json => {
      if (json && json.success) {
        finishSuccess();
      } else {
        console.error('Web3Forms error:', json);
        notifyError(json && json.message ? json.message : 'Subscription failed — please try again later.');
      }
    }).catch(err => {
      console.error('Subscription error:', err);
      notifyError('Subscription failed — please try again later.');
    });
  } else {
    // Fallback: still save to backend if available, otherwise localStorage
    fetch('/newsletter-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, message: messageText })
    }).then(r => r.json()).then(j => {
      notifySuccess("Thanks — you're subscribed! (saved)");
      hideNewsletterPreview();
      if (emailEl) emailEl.value = '';
    }).catch(err => {
      console.error('Server save error:', err);
      try {
        const list = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
        list.push({ email: email, message: messageText, created: new Date().toISOString() });
        localStorage.setItem('newsletter_subscribers', JSON.stringify(list));
        notifySuccess("Thanks — you're subscribed! (saved locally)");
        hideNewsletterPreview();
        if (emailEl) emailEl.value = '';
      } catch (e) {
        console.error('Local subscription error:', e);
        notifyError('Subscription failed — please try again.');
      }
    });
  }
}

function hideNewsletterPreview() {
  const preview = document.getElementById('newsletter-preview');
  if (!preview) return;
  preview.style.display = 'none';
}
// (Duplicate legacy function removed — using the unified `sendNewsletterSubscription(email, messageOverride)` above.)

// Cookie consent helpers
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + ((days||365)*24*60*60*1000));
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()};SameSite=Lax`;
}
function getCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\/\\+^])/g, '\\$1') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function showCookieBanner() {
  const el = document.getElementById('cookie-consent');
  if (!el) return;
  el.setAttribute('aria-hidden', 'false');
  // For accessibility: move focus to the primary action (Accept)
  try {
    const acceptBtn = document.getElementById('cookie-accept');
    if (acceptBtn) {
      acceptBtn.focus({ preventScroll: true });
    }
  } catch (e) { /* ignore if focus options unsupported */ }
}
function hideCookieBanner() {
  const el = document.getElementById('cookie-consent');
  if (!el) return;
  el.setAttribute('aria-hidden', 'true');
}

function applyCookieChoice(choice) {
  // Persist choice in cookie and localStorage (both for convenience)
  setCookie('cookie_consent', choice, 365);
  try { localStorage.setItem('cookie_consent', choice); } catch (e) {}

  // Apply decision: enable or disable non-essential scripts
  if (choice === 'accepted') {
    enableNonEssential();
    showManageButton();
    // Confirmation toast
    try { notifySuccess('Cookies accepted'); } catch (e) { /* ignore */ }
    try { updateCookieBadge('accepted'); } catch (e) { /* ignore */ }
  } else if (choice === 'declined') {
    disableNonEssential();
    showManageButton();
    // Confirmation toast
    try { notifySuccess('Cookies declined'); } catch (e) { /* ignore */ }
    try { updateCookieBadge('declined'); } catch (e) { /* ignore */ }
  }

  hideCookieBanner();
}

// Enable non-essential scripts (loads Google Analytics gtag.js when cookies are accepted)
// Set `window.GA_MEASUREMENT_ID = 'G-XXXXXXX'` before calling if you want to override the placeholder.
function enableNonEssential() {
  if (window.nonEssentialEnabled) return; // already enabled
  console.log('Cookie consent: accepted — enabling non-essential scripts (Google Analytics)');

  const GA_ID = window.GA_MEASUREMENT_ID || 'G-XXXXXXX';

  // Inject gtag.js script
  if (!document.getElementById('ga-gtag')) {
    const s = document.createElement('script');
    s.id = 'ga-gtag';
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    s.async = true;
    document.head.appendChild(s);
  }

  // Initialize gtag (inline initializer)
  if (!document.getElementById('ga-init')) {
    const init = document.createElement('script');
    init.id = 'ga-init';
    init.text = "window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', '" + GA_ID + "');";
    document.head.appendChild(init);
  }

  window.nonEssentialEnabled = true;

  // Update UI affordance on the footer manage button
  const btn = document.getElementById('open-cookie-manager');
  if (btn) {
    btn.title = 'Cookie settings (Non-essential features enabled)';
    btn.setAttribute('aria-pressed', 'true');
  }
}

function disableNonEssential() {
  console.log('Cookie consent: declined — non-essential scripts disabled');

  // Remove GA script and initializer
  const gaScript = document.getElementById('ga-gtag');
  if (gaScript && gaScript.parentNode) gaScript.parentNode.removeChild(gaScript);
  const gaInit = document.getElementById('ga-init');
  if (gaInit && gaInit.parentNode) gaInit.parentNode.removeChild(gaInit);

  // Replace gtag with a no-op so further calls don't error or send data
  try {
    window.gtag = function(){ /* noop */ };
    try { delete window.dataLayer; } catch(e) { /* ignore */ }
  } catch (e) { /* ignore */ }

  window.nonEssentialEnabled = false;

  const btn = document.getElementById('open-cookie-manager');
  if (btn) {
    btn.title = 'Cookie settings (Non-essential features disabled)';
    btn.setAttribute('aria-pressed', 'false');
  }
}

function showManageButton() {
  let btn = document.getElementById('open-cookie-manager');
  if (!btn) return;
  btn.style.display = 'inline-block';
}
function hideManageButton() {
  let btn = document.getElementById('open-cookie-manager');
  if (!btn) return;
  btn.style.display = 'none';
}

// Update visible badge with current cookie state
function updateCookieBadge(state) {
  const badge = document.getElementById('cookie-status-badge');
  if (!badge) return;
  try {
    if (state === 'accepted') {
      badge.textContent = 'Cookies: On';
      badge.classList.add('enabled');
      badge.classList.remove('disabled');
      badge.setAttribute('aria-label', 'Cookies accepted. Click to manage.');
    } else if (state === 'declined') {
      badge.textContent = 'Cookies: Off';
      badge.classList.add('disabled');
      badge.classList.remove('enabled');
      badge.setAttribute('aria-label', 'Cookies declined. Click to manage.');
    } else {
      badge.textContent = 'Cookies: ?';
      badge.classList.remove('enabled', 'disabled');
      badge.setAttribute('aria-label', 'Cookie status unknown. Click to manage.');
    }
  } catch (e) { /* ignore */ }
} 

// Attach banner handlers
// Attach cookie banner event handlers in an idempotent way
function attachCookieHandlers() {
  const accept = document.getElementById('cookie-accept');
  const decline = document.getElementById('cookie-decline');
  const openBtn = document.getElementById('open-cookie-manager');
  const badge = document.getElementById('cookie-status-badge');

  if (accept && !accept.dataset.cookieListener) {
    accept.addEventListener('click', () => applyCookieChoice('accepted'));
    accept.dataset.cookieListener = '1';
  }
  if (decline && !decline.dataset.cookieListener) {
    decline.addEventListener('click', () => applyCookieChoice('declined'));
    decline.dataset.cookieListener = '1';
  }
  if (openBtn && !openBtn.dataset.cookieListener) {
    openBtn.addEventListener('click', () => showCookieBanner());
    openBtn.dataset.cookieListener = '1';
  }
  // make badge clickable and keyboard accessible to open the banner
  if (badge && !badge.dataset.cookieListener) {
    badge.addEventListener('click', () => showCookieBanner());
    badge.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showCookieBanner(); } });
    badge.dataset.cookieListener = '1';
    badge.tabIndex = 0;
  }
} 

function initCookieBanner() {
  // Ensure handlers are attached so buttons are always functional
  attachCookieHandlers();

  const stored = getCookie('cookie_consent') || (localStorage.getItem && localStorage.getItem('cookie_consent'));
  if (stored && (stored === 'accepted' || stored === 'declined')) {
    // apply previous choice
    if (stored === 'accepted') enableNonEssential(); else disableNonEssential();
    // show small manage button for users to change choice
    showManageButton();
    try { updateCookieBadge(stored); } catch (e) { /* ignore */ }
    return;
  }
  // show banner
  showCookieBanner();
}
// Seed example notifications for admin and users (non-destructive)
function seedSampleNotifications() {
  try {
    // Seed admin notifications if none exist
    const adminKey = 'admin_notifications';
    const existingAdmin = JSON.parse(localStorage.getItem(adminKey) || '[]');
    if (!existingAdmin || existingAdmin.length === 0) {
      const now = Date.now();
      const sampleAdmin = [
        { id: 'admin-1', title: 'Holiday Sale', message: 'Up to 25% off selected electronics — ends Jan 31.', time: now, read: false },
        { id: 'admin-2', title: 'New Stock', message: 'New generators and air conditioners now available in-store.', time: now - 3600 * 1000, read: false },
        { id: 'admin-3', title: 'Service Notice', message: 'Scheduled maintenance on payments gateway this Sunday 2AM–4AM.', time: now - 86400 * 1000, read: false }
      ];
      localStorage.setItem(adminKey, JSON.stringify(sampleAdmin));
    }

    // Seed current user's customer notifications, or a demo key if no user logged in
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if (currentUser) {
      const userKey = 'customer_notifications_' + (currentUser.id || currentUser.email || currentUser.name);
      const existing = JSON.parse(localStorage.getItem(userKey) || '[]');
      if (!existing || existing.length === 0) {
        const now = Date.now();
        const sample = [
          { id: 'cust-1', title: 'Welcome!', message: `Thanks for joining, ${currentUser.name.split(' ')[0]} — enjoy exclusive deals.`, time: now, read: false },
          { id: 'order-1', title: 'Order Shipped', message: 'Your order #12345 has been shipped. Track it in your receipts.', time: now - 2 * 3600 * 1000, read: false },
          { id: 'promo-1', title: 'Special Offer', message: 'Use code NEW10 for 10% off your next purchase.', time: now - 24 * 3600 * 1000, read: false }
        ];
        localStorage.setItem(userKey, JSON.stringify(sample));
      }
    } else {
      const demoKey = 'customer_notifications_demo@example.com';
      const demo = JSON.parse(localStorage.getItem(demoKey) || '[]');
      if (!demo || demo.length === 0) {
        localStorage.setItem(demoKey, JSON.stringify([
          { id: 'demo-1', title: 'Demo Notification', message: 'Log in to see personalized notifications. Try demo@example.com', time: Date.now(), read: false }
        ]));
      }
    }
  } catch (err) {
    console.error('seedSampleNotifications error', err);
  }
}

// Initialize receipts UI on load
document.addEventListener('DOMContentLoaded', () => {
  try { migrateStoredPhones(); } catch(e) { /* ignore */ }
  // Seed sample notifications if needed
  try { seedSampleNotifications(); } catch (e) { /* ignore */ }
  renderReceipts();
  // initialize cookie banner after the main UI is ready
  try { initCookieBanner(); } catch (e) { console.error('Cookie banner init error', e); }
});

// Back to top button behavior
(function() {
  function onReady() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    const SHOW_AFTER = 300;
    function update() {
      const sc = window.pageYOffset || document.documentElement.scrollTop || 0;
      const nearBottom = (document.documentElement.scrollHeight - window.innerHeight - sc) < 120;
      btn.classList.toggle('show', sc > SHOW_AFTER || nearBottom);
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      try {
        if (prefersReduce) window.scrollTo(0,0);
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        window.scrollTo(0,0);
      }
      btn.blur();
    });
  }
  if (document.readyState === 'complete' || document.readyState === 'interactive') onReady();
  else document.addEventListener('DOMContentLoaded', onReady);
})();



// -------------------- End of script ---------------->
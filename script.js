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

  const paid = JSON.parse(localStorage.getItem('paid_orders') || '[]');
  const cod = JSON.parse(localStorage.getItem('cash_orders') || '[]');

  const all = [
    ...paid.map(o => ({ ...o, _type: 'paid' })),
    ...cod.map(o => ({ ...o, _type: 'cod' }))
  ];

  if (all.length === 0) {
    receiptsListEl.innerHTML = '<p style="text-align:center; color:#666;">No receipts found yet. Complete a purchase to see receipts here.</p>';
    return;
  }

  // sort by timestamp desc
  all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  all.forEach(order => {
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
});




// Simple product search — filters product cards by title and description.
// Include this file after your main script.js or merge the logic into it.

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const productCards = () => Array.from(document.querySelectorAll('.product-card'));
  const productsSection = document.querySelector('#products .product-grid');
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
    hamburger.addEventListener('click', () => {
        const isOpen = navUl.classList.toggle('show');
        // set aria-hidden on nav and toggle active on hamburger for animation
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
        // Do not call focus() here to avoid opening the on-screen keyboard on mobile devices.
        // When the user explicitly taps the search field, it will receive focus as expected.
        if (!isOpen && mobileInput) {
            // blur any lingering focus when closing the menu
            try { mobileInput.blur(); } catch (e) {}
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
const paystackPublicKey = 'pk_live_b6107994278a9ccd508d5e7a08c12586e64b1ee1';

// Bank transfer details (used for copy-to-clipboard helper in Paystack bank transfer flows)
const BANK_ACCOUNT_NUMBER = '0123456789';
const BANK_NAME = 'Zenith Bank';
const BANK_ACCOUNT_NAME = 'Cympet Shop';

// Show bank instructions panel for a given context ('checkout' | 'delivery')
function showBankInstructions(context) {
    const containerId = (context === 'delivery') ? 'delivery-bank-instructions' : 'checkout-bank-instructions';
    const container = document.getElementById(containerId);
    if (!container) return;
    const accEl = container.querySelector('.bank-account-number');
    if (accEl) accEl.textContent = `${BANK_ACCOUNT_NUMBER} (${BANK_NAME}) — ${BANK_ACCOUNT_NAME}`;
    container.style.display = '';
}

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
document.addEventListener('DOMContentLoaded', () => {
    const copyDeliveryBtn = document.getElementById('copy-delivery-bank-btn');
    if (copyDeliveryBtn) {
        copyDeliveryBtn.addEventListener('click', () => copyToClipboard(`${BANK_ACCOUNT_NUMBER} (${BANK_NAME}) — ${BANK_ACCOUNT_NAME}`, copyDeliveryBtn));
    }
    const copyCheckoutBtn = document.getElementById('copy-checkout-bank-btn');
    if (copyCheckoutBtn) {
        copyCheckoutBtn.addEventListener('click', () => copyToClipboard(`${BANK_ACCOUNT_NUMBER} (${BANK_NAME}) — ${BANK_ACCOUNT_NAME}`, copyCheckoutBtn));
    }
});

// Build "Shop by Category" area (keeps Featured Products unchanged)
document.addEventListener('DOMContentLoaded', function() {
  try {
    const productsGrid = document.querySelector('#products .product-grid');
    if (!productsGrid) return;

    const originalCards = Array.from(productsGrid.querySelectorAll('.product-card'));
    const categories = [
      { name: 'Cooling & Fans', test: t => /\b(fan|ceiling fan|standing fan|wall fan|air conditioner|air)\b/i.test(t) },
      { name: 'Kitchen Appliances', test: t => /\b(blender|freezer|refrigerator|fridge|microwave|oven)\b/i.test(t) },
      { name: 'Power & Generators', test: t => /\b(generator|generators|stabilizer|stabilizers|inverter)\b/i.test(t) },
      { name: 'Audio & Music', test: t => /\b(sound|microphone|microphones|speaker|sound system|soundbar)\b/i.test(t) },
      { name: 'Computing & Accessories', test: t => /\b(laptop|computer|pc|keyboard|mouse|printer)\b/i.test(t) }
    ];

    const map = new Map();
    categories.forEach(c => map.set(c.name, []));
    map.set('Other', []);

    originalCards.forEach(card => {
      const title = card.querySelector('h3') ? card.querySelector('h3').textContent.trim() : '';
      let matched = false;
      for (const c of categories) {
        if (c.test(title)) { map.get(c.name).push(card); matched = true; break; }
      }
      if (!matched) map.get('Other').push(card);
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
      'Computing & Accessories': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="1"/><rect x="1" y="19" width="22" height="2"/></svg>
      `,
      'Other': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16V8l-9-5-9 5v8l9 5 9-5z"/><path d="M3.27 6.96L12 11.57 20.73 6.96"/></svg>
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
          document.getElementById('modal-image').src = imageSrc;
          document.getElementById('modal-description').textContent = description;
          const modalPriceEl = document.getElementById('modal-price');
          if (modalPriceEl) modalPriceEl.textContent = getProductDetails(title).priceStr || '';

          document.getElementById('product-details').style.display = 'block';
          document.getElementById('modal-specs').style.display = 'none';
          document.getElementById('modal-variants').style.display = 'none';
          modal.style.display = 'block';
        });

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
    ]
    // Add more variants if needed
};

// Catalog entries used when user adds the displayed product card items directly to cart
const productCatalog = {
    'Air Conditioners': { name: 'Air Conditioners', description: 'Energy-saving split and window AC units', priceStr: '₦100', unit_price: 100, stock: 8 },
    'Blenders': { name: 'Blenders', description: 'High-performance kitchen blenders', priceStr: '₦60,000', unit_price: 60000, stock: 12 },
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
    'Wall Fans': { name: 'Wall Fans', description: 'Wall-mounted fans', priceStr: '₦30,000', unit_price: 30000, stock: 11 }
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
                    stock: (typeof variant.stock === 'number') ? variant.stock : null
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
            stock: (typeof productCatalog[key].stock === 'number') ? productCatalog[key].stock : null
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
        document.getElementById('modal-image').src = imageSrc;
        document.getElementById('modal-description').textContent = description;
        const modalPriceEl = document.getElementById('modal-price');
        if (modalPriceEl) modalPriceEl.textContent = getProductDetails(title).priceStr || '';

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
            const incDisabled = (typeof details.stock === 'number' && quantity >= details.stock) ? 'disabled' : '';
            itemDiv.innerHTML = `
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

    // Enable/disable the PAY NOW button depending on cart contents
    const cartPayBtn = document.getElementById('cart-pay-btn');
    if (cartPayBtn) {
        if (total <= 0) {
            cartPayBtn.disabled = true;
        } else {
            cartPayBtn.disabled = false;
            cartPayBtn.textContent = 'PAY NOW';
        }
    }

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

            const paymentOrder = {
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
    if (Object.keys(cart).length === 0) {
        alert('Your cart is empty! Add items before placing an order.');
        return;
    }
    showDeliveryModal('delivery');
}

// Pickup flow (same behavior as home delivery)
function initiatePickup() {
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
        if (modeInput) modeInput.value = 'delivery';
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

    // Reset transient payment state and disable Confirm until payment completes
    deliveryPaymentConfirmed = false;
    deliveryPaymentInfo = null;
    if (deliverySubmitBtn) { deliverySubmitBtn.disabled = true; deliverySubmitBtn.textContent = 'Confirm Order'; }
    const deliveryPayBtn = document.getElementById('delivery-pay-btn');
    if (deliveryPayBtn) { deliveryPayBtn.disabled = false; }

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
            if (deliverySubmitBtn) { deliverySubmitBtn.disabled = true; deliverySubmitBtn.textContent = 'Confirm Order'; }
            deliveryPaymentConfirmed = false;
            deliveryPaymentInfo = null;

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
                    { display_name: "Delivery Type", variable_name: "delivery_type", value: mode },
                    { display_name: "Delivery Address", variable_name: "delivery_address", value: address }
                ]
            },
            callback: function(response) {
                // Payment accepted by Paystack — record the payment and enable Confirm.
                alert('Payment successful! Reference: ' + response.reference);

                const paymentOrder = {
                    name,
                    email,
                    phone,
                    cart: items,
                    total: formatPrice(paymentTotal),
                    timestamp: new Date().toISOString(),
                    orderId: 'PS_' + response.reference,
                    payment_reference: response.reference,
                    payment_method: 'Paystack',
                    delivery_type: mode,
                    address,
                    city,
                    notes
                };

                // Mark payment confirmed and store the snapshot for finalization on Confirm
                deliveryPaymentConfirmed = true;
                deliveryPaymentInfo = paymentOrder;

                // Inform the user and enable Confirm button
                const arrangementText = (mode === 'pickup') ? 'pickup arrangements' : 'delivery arrangements';
                showDeliveryStatus(`Payment successful (ref ${response.reference}). Click Confirm Order to complete your ${arrangementText}.`, 'success');
                if (deliverySubmitBtn) { deliverySubmitBtn.disabled = false; deliverySubmitBtn.textContent = 'Confirm Order (Paid)'; }

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

    const imageSrc = document.getElementById('modal-image') ? document.getElementById('modal-image').src : '';
    const details = getProductDetails(title) || {};
    const specs = productSpecs[title];

    if (!specs) {
        specsContainer.innerHTML = '<p>No detailed specifications available for this product at the moment.</p>';
    } else {
        // build spec rows
        let rows = '';
        for (const key in specs) {
            rows += `<div class="spec-row"><dt>${key}</dt><dd>${specs[key]}</dd></div>`;
        }

        const html = `
          <div class="specs-grid">
            <div class="specs-image"><img src="${imageSrc}" alt="${escapeHtml(title)}"></div>
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

  // Build preview message using same text we send
  const previewText = `Hi ${email.split('@')[0] || ''}!,\n\nThanks for subscribing to Cympet and Co. Congratulations — you're now signed up to receive exclusive offers, new arrivals and product updates. Use code WELCOME10 on your next purchase.\n\nBest regards,\nCympet and Co Team`;

  showNewsletterPreview(email, previewText);
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

// Send to Web3Forms and save to server-side storage
function sendNewsletterSubscription(email) {
  const emailEl = document.getElementById('newsletter-email');
  const accessKey = (window.NEWSLETTER_ACCESS_KEY && String(window.NEWSLETTER_ACCESS_KEY).trim()) ||
                    (document.getElementById('newsletter-access-key') && document.getElementById('newsletter-access-key').value.trim()) || '';

  const payload = {
    access_key: accessKey,
    subject: 'Welcome to Cympet and Co Newsletter!',
    email: email,
    message: `Hi there!\n\nThanks for subscribing to Cympet and Co. Congratulations — you're now signed up to receive exclusive offers, new arrivals and product updates. Use code WELCOME10 on your next purchase.\n\nBest regards,\nCympet and Co Team`,
    html: `<p>Hi there,</p><p><strong>Thanks for subscribing to Cympet and Co.</strong> Congratulations — you're now signed up to receive exclusive offers, product launches and updates. Use code <strong>WELCOME10</strong> on your next purchase.</p><p>Best regards,<br/>Cympet and Co Team</p>`,
    auto_response: true,
    from_name: 'Cympet and Co',
    data: { email }
  };

  // If accessKey present, submit to Web3Forms; otherwise skip directly to server save
  const doWeb3 = Boolean(accessKey);

  const finishSuccess = () => {
    // Save to backend storage
    fetch('/newsletter-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
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
      body: JSON.stringify({ email })
    }).then(r => r.json()).then(j => {
      notifySuccess("Thanks — you're subscribed! (saved)");
      hideNewsletterPreview();
      if (emailEl) emailEl.value = '';
    }).catch(err => {
      console.error('Server save error:', err);
      try {
        const list = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
        list.push({ email: email, created: new Date().toISOString() });
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

// Initialize receipts UI on load
document.addEventListener('DOMContentLoaded', () => {
  try { migrateStoredPhones(); } catch(e) { /* ignore */ }
    renderReceipts();
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
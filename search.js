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
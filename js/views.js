/* ═══════════════════════════════════════════════════════════
   UniMall · js/views.js
   All non-home screen renderers + navigation controller.
   Depends on: data.js, state.js, ui.js, cart.js
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════
   NAVIGATION CONTROLLER
   ═══════════════════════════════════════════════════════════ */

/**
 * Navigate to a named view. Updates active nav states and
 * either shows the home page or opens the overlay.
 * @param {string} viewName
 * @param {Object} [params]
 */
function navigate(viewName, params = {}) {
  setState({ ui: { currentView: viewName, ...params } });
  _syncNavActiveState(viewName);

  switch (viewName) {
    case 'home':           closeOverlay(); renderHome(); break;
    case 'stores':         window.location.href = 'stores.html'; break;
    case 'product':        _openProduct(params.selectedProductId); break;
    case 'cart':           window.location.href = 'cart.html'; break;
    case 'checkout':       window.location.href = 'cart.html'; break;
    case 'order-confirm':  _openOrderConfirmation(params.selectedOrderId); break;
    case 'orders':         window.location.href = 'orders.html'; break;
    case 'order-detail':   window.location.href = `orders.html#${params.selectedOrderId || ''}`; break;
    case 'profile':        window.location.href = 'profile.html'; break;
    case 'notifications':  _openNotifications(); break;
    case 'request':        _openRequestForm(); break;
    default:               closeOverlay();
  }
}

function _syncNavActiveState(viewName) {
  const navMap = {
    home: 'nav-home', stores: 'nav-stores', cart: 'nav-cart', checkout: 'nav-cart',
    orders: 'nav-orders', 'order-detail': 'nav-orders',
    'order-confirm': 'nav-orders',
    profile: 'nav-profile', notifications: 'nav-home',
    product: null, request: null,
  };
  const targetId = navMap[viewName];

  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active');
    el.removeAttribute('aria-current');
  });
  if (targetId) {
    const el = document.getElementById(targetId);
    if (el) { el.classList.add('active'); el.setAttribute('aria-current', 'page'); }
  }

  // Sidebar
  const sbMap = {
    home: 'sb-home', stores: 'sb-stores', cart: 'sb-cart', orders: 'sb-orders',
    'order-detail': 'sb-orders', profile: 'sb-profile',
    request: 'sb-request',
  };
  const sbId = sbMap[viewName];
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.remove('active'); el.removeAttribute('aria-current');
  });
  if (sbId) {
    const el = document.getElementById(sbId);
    if (el) { el.classList.add('active'); el.setAttribute('aria-current', 'page'); }
  }
}

/* ═══════════════════════════════════════════════════════════
   HOME — filtered product sections
   ═══════════════════════════════════════════════════════════ */

let categoryPageLimit = 10;
window.resetCategoryPageLimit = () => { categoryPageLimit = 10; };

function renderHome() {
  const { searchQuery, selectedCategoryId, activeFilters } = AppState.ui;

  // 1. If a category is selected, show dedicated category products view
  if (selectedCategoryId) {
    _renderCategoryView(selectedCategoryId);
    return;
  }

  // 2. Otherwise ensure category section is hidden and default flow is visible
  const categorySection = document.getElementById('category-view-section');
  const defaultFlow = document.getElementById('home-default-flow');
  if (categorySection) categorySection.style.display = 'none';
  if (defaultFlow) {
    defaultFlow.style.display = '';
    defaultFlow.style.opacity = '1';
    defaultFlow.style.transform = 'none';
  }

  const isFiltered = searchQuery || activeFilters.length > 0;
  if (isFiltered) {
    _renderFilteredResults();
  } else {
    _renderDefaultHomeSections();
  }
}

function _renderCategoryView(categoryId) {
  const categorySection = document.getElementById('category-view-section');
  const defaultFlow = document.getElementById('home-default-flow');
  if (!categorySection) return;

  const cat = CATEGORIES.find(c => c.id === categoryId);
  const catName = cat ? cat.label : 'Category Products';

  // Filter products for this category
  const { activeFilters } = AppState.ui;
  let allCategoryProducts = AppState.products.filter(p => {
    if (categoryId === 'more') return true;
    return p.categoryId === categoryId;
  });

  // Also apply active availability chips if any
  for (const chipId of activeFilters) {
    const chip = AVAIL_CHIPS.find(c => c.id === chipId);
    if (chip) {
      allCategoryProducts = allCategoryProducts.filter(p => p[chip.field] === chip.value);
    }
  }

  const total = allCategoryProducts.length;
  const visibleProducts = allCategoryProducts.slice(0, categoryPageLimit);

  // Update header title & count badge
  const titleEl = document.getElementById('category-view-title');
  const countBadge = document.getElementById('category-view-count-badge');
  if (titleEl) titleEl.textContent = catName;
  if (countBadge) {
    countBadge.textContent = total > 0 ? `${visibleProducts.length} of ${total} items` : '0 items';
  }

  // Wire clear filter button
  const clearBtn = document.getElementById('category-view-clear-btn');
  if (clearBtn) {
    clearBtn.onclick = (e) => {
      e.preventDefault();
      _clearCategoryFilter();
    };
  }

  // Render 2-column grid
  const grid = document.getElementById('category-products-grid');
  if (grid) {
    if (visibleProducts.length === 0) {
      grid.innerHTML = `
        <div class="empty-category-view" style="grid-column: 1 / -1; text-align: center; padding: 48px 16px;">
          <div style="font-size: 38px; margin-bottom: 8px;">📦</div>
          <div style="font-weight: 700; font-size: 16px; color: var(--text-primary);">No items in this category yet</div>
          <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">Check back soon as campus stores restock.</div>
          <button class="empty-results-btn" style="margin-top: 16px;" id="empty-cat-clear-btn">Browse All Products</button>
        </div>
      `;
      grid.querySelector('#empty-cat-clear-btn')?.addEventListener('click', _clearCategoryFilter);
    } else {
      grid.innerHTML = visibleProducts.map(buildProductCard).join('');
      _wireCategoryCardEvents(grid);
    }
  }

  // Load More Button
  const loadMoreWrap = document.getElementById('category-load-more-wrap');
  const loadMoreBtn = document.getElementById('btn-load-more');
  if (loadMoreWrap && loadMoreBtn) {
    if (visibleProducts.length < total) {
      const remaining = total - visibleProducts.length;
      loadMoreWrap.style.display = 'flex';
      loadMoreBtn.disabled = false;
      loadMoreBtn.style.pointerEvents = 'auto';
      loadMoreBtn.style.opacity = '1';
      loadMoreBtn.innerHTML = `
        <span>Load More Products (+${remaining})</span>
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polyline points="6 9 12 15 18 9"/></svg>
      `;
      loadMoreBtn.onclick = (e) => {
        e.preventDefault();
        categoryPageLimit += 6;
        loadMoreBtn.innerHTML = `<span>Loading products...</span>`;
        setTimeout(() => {
          _renderCategoryView(categoryId);
        }, 120);
      };
    } else if (total > 0) {
      loadMoreWrap.style.display = 'flex';
      loadMoreBtn.disabled = true;
      loadMoreBtn.style.pointerEvents = 'none';
      loadMoreBtn.style.opacity = '0.6';
      loadMoreBtn.innerHTML = `<span>All ${total} products loaded ✓</span>`;
    } else {
      loadMoreWrap.style.display = 'none';
    }
  }

  // Smooth fade transition: fade out default sections and fade in category section
  if (defaultFlow && defaultFlow.style.display !== 'none') {
    defaultFlow.classList.add('fading-out');
    setTimeout(() => {
      defaultFlow.style.display = 'none';
      defaultFlow.classList.remove('fading-out');
      categorySection.style.display = 'block';
    }, 150);
  } else {
    categorySection.style.display = 'block';
  }
}

function _clearCategoryFilter() {
  categoryPageLimit = 10;
  setState({ ui: { selectedCategoryId: null, searchQuery: '', activeFilters: [] } });
  document.querySelectorAll('.category-item').forEach(ci => ci.classList.remove('active'));

  const categorySection = document.getElementById('category-view-section');
  const defaultFlow = document.getElementById('home-default-flow');

  if (categorySection && defaultFlow) {
    categorySection.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    categorySection.style.opacity = '0';
    categorySection.style.transform = 'translateY(12px)';

    setTimeout(() => {
      categorySection.style.display = 'none';
      categorySection.style.opacity = '';
      categorySection.style.transform = '';
      categorySection.style.transition = '';

      defaultFlow.style.display = '';
      defaultFlow.style.opacity = '0';
      defaultFlow.style.transform = 'translateY(12px)';
      requestAnimationFrame(() => {
        defaultFlow.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        defaultFlow.style.opacity = '1';
        defaultFlow.style.transform = 'translateY(0)';
      });
    }, 180);
  }

  _renderDefaultHomeSections();
}

function _wireCategoryCardEvents(container) {
  container.querySelectorAll('.add-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      cartAdd(btn.dataset.pid);
      updateCartBadges();
      showToast('Added to cart');

      btn.classList.add('pulse');
      setTimeout(() => btn.classList.remove('pulse'), 200);
    });
  });

  container.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => navigate('product', { selectedProductId: card.dataset.pid }));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter') navigate('product', { selectedProductId: card.dataset.pid });
    });
  });
}

function _renderDefaultHomeSections() {
  // Show normal section headers
  _setHomeSectionsVisible(true);

  const nearYou    = AppState.products.filter(p => p.isNearby);
  const popular    = AppState.products.filter(p => p.isPopular);
  const restocked  = AppState.products.filter(p => p.isRestocked);

  _fillProductSection('near-you-scroll',  nearYou);
  _fillProductSection('popular-scroll',   popular);
  _fillProductSection('restocked-scroll', restocked);
}

function _renderFilteredResults() {
  const filtered = getFilteredProducts();

  // Hide default sections and use "Available Near You" slot for results
  _setHomeSectionsVisible(false);

  const section = document.getElementById('near-you-section');
  if (!section) return;
  section.style.display = '';

  const header = section.querySelector('.section-title');
  if (header) {
    const q = AppState.ui.searchQuery;
    header.textContent = q ? `Results for "${q}"` : 'Filtered Results';
  }

  const link = section.querySelector('.section-link');
  if (link) link.style.display = 'none';

  if (filtered.length === 0) {
    const container = document.getElementById('near-you-scroll');
    if (container) {
      container.innerHTML = `
        <div class="empty-results">
          <div class="empty-results-emoji">🔍</div>
          <div class="empty-results-title">Nothing found</div>
          <div class="empty-results-sub">Try a different search term or clear your filters.</div>
          <button class="empty-results-btn" id="clear-filters-btn">Clear filters</button>
        </div>
      `;
      container.querySelector('#clear-filters-btn')?.addEventListener('click', () => {
        setState({ ui: { searchQuery: '', selectedCategoryId: null, activeFilters: [] } });
        document.getElementById('main-search').value = '';
        _resetCategoryHighlight();
        _resetChipHighlight();
        renderHome();
      });
    }
  } else {
    _fillProductSection('near-you-scroll', filtered);
  }
}

function _setHomeSectionsVisible(visible) {
  ['near-you-section', 'popular-section', 'restocked-section'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = visible ? '' : 'none';

    const header = el.querySelector('.section-title');
    const link   = el.querySelector('.section-link');
    if (header) {
      // Restore original titles
      const titles = { 'near-you-section': 'Available Near You', 'popular-section': 'Popular Right Now', 'restocked-section': 'Recently Restocked' };
      header.textContent = titles[id] || header.textContent;
    }
    if (link) link.style.display = '';
  });

  if (!visible) {
    document.getElementById('near-you-section').style.display = '';
  }
}

/* ═══════════════════════════════════════════════════════════
   PRODUCT CARD BUILDER
   ═══════════════════════════════════════════════════════════ */

function buildProductCard(product) {
  const { id, name, price, availability, stock, storeId, emoji, image, bg } = product;
  const store       = getStore(storeId) || {};
  const unavailable = availability === 'out-of-stock';

  const availMap = {
    'in-stock':     { cls: 'in-stock',    label: 'In stock' },
    'low-stock':    { cls: 'low-stock',   label: `Only ${stock} left` },
    'out-of-stock': { cls: 'out-of-stock',label: 'Out of stock' },
    'preorder':     { cls: 'preorder',    label: 'Pre-order' },
  };
  const avail = availMap[availability] || availMap['in-stock'];

  const imgHtml = image
    ? `<img class="product-thumb-img" src="${image}" alt="${name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><span class="product-fallback-emoji" style="display:none;" aria-hidden="true">${emoji}</span>`
    : `<span class="product-fallback-emoji" aria-hidden="true">${emoji}</span>`;

  return `
    <article class="product-card" role="listitem" id="product-${id}"
             tabindex="0" data-pid="${id}"
             aria-label="${name}, ₹${fmtPrice(price)}, ${avail.label}">
      <div class="product-img-wrap" style="background:${bg};" aria-hidden="true">${imgHtml}</div>
      <div class="product-info">
        <div class="product-name">${name}</div>
        <div class="product-store">${store.name || ''}</div>
        <div class="product-price"><span class="currency">₹</span>${fmtPrice(price)}</div>
        <div class="product-footer">
          <span class="avail-badge ${avail.cls}">
            <span class="dot" aria-hidden="true"></span>
            <span class="avail-badge-text">${avail.label}</span>
          </span>
          <button
            class="add-btn${unavailable ? ' disabled' : ''}"
            ${unavailable ? 'disabled aria-disabled="true"' : `data-pid="${id}"`}
            aria-label="${unavailable ? `${name} unavailable` : `Add ${name} to cart`}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>
    </article>
  `;
}

function _fillProductSection(containerId, products) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!products || products.length === 0) {
    const section = container.closest('section');
    if (section) section.style.display = 'none';
    return;
  }

  container.innerHTML = products.map(buildProductCard).join('');

  container.querySelectorAll('.add-btn:not(.disabled)').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      cartAdd(btn.dataset.pid);
      updateCartBadges();
      showToast('Added to cart');

      btn.classList.add('pulse');
      setTimeout(() => btn.classList.remove('pulse'), 200);
    });
  });

  container.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => navigate('product', { selectedProductId: card.dataset.pid }));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter') navigate('product', { selectedProductId: card.dataset.pid });
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   PRODUCT DETAIL
   ═══════════════════════════════════════════════════════════ */

function _openProduct(productId) {
  const p = getProduct(productId);
  if (!p) return;
  const store = getStore(p.storeId) || {};

  const inCart = AppState.cart.find(l => l.productId === p.id);
  const qty    = inCart ? inCart.qty : 0;
  const unavailable = p.availability === 'out-of-stock';

  const pdImgHtml = p.image
    ? `<img class="pd-full-img" src="${p.image}" alt="${p.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"><span class="pd-emoji" style="display:none;">${p.emoji}</span>`
    : `<span class="pd-emoji">${p.emoji}</span>`;

  const html = `
    <div class="pd-img-wrap" style="background:${p.bg};" aria-hidden="true">
      ${pdImgHtml}
    </div>

    <div class="pd-body">
      <div class="pd-store">${store.name || ''}</div>
      <h1 class="pd-name">${p.name}</h1>
      <div class="pd-price"><span class="currency">₹</span>${fmtPrice(p.price)}</div>

      <div class="pd-meta-row">
        ${availBadgeHtml(p)}
        ${p.rating ? `<span class="pd-rating">★ ${p.rating.toFixed(1)}</span>` : ''}
      </div>

      <p class="pd-description">${p.description}</p>

      <div class="pd-info-grid">
        <div class="pd-info-item">
          <span class="pd-info-icon">🏪</span>
          <div>
            <div class="pd-info-label">Store</div>
            <div class="pd-info-val">${store.name || '—'} · ${store.floor || ''} floor</div>
          </div>
        </div>
        <div class="pd-info-item">
          <span class="pd-info-icon">${p.deliveryAvailable ? '🛵' : '❌'}</span>
          <div>
            <div class="pd-info-label">Hostel Delivery</div>
            <div class="pd-info-val">${p.deliveryAvailable ? 'Available' : 'Not available'}</div>
          </div>
        </div>
        <div class="pd-info-item">
          <span class="pd-info-icon">${p.pickupAvailable ? '📦' : '❌'}</span>
          <div>
            <div class="pd-info-label">Pickup</div>
            <div class="pd-info-val">${p.pickupAvailable ? 'Available' : 'Not available'}</div>
          </div>
        </div>
        ${store.openNow !== undefined ? `
        <div class="pd-info-item">
          <span class="pd-info-icon">🕐</span>
          <div>
            <div class="pd-info-label">Store status</div>
            <div class="pd-info-val ${store.openNow ? 'text-green' : 'text-red'}">${store.openNow ? 'Open now' : 'Closed'} · ${store.hours || ''}</div>
          </div>
        </div>` : ''}
      </div>

      ${unavailable ? '' : `
      <div class="pd-qty-row">
        <span class="pd-qty-label">Quantity</span>
        <div class="pd-qty-ctrl">
          <button class="pd-qty-btn" id="pd-qty-dec" aria-label="Decrease quantity">−</button>
          <span class="pd-qty-val" id="pd-qty-val">${qty || 1}</span>
          <button class="pd-qty-btn" id="pd-qty-inc" aria-label="Increase quantity">+</button>
        </div>
      </div>`}

      <div class="pd-actions">
        ${unavailable
          ? `<button class="pd-btn-primary" disabled>Out of Stock</button>`
          : `<button class="pd-btn-primary" id="pd-add-btn">Add to Cart</button>`
        }
      </div>
    </div>
  `;

  showOverlay(html, p.name, () => navigate('home'));

  if (!unavailable) {
    let localQty = qty || 1;
    const qtyVal = document.getElementById('pd-qty-val');
    const decBtn = document.getElementById('pd-qty-dec');
    const incBtn = document.getElementById('pd-qty-inc');
    const addBtn = document.getElementById('pd-add-btn');

    const updateQtyDisplay = () => {
      if (qtyVal) qtyVal.textContent = localQty;
      if (decBtn) decBtn.disabled = localQty <= 1;
      if (incBtn) incBtn.disabled = localQty >= p.stock;
    };
    updateQtyDisplay();

    decBtn?.addEventListener('click', () => { if (localQty > 1) { localQty--; updateQtyDisplay(); } });
    incBtn?.addEventListener('click', () => { if (localQty < p.stock) { localQty++; updateQtyDisplay(); } });

    addBtn?.addEventListener('click', () => {
      // Set qty to desired amount
      const existing = AppState.cart.find(l => l.productId === p.id);
      if (existing) {
        existing.qty = Math.min(existing.qty + localQty, p.stock);
        setState({});
      } else {
        AppState.cart.push({ productId: p.id, qty: localQty });
        setState({});
      }
      updateCartBadges();
      showToast(`${p.name} added to cart`);
      closeOverlay();
      navigate('home');
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   CART
   ═══════════════════════════════════════════════════════════ */

function _openCart() {
  showOverlay(_buildCartHtml(), 'Cart', () => navigate('home'));
  _bindCartEvents();
}

function _buildCartHtml() {
  const items  = getCartItems();
  const totals = getCartTotals();

  if (items.length === 0) {
    return `
      <div class="empty-screen">
        <div class="empty-screen-emoji">🛒</div>
        <div class="empty-screen-title">Your cart is empty</div>
        <div class="empty-screen-sub">Add items from the home screen to get started.</div>
        <button class="em-btn" id="cart-browse-btn">Browse Products</button>
      </div>
    `;
  }

  const itemsHtml = items.map(line => {
    const itemImg = line.product.image
      ? `<img src="${line.product.image}" alt="${line.product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';"><span style="display:none;">${line.product.emoji}</span>`
      : `<span>${line.product.emoji}</span>`;

    return `
      <div class="cart-item" data-pid="${line.productId}">
        <div class="cart-item-img" style="background:${line.product.bg};">${itemImg}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${line.product.name}</div>
          <div class="cart-item-store">${(getStore(line.product.storeId) || {}).name || ''}</div>
          <div class="cart-item-price">₹${fmtPrice(line.product.price)}</div>
        </div>
        <div class="cart-item-controls">
          <button class="cart-qty-btn cart-dec" data-pid="${line.productId}" aria-label="Decrease">−</button>
          <span class="cart-qty">${line.qty}</span>
          <button class="cart-qty-btn cart-inc" data-pid="${line.productId}" aria-label="Increase">+</button>
          <button class="cart-remove" data-pid="${line.productId}" aria-label="Remove">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="cart-items">${itemsHtml}</div>
    <div class="cart-summary">
      <div class="cart-summary-row"><span>Subtotal</span><span>₹${fmtPrice(totals.subtotal)}</span></div>
      <div class="cart-summary-row text-secondary"><span>Delivery fee</span><span>${totals.deliveryFee > 0 ? '₹' + totals.deliveryFee : 'Calculated at checkout'}</span></div>
      <div class="cart-summary-row cart-total"><span>Total</span><span>₹${fmtPrice(totals.subtotal)}</span></div>
      <button class="cart-checkout-btn" id="cart-checkout-btn">Proceed to Checkout</button>
    </div>
  `;
}

function _bindCartEvents() {
  const overlay = document.getElementById('screen-overlay');
  if (!overlay) return;

  overlay.querySelector('#cart-checkout-btn')?.addEventListener('click', () => navigate('checkout'));
  overlay.querySelector('#cart-browse-btn')?.addEventListener('click', () => navigate('home'));

  overlay.querySelectorAll('.cart-dec').forEach(btn => {
    btn.addEventListener('click', () => {
      cartUpdateQty(btn.dataset.pid, -1);
      updateCartBadges();
      _refreshCartOverlay();
    });
  });

  overlay.querySelectorAll('.cart-inc').forEach(btn => {
    btn.addEventListener('click', () => {
      cartUpdateQty(btn.dataset.pid, 1);
      updateCartBadges();
      _refreshCartOverlay();
    });
  });

  overlay.querySelectorAll('.cart-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      cartRemove(btn.dataset.pid);
      updateCartBadges();
      _refreshCartOverlay();
    });
  });
}

function _refreshCartOverlay() {
  const body = document.querySelector('#screen-overlay .overlay-body');
  if (!body) return;
  body.innerHTML = _buildCartHtml();
  _bindCartEvents();
}

/* ═══════════════════════════════════════════════════════════
   CHECKOUT
   ═══════════════════════════════════════════════════════════ */

function _openCheckout() {
  showOverlay(_buildCheckoutHtml(), 'Checkout', () => navigate('cart'));
  _bindCheckoutEvents();
}

function _buildCheckoutHtml() {
  const items  = getCartItems();
  const totals = getCartTotals();
  const user   = AppState.currentUser;

  const orderSummaryHtml = items.map(l => `
    <div class="co-item">
      <span>${l.product.emoji} ${l.product.name} ×${l.qty}</span>
      <span>₹${fmtPrice(l.product.price * l.qty)}</span>
    </div>
  `).join('');

  return `
    <div class="co-section">
      <div class="co-section-title">Fulfillment</div>
      <div class="co-toggle-row">
        <button class="co-toggle-btn ${AppState.ui.fulfillmentType === 'pickup' ? 'active' : ''}" id="co-pickup-btn" data-type="pickup">
          📦 Campus Pickup
        </button>
        <button class="co-toggle-btn ${AppState.ui.fulfillmentType === 'delivery' ? 'active' : ''}" id="co-delivery-btn" data-type="delivery">
          🛵 Hostel Delivery
        </button>
      </div>
    </div>

    <div class="co-section" id="co-delivery-form" style="display:${AppState.ui.fulfillmentType === 'delivery' ? '' : 'none'};">
      <div class="co-section-title">Delivery details</div>
      <div class="co-form">
        <label class="co-label">Hostel</label>
        <input class="co-input" id="co-hostel" type="text" placeholder="e.g. Hostel B" value="${user.hostel || ''}"/>
        <label class="co-label">Room / Location</label>
        <input class="co-input" id="co-room" type="text" placeholder="e.g. Room 214" value="${user.room || ''}"/>
      </div>
    </div>

    <div class="co-section" id="co-pickup-info" style="display:${AppState.ui.fulfillmentType === 'pickup' ? '' : 'none'};">
      <div class="co-section-title">Pickup details</div>
      <div class="co-info-row">📍 Ground floor, near main entrance</div>
      <div class="co-info-row text-secondary">Ready in approximately 10–15 minutes after order is placed.</div>
    </div>

    <div class="co-section">
      <div class="co-section-title">Order summary</div>
      <div class="co-items">${orderSummaryHtml}</div>
      <div class="co-totals">
        <div class="co-total-row"><span>Subtotal</span><span>₹${fmtPrice(totals.subtotal)}</span></div>
        <div class="co-total-row"><span>Delivery fee</span><span>${AppState.ui.fulfillmentType === 'delivery' ? '₹20' : 'Free'}</span></div>
        <div class="co-total-row co-grand"><span>Total</span><span>₹${fmtPrice(totals.subtotal + (AppState.ui.fulfillmentType === 'delivery' ? 20 : 0))}</span></div>
      </div>
    </div>

    <div class="co-section">
      <div class="co-section-title">Payment</div>
      <div class="co-payment-note">
        <div class="co-payment-badge">TEST MODE</div>
        <div class="co-payment-text">Payments are in test mode. No real charge will be made.</div>
      </div>
      <div class="co-mock-methods">
        <label class="co-method">
          <input type="radio" name="payment" value="upi" checked/> UPI / PhonePe / GPay
        </label>
        <label class="co-method">
          <input type="radio" name="payment" value="card"/> Credit / Debit Card
        </label>
        <label class="co-method">
          <input type="radio" name="payment" value="cod"/> Pay on Pickup / Cash on Delivery
        </label>
      </div>
    </div>

    <button class="co-place-btn" id="co-place-btn">Place Order</button>
  `;
}

function _bindCheckoutEvents() {
  const overlay = document.getElementById('screen-overlay');
  if (!overlay) return;

  // Fulfillment toggle
  overlay.querySelectorAll('.co-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setState({ ui: { fulfillmentType: btn.dataset.type } });
      overlay.querySelectorAll('.co-toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const deliveryForm = overlay.querySelector('#co-delivery-form');
      const pickupInfo   = overlay.querySelector('#co-pickup-info');
      if (deliveryForm) deliveryForm.style.display = btn.dataset.type === 'delivery' ? '' : 'none';
      if (pickupInfo)   pickupInfo.style.display   = btn.dataset.type === 'pickup'   ? '' : 'none';
    });
  });

  // Place order
  overlay.querySelector('#co-place-btn')?.addEventListener('click', () => {
    const fulfillment = AppState.ui.fulfillmentType;
    let deliveryInfo  = null;

    if (fulfillment === 'delivery') {
      const hostel = overlay.querySelector('#co-hostel')?.value?.trim();
      const room   = overlay.querySelector('#co-room')?.value?.trim();
      if (!hostel || !room) {
        showToast('Please enter hostel and room details');
        return;
      }
      deliveryInfo = { hostel, room };
      // Save to user profile
      setState({ currentUser: { ...AppState.currentUser, hostel, room } });
    }

    // Mock payment delay
    const placeBtn = overlay.querySelector('#co-place-btn');
    if (placeBtn) { placeBtn.disabled = true; placeBtn.textContent = 'Processing…'; }

    setTimeout(() => {
      const orderId = placeOrder(fulfillment, deliveryInfo);
      navigate('order-confirm', { selectedOrderId: orderId });
    }, 1200);
  });
}

/* ═══════════════════════════════════════════════════════════
   ORDER CONFIRMATION
   ═══════════════════════════════════════════════════════════ */

function _openOrderConfirmation(orderId) {
  const order = AppState.orders.find(o => o.id === orderId);
  if (!order) return;

  const html = `
    <div class="confirm-screen">
      <div class="confirm-icon">✅</div>
      <div class="confirm-order-id">${order.id}</div>
      <div class="confirm-title">Order placed successfully!</div>
      <div class="confirm-sub">
        ${order.fulfillmentType === 'delivery'
          ? `Your order is being prepared and will be delivered to <strong>${order.deliveryInfo?.hostel}, ${order.deliveryInfo?.room}</strong>.`
          : `Your order is being prepared. Pick it up from the Ground floor, near main entrance.`}
      </div>
      <div class="confirm-total">Total paid: ₹${fmtPrice(order.total)}</div>
      <div class="confirm-actions">
        <button class="confirm-btn-primary" id="conf-view-order">View Order</button>
        <button class="confirm-btn-secondary" id="conf-home">Back to Home</button>
      </div>
    </div>
  `;

  showOverlay(html, 'Order Placed');
  updateCartBadges();

  document.getElementById('conf-view-order')?.addEventListener('click', () => navigate('order-detail', { selectedOrderId: orderId }));
  document.getElementById('conf-home')?.addEventListener('click', () => navigate('home'));
}

/* ═══════════════════════════════════════════════════════════
   ORDERS LIST
   ═══════════════════════════════════════════════════════════ */

function _openOrders() {
  const orders = AppState.orders;

  const statusLabel = { placed: 'Order placed', preparing: 'Preparing', ready: 'Ready', delivered: 'Delivered' };
  const statusCls   = { placed: 'status-placed', preparing: 'status-preparing', ready: 'status-ready', delivered: 'status-delivered' };

  const html = orders.length === 0
    ? `<div class="empty-screen">
        <div class="empty-screen-emoji">📦</div>
        <div class="empty-screen-title">No orders yet</div>
        <div class="empty-screen-sub">Your orders will appear here once you place one.</div>
        <button class="em-btn" id="orders-browse-btn">Browse Products</button>
       </div>`
    : `<div class="orders-list">
        ${orders.map(o => `
          <div class="order-card" data-oid="${o.id}" role="button" tabindex="0">
            <div class="order-card-top">
              <div>
                <div class="order-id">#${o.id}</div>
                <div class="order-date">${fmtDate(o.createdAt)} · ${fmtTime(o.createdAt)}</div>
              </div>
              <span class="order-status-badge ${statusCls[o.status] || ''}">${statusLabel[o.status] || o.status}</span>
            </div>
            <div class="order-items-preview">${o.items.map(i => `${i.emoji || '📦'} ${i.name} ×${i.qty}`).join(' · ')}</div>
            <div class="order-card-bottom">
              <span class="order-total">₹${fmtPrice(o.total)}</span>
              <span class="order-arrow">›</span>
            </div>
          </div>
        `).join('')}
       </div>`;

  showOverlay(html, 'My Orders', () => navigate('home'));

  document.querySelectorAll('.order-card').forEach(card => {
    card.addEventListener('click', () => navigate('order-detail', { selectedOrderId: card.dataset.oid }));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') card.click(); });
  });
  document.getElementById('orders-browse-btn')?.addEventListener('click', () => navigate('home'));
}

/* ═══════════════════════════════════════════════════════════
   ORDER DETAIL
   ═══════════════════════════════════════════════════════════ */

function _openOrderDetail(orderId) {
  const order = AppState.orders.find(o => o.id === orderId);
  if (!order) { navigate('orders'); return; }

  const steps   = ['placed', 'preparing', 'ready', 'delivered'];
  const stepLabels = { placed: 'Order placed', preparing: 'Preparing', ready: order.fulfillmentType === 'delivery' ? 'Out for delivery' : 'Ready for pickup', delivered: order.fulfillmentType === 'delivery' ? 'Delivered' : 'Picked up' };
  const curIdx  = steps.indexOf(order.status);

  const timelineHtml = steps.map((s, i) => `
    <div class="timeline-step ${i <= curIdx ? 'done' : ''} ${i === curIdx ? 'current' : ''}">
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-label">${stepLabels[s]}</div>
        ${i <= curIdx && order.statusHistory[i] ? `<div class="timeline-time">${fmtTime(order.statusHistory[i].time)}</div>` : ''}
      </div>
    </div>
  `).join('');

  const itemsHtml = order.items.map(i => `
    <div class="od-item">
      <span>${i.name} ×${i.qty}</span>
      <span>₹${fmtPrice(i.price * i.qty)}</span>
    </div>
  `).join('');

  const html = `
    <div class="od-header-row">
      <div>
        <div class="od-order-id">#${order.id}</div>
        <div class="od-date">${fmtDate(order.createdAt)}</div>
      </div>
    </div>

    <div class="od-section">
      <div class="od-section-title">Status</div>
      <div class="timeline">${timelineHtml}</div>
    </div>

    <div class="od-section">
      <div class="od-section-title">${order.fulfillmentType === 'delivery' ? 'Delivery to' : 'Pickup from'}</div>
      <div class="od-info-val">
        ${order.fulfillmentType === 'delivery'
          ? `${order.deliveryInfo?.hostel}, ${order.deliveryInfo?.room}`
          : 'Ground floor, near main entrance'}
      </div>
    </div>

    <div class="od-section">
      <div class="od-section-title">Items</div>
      ${itemsHtml}
    </div>

    <div class="od-section">
      <div class="od-total-row"><span>Subtotal</span><span>₹${fmtPrice(order.subtotal)}</span></div>
      <div class="od-total-row"><span>Delivery fee</span><span>₹${fmtPrice(order.deliveryFee)}</span></div>
      <div class="od-total-row od-grand"><span>Total</span><span>₹${fmtPrice(order.total)}</span></div>
    </div>
  `;

  showOverlay(html, `Order #${order.id}`, () => navigate('orders'));
}

/* ═══════════════════════════════════════════════════════════
   PROFILE
   ═══════════════════════════════════════════════════════════ */

function _openProfile() {
  const u = AppState.currentUser || {};
  const orderCount = AppState.orders.length;
  const avatarSrc = u.avatar || (typeof window.getStickerAvatar === 'function' ? window.getStickerAvatar(u.name || 'Student') : '');
  const avatarEl = avatarSrc
    ? `<img src="${avatarSrc}" alt="${u.name}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`
    : (u.name ? u.name[0].toUpperCase() : 'A');

  const html = `
    <div class="profile-header">
      <div class="profile-avatar">${avatarEl}</div>
      <div class="profile-name">${u.name}</div>
      <div class="profile-sub">${u.email}</div>
    </div>

    <div class="profile-section">
      <div class="profile-section-title">Campus details</div>
      <div class="profile-row">
        <span class="profile-label">Hostel</span>
        <input class="profile-input" id="prof-hostel" type="text" value="${u.hostel}" placeholder="Your hostel"/>
      </div>
      <div class="profile-row">
        <span class="profile-label">Room</span>
        <input class="profile-input" id="prof-room" type="text" value="${u.room}" placeholder="Room number"/>
      </div>
      <button class="profile-save-btn" id="prof-save-btn">Save changes</button>
    </div>

    <div class="profile-section">
      <div class="profile-section-title">Activity</div>
      <div class="profile-menu-item" id="prof-orders" role="button" tabindex="0">
        <span>📦 My Orders</span>
        <span class="profile-menu-count">${orderCount}</span>
        <span class="profile-menu-arrow">›</span>
      </div>
      <div class="profile-menu-item" id="prof-requests" role="button" tabindex="0">
        <span>🔍 Item Requests</span>
        <span class="profile-menu-count">${AppState.itemRequests.length}</span>
        <span class="profile-menu-arrow">›</span>
      </div>
    </div>

    <div class="profile-section">
      <div class="profile-section-title">Support</div>
      <div class="profile-menu-item" role="button" tabindex="0">
        <span>❓ Help & Support</span>
        <span class="profile-menu-arrow">›</span>
      </div>
      <div class="profile-menu-item" role="button" tabindex="0">
        <span>📄 Terms & Privacy</span>
        <span class="profile-menu-arrow">›</span>
      </div>
    </div>
  `;

  showOverlay(html, 'Profile', () => navigate('home'));

  document.getElementById('prof-save-btn')?.addEventListener('click', () => {
    const hostel = document.getElementById('prof-hostel')?.value?.trim();
    const room   = document.getElementById('prof-room')?.value?.trim();
    setState({ currentUser: { ...AppState.currentUser, hostel, room } });
    showToast('Profile saved');
  });

  document.getElementById('prof-orders')?.addEventListener('click', () => navigate('orders'));
}

/* ═══════════════════════════════════════════════════════════
   NOTIFICATIONS
   ═══════════════════════════════════════════════════════════ */

function _openNotifications() {
  // Mark all as read
  AppState.notifications.forEach(n => { n.read = true; });
  setState({});
  _updateNotifDot();

  const iconMap = { order: '📦', stock: '🛒', request: '🔍' };

  const html = AppState.notifications.length === 0
    ? `<div class="empty-screen">
        <div class="empty-screen-emoji">🔔</div>
        <div class="empty-screen-title">No notifications</div>
       </div>`
    : `<div class="notif-list">
        ${AppState.notifications.map(n => `
          <div class="notif-item ${n.read ? '' : 'unread'}">
            <div class="notif-icon">${iconMap[n.type] || '🔔'}</div>
            <div class="notif-content">
              <div class="notif-title">${n.title}</div>
              <div class="notif-body">${n.body}</div>
              <div class="notif-time">${n.time}</div>
            </div>
          </div>
        `).join('')}
       </div>`;

  showOverlay(html, 'Notifications', () => navigate('home'));
}

function _updateNotifDot() {
  const dot = document.querySelector('.notif-dot');
  if (!dot) return;
  dot.style.display = getUnreadCount() > 0 ? '' : 'none';
}

/* ═══════════════════════════════════════════════════════════
   REQUEST AN ITEM
   ═══════════════════════════════════════════════════════════ */

function _openRequestForm() {
  const html = `
    <div class="req-form">
      <p class="req-intro">Tell us what you're looking for and we'll check with the stores on campus.</p>

      <label class="co-label">What are you looking for? <span class="req-required">*</span></label>
      <input class="co-input" id="req-what" type="text" placeholder="e.g. Scientific Calculator, Protein Powder…"/>

      <label class="co-label">Category</label>
      <select class="co-input" id="req-cat">
        <option value="">Select a category</option>
        ${CATEGORIES.filter(c => c.id !== 'more').map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
      </select>

      <label class="co-label">Additional details (optional)</label>
      <textarea class="co-input" id="req-desc" rows="3" placeholder="Brand, colour, quantity, any other details…"></textarea>

      <button class="co-place-btn" id="req-submit-btn">Submit Request</button>
    </div>
  `;

  showOverlay(html, 'Request an Item', () => navigate('home'));

  document.getElementById('req-submit-btn')?.addEventListener('click', () => {
    const what = document.getElementById('req-what')?.value?.trim();
    if (!what) { showToast('Please describe what you need'); return; }

    submitItemRequest({
      what,
      categoryId:  document.getElementById('req-cat')?.value || null,
      description: document.getElementById('req-desc')?.value?.trim() || '',
    });

    const body = document.querySelector('#screen-overlay .overlay-body');
    if (body) {
      body.innerHTML = `
        <div class="confirm-screen">
          <div class="confirm-icon">✅</div>
          <div class="confirm-title">Request received!</div>
          <div class="confirm-sub">We'll check UniMall stores for <strong>"${what}"</strong> and notify you when we find it.</div>
          <button class="confirm-btn-primary" id="req-done-btn">Back to Home</button>
        </div>
      `;
      document.getElementById('req-done-btn')?.addEventListener('click', () => navigate('home'));
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   CAMPUS STORES
   ═══════════════════════════════════════════════════════════ */

function _openStores() {
  const storeEmojis = {
    'campus-cafe': '☕',
    'book-corner': '📚',
    'techstop':    '🎧',
    'campus-mart': '🛒',
    'campus-wear': '👕',
    'health-hub':  '💊'
  };

  const html = `
    <div class="stores-list">
      ${STORES.map(s => {
        const storeProducts = AppState.products.filter(p => p.storeId === s.id);
        const icon = storeEmojis[s.id] || '🏪';
        return `
          <div class="store-card" data-sid="${s.id}" role="button" tabindex="0" aria-label="${s.name}, ${s.floor} floor">
            <div class="store-icon-wrap">${icon}</div>
            <div class="store-details">
              <div class="store-name-row">
                <span class="store-card-name">${s.name}</span>
                <span class="store-status-pill ${s.openNow ? 'open' : 'closed'}">${s.openNow ? 'Open' : 'Closed'}</span>
              </div>
              <div class="store-card-meta">
                <span>${s.floor} floor</span>
                <span>•</span>
                <span>${s.hours}</span>
              </div>
              <div class="store-items-count">${storeProducts.length} items available</div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  showOverlay(html, 'Campus Stores', () => navigate('home'));

  document.querySelectorAll('.store-card').forEach(card => {
    const onSelect = () => {
      const storeId = card.dataset.sid;
      const store = STORES.find(s => s.id === storeId);
      closeOverlay();
      if (store) {
        const input = document.getElementById('main-search');
        if (input) input.value = store.name;
        setState({ ui: { searchQuery: store.name, selectedCategoryId: null, activeFilters: [] } });
        _resetCategoryHighlight();
        _resetChipHighlight();
        renderHome();
        showToast(`Showing items from ${store.name}`);
      }
    };

    card.addEventListener('click', onSelect);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   HELPER: category & chip reset
   ═══════════════════════════════════════════════════════════ */

function _resetCategoryHighlight() {
  document.querySelectorAll('.category-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelectorAll('.category-icon').forEach(icon => {
    icon.style.outline = 'none';
  });
}

function _resetChipHighlight() {
  document.querySelectorAll('.dynamic-chip').forEach(chip => {
    chip.classList.remove('active');
    chip.setAttribute('aria-pressed', 'false');
  });
  // Re-activate "Near you" default
  const defaultChip = document.getElementById('chip-nearby');
  if (defaultChip) {
    defaultChip.classList.add('active');
    defaultChip.setAttribute('aria-pressed', 'true');
  }
}

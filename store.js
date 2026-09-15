/* ═══════════════════════════════════════════════════════════
   UNIMALL — STORE DETAIL CONTROLLER (store.js)
   Full interactive implementation for Products, About, Reviews,
   expandable search, cart integration, and map overlay.
   ═══════════════════════════════════════════════════════════ */

'use strict';

const STORAGE_KEY = 'unimall_v1';
const FAV_KEY = 'unimall_fav_stores';
const REVIEWS_KEY_PREFIX = 'unimall_reviews_';

/* ─── STORE DIRECTORY DATA FALLBACK ──────────────────────── */
const LOCAL_STORES = [
  {
    id: 'campus-cafe',
    altId: 'store-bakery',
    name: 'The Daily Brew',
    subTitle: 'Coffee, Snacks, Bakery',
    categories: ['Coffee', 'Snacks', 'Bakery', 'Beverages'],
    status: 'open',
    statusLabel: 'Open',
    closingTime: 'Closes at 10:00 PM',
    distanceFloor: '2 min walk • Ground Floor, UniMall',
    shortDesc: 'Fresh coffee, sandwiches, pastries and more to keep you going.',
    aboutDesc: 'Your go-to place for freshly brewed coffee, delicious snacks and baked goods. Perfect for a quick break between classes or late-night study sessions with friends. Handcrafted espresso and warm bakery delivered across campus.',
    coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop&q=80',
    galleryImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    location: 'Ground Floor, UniMall',
    boothCode: 'Booth G-04 (Next to Atrium)',
    timings: '8:00 AM - 10:00 PM',
    phone: '+91 98765 43210',
    paymentMethods: 'UPI, Card, Cash',
    rating: 4.8,
    reviewsCount: 128
  },
  {
    id: 'book-corner',
    altId: 'store-stationery',
    name: 'Stationery Hub',
    subTitle: 'Notebooks, Pens, Supplies',
    categories: ['Notebooks', 'Stationery', 'Textbooks', 'Calculators'],
    status: 'open',
    statusLabel: 'Open',
    closingTime: 'Closes at 9:00 PM',
    distanceFloor: '2 min walk • Ground Floor, UniMall',
    shortDesc: 'All academic essentials, notebooks, drafting pens, and project supplies.',
    aboutDesc: 'The campus hub for engineering notebooks, fine pens, laboratory manuals, and stationery kits. Student discounts available on semester supply bundles.',
    coverImage: 'https://images.unsplash.com/photo-1507842229451-79b1be886a20?w=1200&auto=format&fit=crop&q=80',
    galleryImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80',
    location: 'Ground Floor, UniMall',
    boothCode: 'Booth G-08 (Academic Wing)',
    timings: '9:00 AM - 9:00 PM',
    phone: '+91 98765 01002',
    paymentMethods: 'UPI, Card, Cash',
    rating: 4.6,
    reviewsCount: 94
  },
  {
    id: 'techstop',
    altId: 'store-electronics',
    name: 'TechStop Electronics',
    subTitle: 'Chargers, Cables, Tech Accessories',
    categories: ['Chargers', 'Audio', 'Peripherals', 'Cables'],
    status: 'open',
    statusLabel: 'Open',
    closingTime: 'Closes at 9:00 PM',
    distanceFloor: '3 min walk • Ground Floor, UniMall',
    shortDesc: 'Laptop adapters, fast charging cables, USB hubs, and wireless audio.',
    aboutDesc: 'Never run out of juice before an exam. TechStop carries authentic chargers for Mac, Windows, iPhone, and Type-C, alongside mechanical keyboards and noise-cancelling earphones.',
    coverImage: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1200&auto=format&fit=crop&q=80',
    galleryImage: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=800&auto=format&fit=crop&q=80',
    location: 'Ground Floor, UniMall',
    boothCode: 'Booth G-12 (Tech Hub)',
    timings: '10:00 AM - 9:00 PM',
    phone: '+91 98765 01003',
    paymentMethods: 'UPI, Card, Net Banking',
    rating: 4.5,
    reviewsCount: 76
  },
  {
    id: 'campus-mart',
    altId: 'store-mart',
    name: 'Campus Mart',
    subTitle: 'Snacks, Groceries, Daily Needs',
    categories: ['Instant Food', 'Snacks', 'Beverages', 'Personal Care'],
    status: 'open',
    statusLabel: 'Open',
    closingTime: 'Closes at 11:00 PM',
    distanceFloor: '1 min walk • Hostel Quadrangle',
    shortDesc: 'Late-night snacks, instant ramen, beverages, and toiletries.',
    aboutDesc: 'Campus Mart stays open late for nocturnal study sessions. Stocked with biscuits, instant ramen, cold drinks, water bottles, and daily hostel essentials.',
    coverImage: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80',
    galleryImage: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&auto=format&fit=crop&q=80',
    location: 'Hostel Quadrangle, UniMall',
    boothCode: 'Booth Q-01 (Next to Hostel C)',
    timings: '8:00 AM - 11:00 PM',
    phone: '+91 98765 01004',
    paymentMethods: 'UPI, Card, Cash',
    rating: 4.4,
    reviewsCount: 112
  },
  {
    id: 'campus-wear',
    altId: 'store-fashion',
    name: 'Style Square & Wear',
    subTitle: 'Campus Hoodies, Tees, Accessories',
    categories: ['Hoodies', 'T-Shirts', 'Caps', 'Sweatpants'],
    status: 'open',
    statusLabel: 'Open',
    closingTime: 'Closes at 8:00 PM',
    distanceFloor: '4 min walk • First Floor, UniMall',
    shortDesc: 'Official university merchandise, oversized hoodies, and casual streetwear.',
    aboutDesc: 'Represent your college in comfort. High quality 320 GSM cotton hoodies, campus embroidered caps, and comfortable loungewear designed by students for students.',
    coverImage: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop&q=80',
    galleryImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80',
    location: 'First Floor, UniMall',
    boothCode: 'Booth F-05 (Student Lounge)',
    timings: '11:00 AM - 8:00 PM',
    phone: '+91 98765 01005',
    paymentMethods: 'UPI, Card',
    rating: 4.6,
    reviewsCount: 58
  },
  {
    id: 'health-hub',
    altId: 'store-sports',
    name: 'Health Hub',
    subTitle: 'Supplements, Energy, Wellness',
    categories: ['Protein', 'Electrolytes', 'First-Aid', 'Fitness'],
    status: 'open',
    statusLabel: 'Open',
    closingTime: 'Closes at 9:00 PM',
    distanceFloor: '3 min walk • Ground Floor, UniMall',
    shortDesc: 'Whey protein bars, hydration mixes, vitamins, and first-aid kits.',
    aboutDesc: 'Stay sharp and healthy through midterms. Dedicated campus wellness shop with certified sports nutrition, recovery drinks, and campus clinic essentials.',
    coverImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&auto=format&fit=crop&q=80',
    galleryImage: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=80',
    location: 'Ground Floor, UniMall',
    boothCode: 'Booth G-15 (Near Gym)',
    timings: '8:00 AM - 9:00 PM',
    phone: '+91 98765 01006',
    paymentMethods: 'UPI, Card, Cash',
    rating: 4.5,
    reviewsCount: 42
  }
];

/* ─── INITIAL MOCK REVIEWS FOR THE DAILY BREW ────────────── */
const DEFAULT_REVIEWS = [
  {
    id: 'r1',
    userName: 'Rohan Sharma',
    hostel: 'Hostel A',
    rating: 5,
    date: 'Yesterday',
    comment: 'The Cold Coffee and fresh Chocolate Muffin are unreal! Best way to start a 9 AM lecture. Delivery was at my door in 14 minutes.',
    helpful: 12
  },
  {
    id: 'r2',
    userName: 'Sneha Patel',
    hostel: 'Hostel C',
    rating: 5,
    date: '3 days ago',
    comment: 'Super cozy ambiance and very polite staff. Grilled veg club sandwich is super filling. Definitely my daily spot.',
    helpful: 8
  },
  {
    id: 'r3',
    userName: 'Aman Verma',
    hostel: 'Hostel B',
    rating: 4,
    date: '1 week ago',
    comment: 'Iced Americano is crisp and strong. They sometimes run out of croissants around 4 PM because of high demand, so order early!',
    helpful: 5
  }
];

/* ─── APPLICATION STATE ──────────────────────────────────── */
let currentStore = null;
let currentProducts = [];
let activeSubcat = 'all';
let searchQuery = '';
let selectedRating = 5;

/* ─── INITIALIZATION ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  resolveCurrentStore();
  initTabs();
  initExpandableSearch();
  initFavoriteButton();
  initModals();
  initReviewSubmission();
  syncCartBadges();
  syncSidebarProfile();

  // Handle back button
  document.getElementById('heroBackBtn')?.addEventListener('click', () => {
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      window.location.href = 'stores.html';
    }
  });

  // Reset search button
  document.getElementById('btnResetSearch')?.addEventListener('click', () => {
    resetSearch();
  });
});

/* ─── STORE RESOLUTION ───────────────────────────────────── */
function resolveCurrentStore() {
  const params = new URLSearchParams(window.location.search);
  const requestedId = (params.get('id') || '').toLowerCase().trim();

  // Match by id or altId or name
  currentStore = LOCAL_STORES.find(s =>
    s.id === requestedId ||
    s.altId === requestedId ||
    s.name.toLowerCase().includes(requestedId)
  ) || LOCAL_STORES[0]; // Defaults to The Daily Brew / Campus Bakery

  // Update Page Title
  document.title = `${currentStore.name} — UniMall`;

  // Render Header Details (Panel 3)
  renderStoreHeader();

  // Load Products
  loadStoreProducts();

  // Render About & Related Stores (Panel 4)
  renderAboutSection();

  // Render Reviews
  renderReviewsSection();

  // Check Favorite State
  updateFavoriteIcon();
}

/* ─── RENDER STORE HEADER (Mockup Panel 3) ────────────────── */
function renderStoreHeader() {
  const heroImg = document.getElementById('storeHeroImg');
  const logoText = document.getElementById('storeLogoText');
  const storeName = document.getElementById('storeName');
  const storeCategories = document.getElementById('storeCategoriesSub');
  const statusPill = document.getElementById('storeStatusPill');
  const statusText = document.getElementById('storeStatusText');
  const closingTime = document.getElementById('storeClosingTime');
  const distanceFloor = document.getElementById('storeDistanceFloor');
  const shortDesc = document.getElementById('storeShortDesc');

  if (heroImg) heroImg.src = currentStore.coverImage;
  if (storeName) storeName.textContent = currentStore.name;
  if (storeCategories) storeCategories.textContent = currentStore.subTitle;
  if (closingTime) closingTime.textContent = currentStore.closingTime;
  if (distanceFloor) distanceFloor.textContent = currentStore.distanceFloor;
  if (shortDesc) shortDesc.textContent = currentStore.shortDesc;

  // Derive stylish circular initials for logo badge
  if (logoText) {
    const words = currentStore.name.split(' ').filter(Boolean);
    const initials = words.length >= 2
      ? (words[0][0] + words[1][0]).toUpperCase()
      : currentStore.name.slice(0, 2).toUpperCase();
    logoText.textContent = initials;
  }

  // Status Pill
  if (statusPill && statusText) {
    if (currentStore.status === 'open') {
      statusPill.className = 'status-pill status-open';
      statusText.textContent = 'Open';
    } else {
      statusPill.className = 'status-pill status-closed';
      statusText.textContent = 'Closed';
    }
  }
}

/* ─── PRODUCTS & CATEGORIES ──────────────────────────────── */
function loadStoreProducts() {
  const storeIdMatches = [currentStore.id, currentStore.altId];

  // Retrieve products from window.PRODUCTS (defined in js/data.js)
  const allProds = (typeof PRODUCTS !== 'undefined') ? PRODUCTS : [];
  currentProducts = allProds.filter(p =>
    storeIdMatches.includes(p.storeId) ||
    (p.storeId && p.storeId.includes('cafe') && currentStore.id.includes('cafe'))
  );

  // If few or no products matched (e.g. for other store IDs), provide rich matching campus items
  if (currentProducts.length === 0) {
    currentProducts = generateFallbackStoreProducts(currentStore);
  }

  // Render Subcategory Chips
  renderSubcategoryChips();

  // Render Product Grid
  renderProductGrid();
}

function generateFallbackStoreProducts(store) {
  const categories = store.categories || ['All', 'Featured'];
  return categories.slice(0, 4).map((cat, idx) => ({
    id: `${store.id}-p${idx + 1}`,
    name: `${cat} Pack`,
    price: 80 + idx * 30,
    emoji: '📦',
    bg: '#F8FAFC',
    image: store.coverImage,
    categoryId: store.id,
    storeId: store.id,
    subCategory: cat,
    description: `Popular item from ${store.name}.`,
    stock: 15,
    availability: 'in-stock',
    deliveryAvailable: true,
    pickupAvailable: true,
    rating: 4.7
  }));
}

function renderSubcategoryChips() {
  const chipsContainer = document.getElementById('storeSubcatChips');
  if (!chipsContainer) return;

  // Extract unique subcategories
  const subcats = new Set(['all']);
  currentProducts.forEach(p => {
    if (p.subCategory) subcats.add(p.subCategory);
  });
  // Also add store defined categories
  if (currentStore.categories) {
    currentStore.categories.forEach(c => subcats.add(c));
  }

  chipsContainer.innerHTML = Array.from(subcats).map(sub => {
    const label = sub === 'all' ? 'All' : sub;
    const isActive = activeSubcat === sub ? 'active' : '';
    return `<button class="store-chip ${isActive}" data-subcat="${sub}">${label}</button>`;
  }).join('');

  chipsContainer.querySelectorAll('.store-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      chipsContainer.querySelectorAll('.store-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSubcat = btn.dataset.subcat;
      renderProductGrid();
    });
  });
}

/* ─── 2-COLUMN PRODUCT GRID RENDER (Mockup Panel 3) ──────── */
function renderProductGrid() {
  const grid = document.getElementById('storeProductGrid');
  const emptyState = document.getElementById('storeEmptyProducts');
  if (!grid) return;

  const filtered = currentProducts.filter(p => {
    // Subcategory check
    const matchesSubcat = (activeSubcat === 'all') ||
      (p.subCategory && p.subCategory.toLowerCase() === activeSubcat.toLowerCase());

    // Search query check
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(q));

    return matchesSubcat && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  grid.innerHTML = filtered.map(item => {
    const stockClass = (item.availability === 'low-stock') ? 'stock-low' : 'stock-in';
    const stockLabel = (item.availability === 'low-stock') ? 'Low stock' : 'In stock';
    const imgUrl = item.image || item.coverImage || 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80';

    return `
      <div class="store-prod-card" data-product-id="${item.id}">
        <div class="prod-img-wrap">
          <img
            class="prod-img"
            src="${imgUrl}"
            alt="${item.name}"
            loading="lazy"
            onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=80';"
          />
        </div>
        <div class="prod-card-body">
          <div class="prod-title">${item.name}</div>
          <div class="prod-price">₹${Math.round(item.price)}</div>
          <div class="prod-footer-row">
            <span class="stock-tag ${stockClass}">${stockLabel}</span>
            <button
              class="btn-add-product"
              data-id="${item.id}"
              aria-label="Add ${item.name} to cart"
              title="Add to cart"
            >
              +
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach Add-to-Cart handlers
  grid.querySelectorAll('.btn-add-product').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const prodId = btn.dataset.id;
      const product = currentProducts.find(p => p.id === prodId);
      if (product) {
        addToCart(product);
      }
    });
  });
}

/* ─── ADD TO CART & TOAST ────────────────────────────────── */
function addToCart(product) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    if (!Array.isArray(data.cart)) data.cart = [];

    const existing = data.cart.find(c => c.productId === product.id);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      data.cart.push({ productId: product.id, qty: 1 });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    // Show exciting toast
    showExcitementToast(`Yay! ${product.name} added to cart ✨`);

    // Sync badges with spring animation
    syncCartBadges();

  } catch (err) {
    console.error('Error adding to cart:', err);
  }
}

let toastTimer = null;
function showExcitementToast(message) {
  const toast = document.getElementById('storeToast');
  const toastText = document.getElementById('storeToastText');
  if (!toast || !toastText) return;

  toastText.textContent = message;
  toast.classList.remove('hidden');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2400);
}

/* ─── EXPANDABLE SEARCH (Mockup Requirement) ─────────────── */
function initExpandableSearch() {
  const wrapper = document.getElementById('storeSearchWrapper');
  const triggerBtn = document.getElementById('storeSearchTrigger');
  const searchInput = document.getElementById('storeSearchInput');
  const closeBtn = document.getElementById('storeSearchClose');

  if (!wrapper || !triggerBtn || !searchInput) return;

  // Expand search input on click
  triggerBtn.addEventListener('click', () => {
    wrapper.classList.add('is-expanded');
    searchInput.focus();
  });

  // Collapse search input on close click
  closeBtn?.addEventListener('click', () => {
    resetSearch();
  });

  // Real-time product search
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderProductGrid();
  });

  // Close on Escape
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      resetSearch();
    }
  });

  // Collapse if click outside
  document.addEventListener('click', (e) => {
    if (wrapper.classList.contains('is-expanded') && !wrapper.contains(e.target)) {
      if (!searchInput.value.trim()) {
        wrapper.classList.remove('is-expanded');
      }
    }
  });
}

function resetSearch() {
  const wrapper = document.getElementById('storeSearchWrapper');
  const searchInput = document.getElementById('storeSearchInput');
  if (wrapper) wrapper.classList.remove('is-expanded');
  if (searchInput) searchInput.value = '';
  searchQuery = '';
  renderProductGrid();
}

/* ─── TABS SWITCHING (Products | About | Reviews) ────────── */
function initTabs() {
  const tabButtons = document.querySelectorAll('.store-tab-btn');
  const panes = document.querySelectorAll('.store-tab-pane');
  const indicator = document.getElementById('tabIndicator');

  function updateIndicator(btn) {
    if (!indicator || !btn) return;
    indicator.style.left = `${btn.offsetLeft}px`;
    indicator.style.width = `${btn.offsetWidth}px`;
  }

  // Set initial indicator position
  const activeBtn = document.querySelector('.store-tab-btn.active');
  if (activeBtn) {
    setTimeout(() => updateIndicator(activeBtn), 50);
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabKey = btn.dataset.tab;

      tabButtons.forEach(b => b.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      updateIndicator(btn);

      const targetPane = document.getElementById(`pane${tabKey.charAt(0).toUpperCase() + tabKey.slice(1)}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  window.addEventListener('resize', () => {
    const currentActive = document.querySelector('.store-tab-btn.active');
    if (currentActive) updateIndicator(currentActive);
  });
}

/* ─── ABOUT SECTION (Mockup Panel 4) ─────────────────────── */
function renderAboutSection() {
  const aboutText = document.getElementById('aboutLongDesc');
  const locationVal = document.getElementById('aboutLocationVal');
  const timingsVal = document.getElementById('aboutTimingsVal');
  const phoneVal = document.getElementById('aboutPhoneVal');
  const categoriesVal = document.getElementById('aboutCategoriesVal');
  const paymentsVal = document.getElementById('aboutPaymentsVal');
  const galleryImg = document.getElementById('aboutGalleryImg');
  const relatedContainer = document.getElementById('relatedStoresScroll');

  if (aboutText) aboutText.textContent = currentStore.aboutDesc;
  if (locationVal) locationVal.textContent = currentStore.location;
  if (timingsVal) timingsVal.textContent = currentStore.timings;
  if (phoneVal) {
    phoneVal.textContent = currentStore.phone;
    phoneVal.href = `tel:${currentStore.phone.replace(/\s+/g, '')}`;
  }
  if (categoriesVal) categoriesVal.textContent = currentStore.subTitle;
  if (paymentsVal) paymentsVal.textContent = currentStore.paymentMethods;
  if (galleryImg) galleryImg.src = currentStore.galleryImage;

  // Render "You might also like"
  if (relatedContainer) {
    const related = LOCAL_STORES.filter(s => s.id !== currentStore.id);
    relatedContainer.innerHTML = related.map(s => `
      <a href="store.html?id=${encodeURIComponent(s.id)}" class="related-store-card">
        <img class="related-thumb" src="${s.coverImage}" alt="${s.name}" loading="lazy" />
        <div class="related-body">
          <div class="related-name">${s.name}</div>
          <div class="related-sub">⭐ ${s.rating} · ${s.distanceFloor.split('•')[1] || 'UniMall'}</div>
        </div>
      </a>
    `).join('');
  }
}

/* ─── REVIEWS SECTION ────────────────────────────────────── */
function getStoreReviews() {
  try {
    const stored = localStorage.getItem(`${REVIEWS_KEY_PREFIX}${currentStore.id}`);
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return DEFAULT_REVIEWS;
}

function renderReviewsSection() {
  const reviews = getStoreReviews();
  const listEl = document.getElementById('reviewsList');
  const countText = document.getElementById('reviewsCountText');
  const avgScore = document.getElementById('reviewsAvgScore');

  if (countText) countText.textContent = `${reviews.length} verified campus reviews`;
  if (avgScore) avgScore.textContent = currentStore.rating;

  if (!listEl) return;

  listEl.innerHTML = reviews.map(r => {
    const sticker = (typeof window.getStickerAvatar === 'function')
      ? window.getStickerAvatar(r.userName)
      : '';
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);

    return `
      <div class="review-card" data-review-id="${r.id}">
        <div class="review-header">
          <img
            class="review-avatar"
            src="${sticker}"
            alt="${r.userName}"
            referrerpolicy="no-referrer"
            onerror="this.onerror=null; this.src='${sticker}';"
          />
          <div class="review-user-meta">
            <div class="review-user-name">
              <span>${r.userName}</span>
              <span class="review-verified-badge">Verified Buyer</span>
            </div>
            <div class="review-time">${r.hostel} · ${r.date}</div>
          </div>
        </div>
        <div class="review-stars">${stars}</div>
        <p class="review-comment">${r.comment}</p>
        <div class="review-footer">
          <button class="btn-upvote" onclick="upvoteReview('${r.id}')">
            👍 Helpful (${r.helpful || 0})
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.upvoteReview = function(reviewId) {
  const reviews = getStoreReviews();
  const rev = reviews.find(r => r.id === reviewId);
  if (rev) {
    rev.helpful = (rev.helpful || 0) + 1;
    localStorage.setItem(`${REVIEWS_KEY_PREFIX}${currentStore.id}`, JSON.stringify(reviews));
    renderReviewsSection();
  }
};

/* ─── WRITE REVIEW MODAL ─────────────────────────────────── */
function initReviewSubmission() {
  const btnWrite = document.getElementById('btnWriteReview');
  const modal = document.getElementById('reviewModal');
  const closeBtn = document.getElementById('closeReviewModal');
  const form = document.getElementById('writeReviewForm');
  const starChoices = document.querySelectorAll('.star-choice');

  btnWrite?.addEventListener('click', () => modal?.classList.remove('hidden'));
  closeBtn?.addEventListener('click', () => modal?.classList.add('hidden'));

  // Star selector
  starChoices.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.rating, 10);
      starChoices.forEach(s => {
        const r = parseInt(s.dataset.rating, 10);
        if (r <= selectedRating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });
  });

  // Submit
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const commentInput = document.getElementById('reviewComment');
    const comment = commentInput ? commentInput.value.trim() : '';
    if (!comment) return;

    // Get current user or guest
    let userName = 'Campus Student';
    let hostel = 'Hostel B';
    try {
      const auth = localStorage.getItem('unimall_auth');
      if (auth) {
        const u = JSON.parse(auth);
        if (u.name) userName = u.name;
        if (u.hostel) hostel = u.hostel;
      }
    } catch (e) {}

    const newReview = {
      id: `r-${Date.now()}`,
      userName,
      hostel,
      rating: selectedRating,
      date: 'Just now',
      comment,
      helpful: 1
    };

    const reviews = getStoreReviews();
    reviews.unshift(newReview);
    localStorage.setItem(`${REVIEWS_KEY_PREFIX}${currentStore.id}`, JSON.stringify(reviews));

    modal?.classList.add('hidden');
    if (commentInput) commentInput.value = '';
    renderReviewsSection();
    showExcitementToast('Thank you for your review! ⭐');
  });
}

/* ─── FAVORITE BUTTON ────────────────────────────────────── */
function initFavoriteButton() {
  const btn = document.getElementById('heroFavBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    try {
      const stored = localStorage.getItem(FAV_KEY);
      let favs = stored ? JSON.parse(stored) : [];
      const isFav = favs.includes(currentStore.id);

      if (isFav) {
        favs = favs.filter(id => id !== currentStore.id);
        showExcitementToast('Removed from favorites');
      } else {
        favs.push(currentStore.id);
        showExcitementToast('Saved to favorites ❤️');
      }

      localStorage.setItem(FAV_KEY, JSON.stringify(favs));
      updateFavoriteIcon();
    } catch (e) {}
  });
}

function updateFavoriteIcon() {
  const btn = document.getElementById('heroFavBtn');
  if (!btn || !currentStore) return;
  try {
    const stored = localStorage.getItem(FAV_KEY);
    const favs = stored ? JSON.parse(stored) : [];
    if (favs.includes(currentStore.id)) {
      btn.classList.add('favorited');
    } else {
      btn.classList.remove('favorited');
    }
  } catch (e) {}
}

/* ─── MODALS (Campus Map Overlay) ────────────────────────── */
function initModals() {
  const mapModal = document.getElementById('mapModal');
  const btnOpenMap = document.getElementById('btnOpenMap');
  const btnCloseMap = document.getElementById('closeMapModal');
  const mapStoreName = document.getElementById('mapStoreName');
  const mapBoothCode = document.getElementById('mapBoothCode');
  const mapFloorTag = document.getElementById('mapFloorTag');

  btnOpenMap?.addEventListener('click', () => {
    if (mapStoreName) mapStoreName.textContent = currentStore.name;
    if (mapBoothCode) mapBoothCode.textContent = currentStore.boothCode;
    if (mapFloorTag) mapFloorTag.textContent = `${currentStore.distanceFloor.split('•')[1] || 'Ground Floor'} · UniMall Complex`;
    mapModal?.classList.remove('hidden');
  });

  btnCloseMap?.addEventListener('click', () => {
    mapModal?.classList.add('hidden');
  });

  // Close modals on backdrop click
  window.addEventListener('click', (e) => {
    if (e.target === mapModal) mapModal.classList.add('hidden');
    const reviewModal = document.getElementById('reviewModal');
    if (e.target === reviewModal) reviewModal.classList.add('hidden');
  });
}

/* ─── CART BADGE & SIDEBAR SYNC ──────────────────────────── */
function syncCartBadges() {
  let count = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.cart)) {
        count = data.cart.reduce((acc, item) => acc + (item.qty || 1), 0);
      }
    }
  } catch (e) {}

  document.querySelectorAll('[data-cart]').forEach(badge => {
    badge.textContent = count;
    if (count > 0) {
      badge.style.display = 'inline-flex';
      badge.classList.remove('badge-spring');
      void badge.offsetWidth;
      badge.classList.add('badge-spring');
    } else {
      badge.style.display = 'none';
    }
  });
}

function syncSidebarProfile() {
  try {
    let user = null;
    const v1 = localStorage.getItem(STORAGE_KEY);
    if (v1) {
      const parsed = JSON.parse(v1);
      if (parsed.currentUser) user = parsed.currentUser;
    }
    const auth = localStorage.getItem('unimall_auth');
    if (auth) {
      const parsedAuth = JSON.parse(auth);
      user = { ...(user || {}), ...parsedAuth };
    }
    if (!user) return;

    const nameEl = document.querySelector('.sidebar-profile-name');
    const roleEl = document.querySelector('.sidebar-profile-role');
    const avatarEl = document.querySelector('.sidebar-avatar');

    if (nameEl && user.name) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = `${user.hostel || 'Hostel B'} · ${user.room || 'Room 214'}`;
    if (avatarEl) {
      const stickerFallback = typeof window.getStickerAvatar === 'function' ? window.getStickerAvatar(user.name || 'User') : '';
      const avatarSrc = user.avatar || stickerFallback;
      if (avatarSrc) {
        avatarEl.innerHTML = `<img src="${avatarSrc}" alt="${user.name || 'User'}" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${stickerFallback}';" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      } else if (user.name) {
        avatarEl.textContent = user.name.trim()[0].toUpperCase();
      }
    }
  } catch (e) {}
}

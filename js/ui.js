/* ═══════════════════════════════════════════════════════════
   UniMall · js/ui.js
   Shared UI primitives: overlay/screen system, toasts, modals.
   Depends on: state.js (for navigate calls from close buttons)
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ═══════════════════════════════════════════════════════════
   OVERLAY / SCREEN SYSTEM
   A single full-screen overlay slides in from the right.
   All non-home views render inside it.
   ═══════════════════════════════════════════════════════════ */

let _overlayEl = null;
let _overlayBackCallback = null;

function _ensureOverlay() {
  if (!_overlayEl) {
    _overlayEl = document.getElementById('screen-overlay');
  }
  return _overlayEl;
}

/**
 * Open the overlay with given HTML content.
 * @param {string}   html         — inner HTML to render
 * @param {string}   title        — back-button label / screen title
 * @param {Function} [onBack]     — optional callback when back is pressed
 */
function showOverlay(html, title, onBack) {
  const overlay = _ensureOverlay();
  if (!overlay) return;

  _overlayBackCallback = onBack || null;

  overlay.innerHTML = `
    <div class="overlay-header">
      <button class="overlay-back" id="overlay-back-btn" aria-label="Go back">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <span class="overlay-title">${title}</span>
    </div>
    <div class="overlay-body">
      ${html}
    </div>
  `;

  overlay.classList.add('open');
  document.body.classList.add('overlay-open');

  document.getElementById('overlay-back-btn').addEventListener('click', closeOverlay);
}

function closeOverlay() {
  const overlay = _ensureOverlay();
  if (!overlay) return;

  overlay.classList.remove('open');
  document.body.classList.remove('overlay-open');

  if (_overlayBackCallback) {
    _overlayBackCallback();
    _overlayBackCallback = null;
  }
}

/* ═══════════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════════════ */

let _toastTimer = null;

/**
 * Show a brief toast message at the bottom of the screen.
 * @param {string} message
 * @param {number} [duration=2200] — ms
 */
function showToast(message, duration = 2200) {
  let toast = document.getElementById('um-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'um-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('visible');

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
  }, duration);
}

/* ═══════════════════════════════════════════════════════════
   FORMAT HELPERS (shared across views)
   ═══════════════════════════════════════════════════════════ */

function fmtPrice(n) {
  return n.toLocaleString('en-IN');
}

function fmtDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

/* ─── AVAILABILITY BADGE HTML ────────────────────────────── */
function availBadgeHtml(product) {
  const map = {
    'in-stock':    { cls: 'in-stock',     label: 'In stock'     },
    'low-stock':   { cls: 'low-stock',    label: `Only ${product.stock} left` },
    'out-of-stock':{ cls: 'out-of-stock', label: 'Out of stock' },
    'preorder':    { cls: 'preorder',     label: 'Pre-order'    },
  };
  const a = map[product.availability] || map['in-stock'];
  return `<span class="avail-badge ${a.cls}"><span class="dot"></span><span class="avail-badge-text">${a.label}</span></span>`;
}

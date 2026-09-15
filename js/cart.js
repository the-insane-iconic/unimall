/* ═══════════════════════════════════════════════════════════
   UniMall · js/cart.js
   Cart badge sync. Actual cart data lives in state.js.
   Depends on: state.js
   ═══════════════════════════════════════════════════════════ */

'use strict';

/**
 * Sync all cart badge elements to the current cart count in AppState.
 * Called after any cart mutation.
 */
function updateCartBadges() {
  const count = getCartCount();

  document.querySelectorAll('.nav-badge, .sidebar-badge[data-cart]').forEach(badge => {
    badge.textContent = count > 9 ? '9+' : String(count);
    badge.setAttribute('aria-label', `${count} item${count !== 1 ? 's' : ''} in cart`);
    // Show/hide badge
    badge.style.display = count > 0 ? '' : 'none';

    // Brief scale animation
    badge.style.transform = 'scale(1.4)';
    setTimeout(() => { badge.style.transform = ''; }, 180);
  });

  // Also update nav-cart aria-label
  const cartNav = document.getElementById('nav-cart');
  if (cartNav) cartNav.setAttribute('aria-label', `Cart, ${count} item${count !== 1 ? 's' : ''}`);
}

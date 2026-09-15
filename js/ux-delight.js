/* ═══════════════════════════════════════════════════════════
   UNIMALL — UX DELIGHT & MICRO-POLISH (js/ux-delight.js)
   Subtle details that make UniMall feel exceptionally crafted:
   • ⌘K / '/' keyboard shortcut spotlight with dynamic platform badge
   • Campus Connectivity Guard (seamless offline/online floating pill)
   • Tactile audio feedback on tabs and buttons
   • Escape key modal/sheet dismissal
   ═══════════════════════════════════════════════════════════ */

'use strict';

(function () {
  /* ─── 1. CAMPUS CONNECTIVITY GUARD ─────────────────────── */
  function initConnectivityGuard() {
    let pill = document.getElementById('campusNetworkPill');
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'campusNetworkPill';
      pill.className = 'campus-network-pill';
      pill.setAttribute('role', 'status');
      pill.setAttribute('aria-live', 'polite');
      document.body.appendChild(pill);
    }

    let hideTimeout = null;

    function showPill(isOnline) {
      if (hideTimeout) clearTimeout(hideTimeout);
      pill.className = `campus-network-pill show ${isOnline ? 'online' : 'offline'}`;

      if (isOnline) {
        pill.innerHTML = `
          <span class="net-icon">⚡</span>
          <span>Back online · Synced with UniMall</span>
        `;
        if (window.soundFX) window.soundFX.playPing();
        hideTimeout = setTimeout(() => {
          pill.classList.remove('show');
        }, 3200);
      } else {
        pill.innerHTML = `
          <span class="net-icon">📡</span>
          <span>Campus Wi-Fi disconnected · Safe in offline mode</span>
        `;
        if (window.soundFX) window.soundFX.playTap(180);
      }
    }

    window.addEventListener('online', () => showPill(true));
    window.addEventListener('offline', () => showPill(false));
  }

  /* ─── 2. KEYBOARD SEARCH SPOTLIGHT (⌘K / '/') ────────────── */
  function initKeyboardShortcuts() {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const shortcutSymbol = isMac ? '⌘K' : 'Ctrl+K';

    // Insert visual badge if a search input exists on page
    const searchInputs = document.querySelectorAll(
      '#main-search, #storeSearch, #ordersSearch, input[type="search"]'
    );

    searchInputs.forEach(input => {
      const parent = input.parentElement;
      if (parent && !parent.querySelector('.search-kbd-hint')) {
        const kbd = document.createElement('kbd');
        kbd.className = 'search-kbd-hint';
        kbd.textContent = shortcutSymbol;
        kbd.title = `Press ${shortcutSymbol} or / to search`;
        kbd.addEventListener('click', (e) => {
          e.stopPropagation();
          input.focus();
        });
        parent.style.position = 'relative';
        parent.appendChild(kbd);
      }
    });

    document.addEventListener('keydown', (e) => {
      // Don't trigger if user is actively typing in an input, textarea, or contentEditable
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.isContentEditable
      );

      // Escape key: blur search or close modals/sheets
      if (e.key === 'Escape') {
        if (isTyping) {
          activeEl.blur();
        }
        // Close store sheet if open
        const sheet = document.getElementById('filterSheet');
        const backdrop = document.getElementById('sheetBackdrop');
        if (sheet && sheet.classList.contains('open')) {
          sheet.classList.remove('open');
          if (backdrop) backdrop.classList.add('hidden');
        }
        // Close order modal if open
        const modal = document.getElementById('orderModal');
        if (modal && !modal.classList.contains('hidden')) {
          modal.classList.add('hidden');
          document.body.style.overflow = '';
        }
        return;
      }

      // Check for ⌘K / Ctrl+K or '/'
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const isSlash = !isTyping && e.key === '/';

      if (isCmdK || isSlash) {
        // Find visible or primary search input
        const targetSearch =
          document.getElementById('main-search') ||
          document.getElementById('storeSearch') ||
          document.getElementById('ordersSearch') ||
          document.querySelector('input[type="search"]');

        if (targetSearch) {
          e.preventDefault();

          // In stores.html, ensure search container is visible
          const searchSec = document.getElementById('searchSection');
          if (searchSec && searchSec.classList.contains('hidden')) {
            searchSec.classList.remove('hidden');
          }

          targetSearch.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetSearch.focus();
          targetSearch.select?.();

          // Spotlight pulse ring effect
          targetSearch.classList.remove('search-spotlight-active');
          void targetSearch.offsetWidth; // trigger reflow
          targetSearch.classList.add('search-spotlight-active');
          setTimeout(() => targetSearch.classList.remove('search-spotlight-active'), 1200);

          if (window.soundFX) window.soundFX.playTap(440);
        }
      }
    });
  }

  /* ─── 3. TACTILE AUDIO FEEDBACK FOR TABS & CHIPS ───────── */
  function initTactileInteractions() {
    document.addEventListener('click', (e) => {
      // Category filter chips
      if (e.target.closest('.filter-chip, .tab-btn, .fulfillment-btn, .quick-tab, [data-sort]')) {
        if (window.soundFX) window.soundFX.playTap(320);
      }
      // Add to cart buttons
      if (e.target.closest('.add-btn, .product-add-btn, .btn-inc')) {
        if (window.soundFX) window.soundFX.playPop(1.1);
      }
      // Delete or decrement buttons
      if (e.target.closest('.btn-dec, .delete-item-btn, .btn-clear')) {
        if (window.soundFX) window.soundFX.playTap(220);
      }
    }, true);
  }

  /* ─── INITIALIZATION ON DOM READY ───────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initConnectivityGuard();
      initKeyboardShortcuts();
      initTactileInteractions();
    });
  } else {
    initConnectivityGuard();
    initKeyboardShortcuts();
    initTactileInteractions();
  }
})();

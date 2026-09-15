/* ═══════════════════════════════════════════════════════════
   UniMall · js/search.js
   Search bar wiring. Writes to AppState.ui, triggers renderHome().
   Depends on: state.js, views.js
   ═══════════════════════════════════════════════════════════ */

'use strict';

function initSearch() {
  const input   = document.getElementById('main-search');
  const scanBtn = document.getElementById('scan-btn');
  if (!input) return;

  let _timer = null;

  input.addEventListener('input', () => {
    clearTimeout(_timer);
    _timer = setTimeout(() => {
      setState({ ui: { searchQuery: input.value.trim(), selectedCategoryId: null } });
      renderHome();
    }, 240);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      input.value = '';
      setState({ ui: { searchQuery: '', selectedCategoryId: null, activeFilters: [] } });
      renderHome();
      input.blur();
    }
  });

  // Desktop shortcut: / or Ctrl+K focuses search
  document.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });

  // Scan button — stub
  scanBtn?.addEventListener('click', () => {
    showToast('Scan feature coming soon');
  });
}

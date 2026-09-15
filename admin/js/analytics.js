/**
 * UniMall Store Admin — Analytics Controller (admin/js/analytics.js)
 */

'use strict';

let currentAnalyticsPeriod = 'today';

window.addEventListener('unimall:viewChanged', (e) => {
  if (e.detail.viewName === 'analytics') {
    loadAnalytics(e.detail.storeId);
  }
});

window.addEventListener('unimall:storeChanged', (e) => {
  const currentActiveView = document.querySelector('.admin-view.active');
  if (currentActiveView && currentActiveView.id === 'view-analytics') {
    loadAnalytics(e.detail.storeId);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.period-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentAnalyticsPeriod = btn.getAttribute('data-period');
      if (activeStoreId) loadAnalytics(activeStoreId);
    });
  });
});

async function loadAnalytics(storeId) {
  if (!storeId) return;

  const tbody = document.getElementById('analytics-top-products-tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6">Calculating metrics...</td></tr>';
  }

  try {
    const data = await apiRequest(`/admin/stores/${storeId}/analytics?period=${currentAnalyticsPeriod}`);
    const metrics = data.metrics || {};
    const topProducts = data.top_products || [];

    document.getElementById('analytics-revenue').textContent = `₹${Number(metrics.revenue || 0).toLocaleString('en-IN')}`;
    document.getElementById('analytics-orders').textContent = metrics.orders || 0;
    document.getElementById('analytics-units').textContent = metrics.units_sold || 0;
    document.getElementById('analytics-aov').textContent = `₹${Number(metrics.average_order_value || 0).toFixed(1)}`;

    if (topProducts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6" style="color: var(--text-muted);">No product sales recorded in this period.</td></tr>';
      return;
    }

    tbody.innerHTML = topProducts.map((p, idx) => `
      <tr>
        <td><strong>#${idx + 1}</strong></td>
        <td><strong style="color: var(--text-main);">${escapeHtml(p.name)}</strong></td>
        <td><strong>${p.sold_count}</strong> units</td>
        <td><strong style="color: var(--primary);">₹${Number(p.total_sales).toLocaleString('en-IN')}</strong></td>
      </tr>
    `).join('');

  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6" style="color: var(--danger);">Failed to load analytics: ${err.message}</td></tr>`;
    }
  }
}

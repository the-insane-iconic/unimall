/**
 * UniMall Store Admin — Founder Hub & Customer Requests Controller (admin/js/founder.js)
 * Platform admin tools for store onboarding, owner provisioning, and student demand monitoring.
 */

'use strict';

window.addEventListener('unimall:viewChanged', (e) => {
  if (e.detail.viewName === 'requests') {
    loadProductRequests(e.detail.storeId);
  } else if (e.detail.viewName === 'founder') {
    loadFounderHub();
  }
});

window.addEventListener('unimall:storeChanged', (e) => {
  const currentActiveView = document.querySelector('.admin-view.active');
  if (currentActiveView && currentActiveView.id === 'view-requests') {
    loadProductRequests(e.detail.storeId);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  // Founder Create Store Form
  const formStore = document.getElementById('founder-create-store-form');
  if (formStore) {
    formStore.addEventListener('submit', handleFounderCreateStore);
  }

  // Founder Create Owner Form
  const formOwner = document.getElementById('founder-create-owner-form');
  if (formOwner) {
    formOwner.addEventListener('submit', handleFounderCreateOwner);
  }
});

// ─── CUSTOMER DEMAND / PRODUCT REQUESTS ─────────────────────────

async function loadProductRequests(storeId) {
  if (!storeId) return;

  const tbody = document.getElementById('requests-tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6">Loading student requests...</td></tr>';
  }

  try {
    const data = await apiRequest(`/admin/stores/${storeId}/requests`);
    const requests = data.requests || [];

    if (requests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6" style="color: var(--text-muted);">No student product requests recorded for this store yet.</td></tr>';
      return;
    }

    tbody.innerHTML = requests.map(r => `
      <tr>
        <td><strong style="font-size: 14px;">${escapeHtml(r.product_name)}</strong></td>
        <td>
          <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 700; color: var(--primary); background: var(--primary-soft); padding: 2px 8px; border-radius: 999px; font-size: 12px;">
            🔥 Requested ${r.request_count} time${r.request_count === 1 ? '' : 's'}
          </span>
        </td>
        <td>
          <span class="badge-status ${r.status === 'available' ? 'completed' : (r.status === 'considering' ? 'preparing' : 'cancelled')}">
            ${r.status}
          </span>
        </td>
        <td>
          <select onchange="updateRequestStatus('${r.id}', this.value)" style="height: 30px; font-size: 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0 6px;">
            <option value="considering" ${r.status === 'considering' ? 'selected' : ''}>Considering</option>
            <option value="available" ${r.status === 'available' ? 'selected' : ''}>Now Available</option>
            <option value="dismissed" ${r.status === 'dismissed' ? 'selected' : ''}>Dismiss</option>
          </select>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center py-6" style="color: var(--danger);">Failed to load requests: ${err.message}</td></tr>`;
    }
  }
}

async function updateRequestStatus(requestId, newStatus) {
  try {
    await apiRequest(`/admin/requests/${requestId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`Request status updated to ${newStatus}.`, 'success');
    if (activeStoreId) loadProductRequests(activeStoreId);
  } catch {
    // Handled
  }
}
window.updateRequestStatus = updateRequestStatus;

// ─── FOUNDER HUB (PLATFORM ADMIN) ───────────────────────────────

async function loadFounderHub() {
  if (currentAdminUser?.role !== 'platform_admin') return;

  try {
    const data = await apiRequest('/admin/founder/overview');
    const stats = data.stats || {};

    const elStores = document.getElementById('founder-stat-stores');
    const elProds = document.getElementById('founder-stat-prods');
    const elRevenue = document.getElementById('founder-stat-revenue');
    const elOrders = document.getElementById('founder-stat-orders');

    if (elStores) elStores.textContent = stats.active_stores || 0;
    if (elProds) elProds.textContent = stats.active_products || 0;
    if (elRevenue) elRevenue.textContent = `₹${Number(stats.platform_revenue || 0).toLocaleString('en-IN')}`;
    if (elOrders) elOrders.textContent = stats.total_orders || 0;

    // Populate Store Assign Dropdown
    const select = document.getElementById('founder-owner-store-select');
    if (select) {
      select.innerHTML = currentAuthorizedStores.map(s => `
        <option value="${s.store_id}">${s.store_name}</option>
      `).join('');
    }

  } catch (err) {
    showToast(`Failed to load founder overview: ${err.message}`, 'error');
  }
}

async function handleFounderCreateStore(e) {
  e.preventDefault();
  const name = document.getElementById('founder-store-name-input').value.trim();
  const category = document.getElementById('founder-store-cat-input').value.trim();
  const location = document.getElementById('founder-store-loc-input').value.trim();

  const btn = document.getElementById('btn-founder-submit-store');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Creating...';
  }

  try {
    const res = await apiRequest('/admin/founder/stores', {
      method: 'POST',
      body: JSON.stringify({ name, category, location })
    });

    showToast(`Store "${name}" onboarded successfully!`, 'success');
    document.getElementById('founder-create-store-form').reset();

    // Refresh user store list
    const meData = await apiRequest('/auth/me');
    currentAuthorizedStores = meData.stores || [];
    setupStoreContext();
    loadFounderHub();

  } catch {
    // Handled
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Create Store';
    }
  }
}

async function handleFounderCreateOwner(e) {
  e.preventDefault();
  const storeId = document.getElementById('founder-owner-store-select').value;
  const name = document.getElementById('founder-owner-name').value.trim();
  const email = document.getElementById('founder-owner-email').value.trim();
  const password = document.getElementById('founder-owner-pass').value;

  const btn = document.getElementById('btn-founder-submit-owner');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Creating...';
  }

  try {
    const res = await apiRequest('/admin/founder/owners', {
      method: 'POST',
      body: JSON.stringify({
        store_id: storeId,
        name,
        email,
        password
      })
    });

    showToast(`Owner account for "${name}" created and assigned!`, 'success');
    document.getElementById('founder-create-owner-form').reset();

  } catch {
    // Handled
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Create & Assign Owner';
    }
  }
}

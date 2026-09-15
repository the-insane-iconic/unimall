/**
 * UniMall Store Admin — Inventory Controller (admin/js/inventory.js)
 * Fast stock adjustments, inline steppers, and thresholds.
 */

'use strict';

let currentInventory = [];
let inventorySearchQuery = '';

window.addEventListener('unimall:viewChanged', (e) => {
  if (e.detail.viewName === 'inventory') {
    loadInventory(e.detail.storeId);
  }
});

window.addEventListener('unimall:storeChanged', (e) => {
  const currentActiveView = document.querySelector('.admin-view.active');
  if (currentActiveView && currentActiveView.id === 'view-inventory') {
    loadInventory(e.detail.storeId);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('inventory-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        inventorySearchQuery = e.target.value.trim().toLowerCase();
        renderInventoryTable();
      }, 200);
    });
  }

  const btnRefresh = document.getElementById('btn-refresh-inventory');
  if (btnRefresh) {
    btnRefresh.addEventListener('click', () => {
      if (activeStoreId) loadInventory(activeStoreId);
    });
  }
});

async function loadInventory(storeId) {
  if (!storeId) return;

  const tbody = document.getElementById('inventory-tbody');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6">Loading inventory levels...</td></tr>';
  }

  try {
    const data = await apiRequest(`/admin/stores/${storeId}/inventory`);
    currentInventory = data.inventory || [];

    // Update chips
    const outCount = currentInventory.filter(i => i.quantity === 0).length;
    const lowCount = currentInventory.filter(i => i.quantity > 0 && i.quantity <= i.low_stock_threshold).length;

    const chipOut = document.getElementById('inv-chip-out');
    const chipLow = document.getElementById('inv-chip-low');
    if (chipOut) chipOut.textContent = `${outCount} Out of Stock`;
    if (chipLow) chipLow.textContent = `${lowCount} Low Stock`;

    renderInventoryTable();
  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6" style="color: var(--danger);">Failed to load inventory: ${err.message}</td></tr>`;
    }
  }
}

function renderInventoryTable() {
  const tbody = document.getElementById('inventory-tbody');
  if (!tbody) return;

  let filtered = currentInventory;
  if (inventorySearchQuery) {
    filtered = currentInventory.filter(it =>
      it.name.toLowerCase().includes(inventorySearchQuery) ||
      (it.sku && it.sku.toLowerCase().includes(inventorySearchQuery))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6" style="color: var(--text-muted);">No inventory items match your search.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(it => {
    const availClass = it.quantity === 0 ? 'out_of_stock' : (it.quantity <= it.low_stock_threshold ? 'low_stock' : 'in_stock');
    const availLabel = it.quantity === 0 ? 'Out of Stock' : (it.quantity <= it.low_stock_threshold ? 'Low Stock' : 'In Stock');

    return `
      <tr>
        <td>
          <div style="font-weight: 600;">${escapeHtml(it.name)}</div>
          <div style="font-size: 11.5px; color: var(--text-muted);">${escapeHtml(it.sku || it.category_name || '')}</div>
        </td>
        <td>₹${Number(it.price).toFixed(2)}</td>
        <td>
          <strong id="qty-val-${it.product_id}" style="font-size: 15px; ${it.quantity === 0 ? 'color: var(--danger);' : ''}">
            ${it.quantity}
          </strong>
          <span style="font-size: 12px; color: var(--text-muted);"> ${it.unit || 'items'}</span>
        </td>
        <td>
          <div class="stepper-wrap">
            <button type="button" class="btn-step" onclick="adjustStockStep('${it.product_id}', -1)" title="Decrease stock">-</button>
            <span class="step-value" id="step-display-${it.product_id}">${it.quantity}</span>
            <button type="button" class="btn-step" onclick="adjustStockStep('${it.product_id}', 1)" title="Increase stock">+</button>
          </div>
          <button type="button" class="btn-action secondary" onclick="promptSetQuantity('${it.product_id}', '${escapeHtml(it.name)}', ${it.quantity})"
                  style="height: 28px; font-size: 11px; padding: 0 6px; margin-left: 6px;">
            Set
          </button>
        </td>
        <td>
          <input type="number" min="1" value="${it.low_stock_threshold}"
                 onchange="updateLowStockThreshold('${it.product_id}', this.value)"
                 style="width: 60px; height: 28px; padding: 2px 6px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 12.5px;" />
        </td>
        <td>
          <span class="pill-avail ${availClass}" id="avail-pill-${it.product_id}">${availLabel}</span>
        </td>
      </tr>
    `;
  }).join('');
}

const debounceStockTimers = {};

function adjustStockStep(productId, delta) {
  const item = currentInventory.find(i => i.product_id === productId);
  if (!item) return;

  const newQty = Math.max(0, item.quantity + delta);
  item.quantity = newQty;

  // Immediate optimistic UI update
  const displayVal = document.getElementById(`step-display-${productId}`);
  const qtyVal = document.getElementById(`qty-val-${productId}`);
  const pill = document.getElementById(`avail-pill-${productId}`);

  if (displayVal) displayVal.textContent = newQty;
  if (qtyVal) qtyVal.textContent = newQty;

  if (pill) {
    const isOut = newQty === 0;
    const isLow = !isOut && newQty <= item.low_stock_threshold;
    pill.className = `pill-avail ${isOut ? 'out_of_stock' : (isLow ? 'low_stock' : 'in_stock')}`;
    pill.textContent = isOut ? 'Out of Stock' : (isLow ? 'Low Stock' : 'In Stock');
  }

  // Debounced API mutation
  clearTimeout(debounceStockTimers[productId]);
  debounceStockTimers[productId] = setTimeout(async () => {
    try {
      await apiRequest(`/admin/inventory/${productId}`, {
        method: 'PATCH',
        body: JSON.stringify({ quantity: newQty })
      });
    } catch {
      // Revert if failed
      if (activeStoreId) loadInventory(activeStoreId);
    }
  }, 350);
}
window.adjustStockStep = adjustStockStep;

async function promptSetQuantity(productId, name, currentQty) {
  const input = prompt(`Enter new stock quantity for "${name}":`, currentQty);
  if (input === null) return;

  const newQty = parseInt(input, 10);
  if (isNaN(newQty) || newQty < 0) {
    showToast('Invalid quantity.', 'error');
    return;
  }

  try {
    const res = await apiRequest(`/admin/inventory/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity: newQty })
    });
    showToast(res.message || `Stock set to ${newQty}.`, 'success');
    if (activeStoreId) loadInventory(activeStoreId);
  } catch {
    // Handled
  }
}
window.promptSetQuantity = promptSetQuantity;

function quickRestock(productId, name, currentQty) {
  // Directly switch to inventory tab and prompt
  window.switchView('inventory');
  setTimeout(() => {
    promptSetQuantity(productId, name, currentQty);
  }, 150);
}
window.quickRestock = quickRestock;

async function updateLowStockThreshold(productId, threshold) {
  const t = parseInt(threshold, 10);
  if (isNaN(t) || t < 1) return;

  try {
    await apiRequest(`/admin/inventory/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ low_stock_threshold: t })
    });
    showToast('Threshold updated.', 'success');
    if (activeStoreId) loadInventory(activeStoreId);
  } catch {
    // Handled
  }
}
window.updateLowStockThreshold = updateLowStockThreshold;

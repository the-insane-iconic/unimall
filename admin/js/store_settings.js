/**
 * UniMall Store Admin — Store Profile & Hours Settings (admin/js/store_settings.js)
 */

'use strict';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

window.addEventListener('unimall:viewChanged', (e) => {
  if (e.detail.viewName === 'store') {
    loadStoreSettings(e.detail.storeId);
  }
});

window.addEventListener('unimall:storeChanged', (e) => {
  const currentActiveView = document.querySelector('.admin-view.active');
  if (currentActiveView && currentActiveView.id === 'view-store') {
    loadStoreSettings(e.detail.storeId);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('store-settings-form');
  if (form) {
    form.addEventListener('submit', handleStoreSettingsSubmit);
  }

  // Live image preview
  const imgInput = document.getElementById('setting-store-image');
  if (imgInput) {
    imgInput.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      const previewBox = document.getElementById('store-image-preview');
      if (previewBox) {
        if (url) {
          previewBox.innerHTML = `<img src="${escapeHtml(url)}" alt="Store preview" onerror="this.parentElement.innerHTML='Invalid image URL';" />`;
        } else {
          previewBox.innerHTML = `<span>No image set</span>`;
        }
      }
    });
  }
});

async function loadStoreSettings(storeId) {
  if (!storeId) return;

  try {
    const data = await apiRequest(`/admin/stores/${storeId}`);
    const store = data.store;

    document.getElementById('setting-store-name').value = store.name || '';
    document.getElementById('setting-store-cat').value = store.category || '';
    document.getElementById('setting-store-location').value = store.location || '';
    document.getElementById('setting-store-phone').value = store.phone || '';
    document.getElementById('setting-store-desc').value = store.description || '';
    document.getElementById('setting-store-image').value = store.image_url || '';

    // Image preview
    const previewBox = document.getElementById('store-image-preview');
    if (previewBox && store.image_url) {
      previewBox.innerHTML = `<img src="${escapeHtml(store.image_url)}" alt="Store preview" />`;
    }

    document.getElementById('setting-accepts-delivery').checked = store.accepts_delivery === 1;
    document.getElementById('setting-accepts-pickup').checked = store.accepts_pickup === 1;

    // Render Weekly Hours
    renderHoursEditor(store.hours || {});

  } catch (err) {
    showToast(`Failed to load store settings: ${err.message}`, 'error');
  }
}

function renderHoursEditor(hoursObj) {
  const container = document.getElementById('hours-editor-container');
  if (!container) return;

  container.innerHTML = DAYS_OF_WEEK.map(day => {
    const d = hoursObj[day] || { open: '09:00', close: '21:00', closed: false };
    const isClosed = Boolean(d.closed);

    return `
      <div class="day-row" id="day-row-${day}">
        <div class="day-name">${day}</div>
        <div>
          <input type="time" class="hr-open" value="${d.open || '09:00'}" ${isClosed ? 'disabled' : ''} />
        </div>
        <div>
          <input type="time" class="hr-close" value="${d.close || '21:00'}" ${isClosed ? 'disabled' : ''} />
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <input type="checkbox" class="hr-closed" id="chk-closed-${day}" ${isClosed ? 'checked' : ''}
                 onchange="toggleDayClosed('${day}', this.checked)" />
          <label for="chk-closed-${day}" style="font-size: 11.5px; color: var(--text-muted); cursor: pointer;">Closed</label>
        </div>
      </div>
    `;
  }).join('');
}

function toggleDayClosed(day, isClosed) {
  const row = document.getElementById(`day-row-${day}`);
  if (!row) return;

  const openInput = row.querySelector('.hr-open');
  const closeInput = row.querySelector('.hr-close');

  if (openInput) openInput.disabled = isClosed;
  if (closeInput) closeInput.disabled = isClosed;
}
window.toggleDayClosed = toggleDayClosed;

async function handleStoreSettingsSubmit(e) {
  e.preventDefault();
  if (!activeStoreId) return;

  const hoursJson = {};
  DAYS_OF_WEEK.forEach(day => {
    const row = document.getElementById(`day-row-${day}`);
    if (row) {
      const isClosed = row.querySelector('.hr-closed').checked;
      const openTime = row.querySelector('.hr-open').value;
      const closeTime = row.querySelector('.hr-close').value;
      hoursJson[day] = {
        open: openTime,
        close: closeTime,
        closed: isClosed
      };
    }
  });

  const payload = {
    name: document.getElementById('setting-store-name').value.trim(),
    category: document.getElementById('setting-store-cat').value.trim(),
    location: document.getElementById('setting-store-location').value.trim(),
    phone: document.getElementById('setting-store-phone').value.trim(),
    description: document.getElementById('setting-store-desc').value.trim(),
    image_url: document.getElementById('setting-store-image').value.trim(),
    accepts_delivery: document.getElementById('setting-accepts-delivery').checked ? 1 : 0,
    accepts_pickup: document.getElementById('setting-accepts-pickup').checked ? 1 : 0,
    hours_json: hoursJson
  };

  const btnSave = document.getElementById('btn-save-store');
  if (btnSave) {
    btnSave.disabled = true;
    btnSave.textContent = 'Saving...';
  }

  try {
    await apiRequest(`/admin/stores/${activeStoreId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });

    showToast('Store profile & hours updated successfully!', 'success');

    // Update active store name in context
    const current = currentAuthorizedStores.find(s => s.store_id === activeStoreId);
    if (current) current.store_name = payload.name;
    updateStoreDisplay();

  } catch {
    // Handled
  } finally {
    if (btnSave) {
      btnSave.disabled = false;
      btnSave.textContent = 'Save Changes';
    }
  }
}

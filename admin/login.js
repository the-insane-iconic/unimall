/**
 * UniMall Store Admin — Login Controller (admin/login.js)
 */

'use strict';

const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-login-form');
  const emailInput = document.getElementById('email');
  const passInput = document.getElementById('password');
  const errorAlert = document.getElementById('error-alert');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner');

  // Check if already authenticated
  const existingToken = sessionStorage.getItem('unimall_admin_token');
  if (existingToken) {
    verifyExistingSession(existingToken);
  }

  // Handle manual login
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    setLoading(true);

    const email = emailInput.value.trim();
    const password = passInput.value;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        saveAdminSession(data);
        window.location.href = 'index.html';
        return;
      }
    } catch (err) {
      // Local API is offline on static deployment, fallback to direct store admin mode
    }

    // Static / Supabase Store Admin Accounts
    const ADMIN_ACCOUNTS = {
      'founder@unimall.edu': { name: 'UniMall Founder', role: 'platform_admin', storeId: null, storeName: 'All Stores' },
      'bakery@unimall.edu':  { name: 'Priya Sharma', role: 'store_owner', storeId: 'campus-cafe', storeName: 'Campus Bakery & Café' },
      'books@unimall.edu':   { name: 'Rajesh Verma', role: 'store_owner', storeId: 'book-corner', storeName: 'Stationery Hub & Book Corner' },
      'tech@unimall.edu':    { name: 'Karan Patel', role: 'store_owner', storeId: 'techstop', storeName: 'TechStop Electronics' },
      'mart@unimall.edu':    { name: 'Anita Roy', role: 'store_owner', storeId: 'campus-mart', storeName: 'Campus Mart & Groceries' },
      'wear@unimall.edu':    { name: 'Siddharth Nair', role: 'store_owner', storeId: 'campus-wear', storeName: 'Campus Wear & Style Square' }
    };

    const targetAdmin = ADMIN_ACCOUNTS[email.toLowerCase()];
    if (targetAdmin && (password === 'admin123' || password.length >= 4)) {
      const sessionData = {
        token: 'unimall_token_' + Date.now(),
        user: {
          id: 'admin_' + (targetAdmin.storeId || 'founder'),
          name: targetAdmin.name,
          email: email,
          role: targetAdmin.role
        },
        stores: targetAdmin.role === 'platform_admin'
          ? [
              { store_id: 'campus-cafe', store_name: 'Campus Bakery & Café', membership_role: 'admin' },
              { store_id: 'book-corner', store_name: 'Stationery Hub & Book Corner', membership_role: 'admin' },
              { store_id: 'techstop', store_name: 'TechStop Electronics', membership_role: 'admin' },
              { store_id: 'campus-mart', store_name: 'Campus Mart & Groceries', membership_role: 'admin' },
              { store_id: 'campus-wear', store_name: 'Campus Wear & Style Square', membership_role: 'admin' },
              { store_id: 'health-hub', store_name: 'Health Hub & Care', membership_role: 'admin' }
            ]
          : [
              { store_id: targetAdmin.storeId, store_name: targetAdmin.storeName, membership_role: 'owner' }
            ]
      };
      saveAdminSession(sessionData);
      window.location.href = 'index.html';
      return;
    }

    showError('Invalid email or password.');
    setLoading(false);
  });

  // Handle Demo Quick-Login Buttons
  document.querySelectorAll('.btn-demo').forEach((btn) => {
    btn.addEventListener('click', () => {
      emailInput.value = btn.getAttribute('data-email');
      passInput.value = btn.getAttribute('data-pass');
      form.dispatchEvent(new Event('submit'));
    });
  });

  function showError(msg) {
    errorAlert.textContent = msg;
    errorAlert.classList.remove('hidden');
  }

  function hideError() {
    errorAlert.textContent = '';
    errorAlert.classList.add('hidden');
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
      btnText.textContent = 'Verifying...';
      spinner.classList.remove('hidden');
    } else {
      btnText.textContent = 'Sign In to Dashboard';
      spinner.classList.add('hidden');
    }
  }

  function saveAdminSession(data) {
    sessionStorage.setItem('unimall_admin_token', data.token);
    sessionStorage.setItem('unimall_admin_user', JSON.stringify(data.user));
    sessionStorage.setItem('unimall_admin_stores', JSON.stringify(data.stores));

    // Choose default active store
    if (data.stores && data.stores.length > 0) {
      sessionStorage.setItem('unimall_admin_active_store', data.stores[0].store_id);
    }
  }

  async function verifyExistingSession(token) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        window.location.href = 'index.html';
      }
    } catch {
      sessionStorage.removeItem('unimall_admin_token');
    }
  }
});

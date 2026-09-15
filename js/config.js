/* ═══════════════════════════════════════════════════════════
   UNIMALL — CENTRAL CONFIG & SUPABASE CLIENT (js/config.js)
   ═══════════════════════════════════════════════════════════ */

'use strict';

window.UNIMALL_CONFIG = {
  SUPABASE_URL: 'https://ncfhvkhthtrzrzvlpxdq.supabase.co',
  SUPABASE_KEY: 'sb_publishable_on7DapWFNo1nXC6RzI5PCQ_p6fHKWIf',
  STORAGE_BUCKET: 'unimall-media',
  
  FIREBASE: {
    apiKey: "AIzaSyAI1pYMj_ht9YRrVCMKNYNVtmt_mZw-ysI",
    authDomain: "unimall-d484f.firebaseapp.com",
    projectId: "unimall-d484f",
    storageBucket: "unimall-d484f.firebasestorage.app",
    messagingSenderId: "162359291874",
    appId: "1:162359291874:web:fe413c9fa9b823ce06d3bb",
    measurementId: "G-28QZKVB4K1"
  }
};

/**
 * Lightweight UniMall Supabase Client
 * Works directly via PostgREST with standard fetch — zero external dependency needed.
 */
window.UniMallDB = {
  async req(endpoint, options = {}) {
    const url = `${window.UNIMALL_CONFIG.SUPABASE_URL}/rest/v1/${endpoint}`;
    const headers = {
      'apikey': window.UNIMALL_CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${window.UNIMALL_CONFIG.SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Request failed (${res.status})`);
      }
      if (res.status === 204) return null;
      return await res.json();
    } catch (e) {
      console.warn(`[UniMallDB] ${endpoint} failed:`, e.message);
      throw e;
    }
  },

  /* ── Stores ── */
  async getStores() {
    return await this.req('unimall_stores?select=*&order=popularity.desc');
  },

  /* ── Products ── */
  async getProducts(storeId = null) {
    let query = 'unimall_products?select=*&is_active=eq.true&order=created_at.desc';
    if (storeId) {
      query += `&store_id=eq.${encodeURIComponent(storeId)}`;
    }
    return await this.req(query);
  },

  /* ── Place Order ── */
  async createOrder(orderPayload, items) {
    // 1. Insert order
    const createdOrders = await this.req('unimall_orders', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(orderPayload)
    });

    const order = createdOrders && createdOrders[0] ? createdOrders[0] : orderPayload;

    // 2. Insert items
    if (items && items.length > 0) {
      const formattedItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId || item.product_id,
        product_name: item.name || item.product_name,
        price: item.price,
        qty: item.qty || 1,
        emoji: item.emoji || '📦',
        image: item.image || ''
      }));

      await this.req('unimall_order_items', {
        method: 'POST',
        headers: { 'Prefer': 'return=representation' },
        body: JSON.stringify(formattedItems)
      }).catch(err => console.warn('Order items insert warning:', err));
    }

    // 3. Insert initial status history
    await this.req('unimall_order_status_history', {
      method: 'POST',
      body: JSON.stringify({
        order_id: order.id,
        status: order.status || 'placed',
        notes: 'Order placed by student'
      })
    }).catch(() => {});

    return order;
  },

  /* ── Get Orders for User ── */
  async getUserOrders(userId) {
    if (!userId) return [];
    return await this.req(`unimall_orders?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&select=*,unimall_order_items(*)`);
  },

  /* ── Get Specific Order ── */
  async getOrderById(orderId) {
    const orders = await this.req(`unimall_orders?id=eq.${encodeURIComponent(orderId)}&select=*,unimall_order_items(*),unimall_order_status_history(*)`);
    return orders && orders[0] ? orders[0] : null;
  },

  /* ── Update Order Status (Store Admin or Student) ── */
  async updateOrderStatus(orderId, status, notes = '') {
    const updated = await this.req(`unimall_orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() })
    });

    // Record history
    await this.req('unimall_order_status_history', {
      method: 'POST',
      body: JSON.stringify({
        order_id: orderId,
        status,
        notes: notes || `Status updated to ${status}`
      })
    }).catch(() => {});

    return updated && updated[0] ? updated[0] : null;
  },

  /* ── Realtime Listener for Order Status Updates ── */
  subscribeToOrder(orderId, onUpdate) {
    // We poll gently every 5 seconds as a rock-solid fallback that works universally
    const timer = setInterval(async () => {
      try {
        const order = await this.getOrderById(orderId);
        if (order && onUpdate) onUpdate(order);
      } catch (e) {}
    }, 4500);

    return () => clearInterval(timer);
  }
};

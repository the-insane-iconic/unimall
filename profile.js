/* ═══════════════════════════════════════════════════════════
   UNIMALL — USER PROFILE CONTROLLER (profile.js)
   ═══════════════════════════════════════════════════════════ */

'use strict';

const STORAGE_KEY = 'unimall_v1';
const AUTH_KEY = 'unimall_auth';

/* ─── FIREBASE CONFIG (FOR AUTH SIGN-OUT / UPGRADE) ───────── */
const firebaseConfig = {
  apiKey: "AIzaSyAI1pYMj_ht9YRrVCMKNYNVtmt_mZw-ysI",
  authDomain: "unimall-d484f.firebaseapp.com",
  projectId: "unimall-d484f",
  storageBucket: "unimall-d484f.firebasestorage.app",
  messagingSenderId: "162359291874",
  appId: "1:162359291874:web:fe413c9fa9b823ce06d3bb",
  measurementId: "G-28QZKVB4K1"
};

let firebaseAuth = null;
try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    firebaseAuth = firebase.auth();
  }
} catch (e) {
  console.warn('Firebase init note:', e);
}

/* ─── PROFILE STATE ──────────────────────────────────────── */
const ProfileState = {
  user: {
    name: 'Aarav Singh',
    email: 'aarav.s@university.edu',
    phone: '',
    hostel: 'Hostel B',
    room: 'Room 214',
    avatar: '',
    provider: 'google',
    isGuest: false
  },
  orders: [],
  requests: []
};

/* ─── LOAD DATA ──────────────────────────────────────────── */
function loadProfileData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.currentUser) {
        ProfileState.user = { ...ProfileState.user, ...parsed.currentUser };
      }
      if (Array.isArray(parsed.orders)) {
        ProfileState.orders = parsed.orders;
      }
      if (Array.isArray(parsed.itemRequests)) {
        ProfileState.requests = parsed.itemRequests;
      }
    }

    const authRaw = localStorage.getItem(AUTH_KEY);
    if (authRaw) {
      const authUser = JSON.parse(authRaw);
      ProfileState.user.isGuest = !!authUser.isGuest;
      if (authUser.avatar) ProfileState.user.avatar = authUser.avatar;
    }
  } catch (e) {
    console.error('Error loading profile data:', e);
  }
}

function saveProfileData() {
  try {
    let appData = {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      appData = JSON.parse(raw);
    }
    appData.currentUser = { ...ProfileState.user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    showToast('Campus details saved successfully');
  } catch (e) {
    console.error('Error saving profile data:', e);
    showToast('Error saving changes');
  }
}

/* ─── RENDER ─────────────────────────────────────────────── */
function renderProfile() {
  const u = ProfileState.user;

  // Hero section
  const userDisplayName = document.getElementById('userDisplayName');
  const userEmailText = document.getElementById('userEmailText');
  const userHostelSub = document.getElementById('userHostelSub');
  const avatarPlaceholder = document.getElementById('avatarPlaceholder');
  const avatarImg = document.getElementById('avatarImg');
  const authStatusPill = document.getElementById('authStatusPill');
  const switchGoogleBtn = document.getElementById('switchGoogleBtn');

  if (userDisplayName) userDisplayName.textContent = u.name || 'Campus Student';
  if (userEmailText) userEmailText.textContent = u.email || 'student@university.edu';
  if (userHostelSub) userHostelSub.textContent = `${u.hostel || 'Hostel'} · ${u.room || 'Room'}`;

  // Avatar
  const avatarSrc = u.avatar || (typeof window.getStickerAvatar === 'function' ? window.getStickerAvatar(u.name || 'Student') : '');
  if (avatarSrc && avatarImg) {
    avatarImg.src = avatarSrc;
    avatarImg.classList.remove('hidden');
    if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');
  } else if (avatarPlaceholder && avatarImg) {
    avatarPlaceholder.textContent = (u.name && u.name.trim()[0]) ? u.name.trim()[0].toUpperCase() : 'U';
    avatarPlaceholder.classList.remove('hidden');
    avatarImg.classList.add('hidden');
  }

  // Auth badge & connect button
  if (authStatusPill) {
    if (u.isGuest) {
      authStatusPill.className = 'auth-status-pill guest';
      authStatusPill.innerHTML = 'Guest Account';
      if (switchGoogleBtn) switchGoogleBtn.classList.remove('hidden');
    } else {
      authStatusPill.className = 'auth-status-pill verified';
      authStatusPill.innerHTML = '<span class="auth-icon">✓</span> Google Verified';
      if (switchGoogleBtn) switchGoogleBtn.classList.add('hidden');
    }
  }

  // Stats
  const statTotalOrders = document.getElementById('statTotalOrders');
  const statActiveOrders = document.getElementById('statActiveOrders');
  const statRequests = document.getElementById('statRequests');

  const totalOrders = ProfileState.orders.length;
  const activeOrders = ProfileState.orders.filter(o => o.status === 'placed' || o.status === 'preparing' || o.status === 'ready').length;
  const requestCount = ProfileState.requests.length;

  if (statTotalOrders) statTotalOrders.textContent = totalOrders;
  if (statActiveOrders) statActiveOrders.textContent = activeOrders;
  if (statRequests) statRequests.textContent = requestCount;

  // Form fields
  const profName = document.getElementById('profName');
  const profEmail = document.getElementById('profEmail');
  const profPhone = document.getElementById('profPhone');
  const profHostel = document.getElementById('profHostel');
  const profRoom = document.getElementById('profRoom');

  if (profName) profName.value = u.name || '';
  if (profEmail) profEmail.value = u.email || '';
  if (profPhone) profPhone.value = u.phone || '';
  if (profHostel) profHostel.value = u.hostel || '';
  if (profRoom) profRoom.value = u.room || '';
}

/* ─── LOGOUT ─────────────────────────────────────────────── */
async function handleLogout() {
  if (confirm('Are you sure you want to log out from UniMall?')) {
    if (firebaseAuth) {
      try {
        await firebaseAuth.signOut();
      } catch (e) { }
    }
    localStorage.removeItem(AUTH_KEY);
    showToast('Logged out');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  }
}

/* ─── CONNECT GOOGLE ACCOUNT (FROM GUEST) ────────────────── */
async function handleConnectGoogle() {
  if (firebaseAuth) {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await firebaseAuth.signInWithPopup(provider);
      const user = result.user;
      ProfileState.user.name = user.displayName || ProfileState.user.name;
      ProfileState.user.email = user.email || ProfileState.user.email;
      ProfileState.user.avatar = user.photoURL || '';
      ProfileState.user.isGuest = false;
      ProfileState.user.provider = 'google';

      localStorage.setItem(AUTH_KEY, JSON.stringify({
        uid: user.uid,
        name: ProfileState.user.name,
        email: ProfileState.user.email,
        avatar: ProfileState.user.avatar,
        isGuest: false
      }));

      saveProfileData();
      renderProfile();
      showToast(`Connected Google account for ${ProfileState.user.name}!`);
    } catch (e) {
      console.warn('Google Connect error:', e);
    }
  }
}

/* ─── TOAST ──────────────────────────────────────────────── */
let toastTimeout = null;
function showToast(message) {
  const toast = document.getElementById('profileToast');
  const msgEl = document.getElementById('toastMessage');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.remove('hidden');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

/* ─── CART BADGE SYNC ────────────────────────────────────── */
function syncCartBadge() {
  try {
    let items = [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.cart)) items = parsed.cart;
    }
    const totalCount = items.reduce((sum, item) => sum + (item.qty || 1), 0);
    const badges = document.querySelectorAll('.nav-badge, .cart-badge, .sidebar-badge');
    badges.forEach(badge => {
      badge.textContent = totalCount > 9 ? '9+' : String(totalCount);
      badge.style.display = totalCount > 0 ? '' : 'none';
      badge.setAttribute('aria-label', `${totalCount} item${totalCount !== 1 ? 's' : ''} in cart`);
    });
    const cartNav = document.getElementById('nav-cart');
    if (cartNav) cartNav.setAttribute('aria-label', `Cart, ${totalCount} item${totalCount !== 1 ? 's' : ''}`);
  } catch (e) { }
}

function syncSidebarProfile() {
  try {
    const u = ProfileState.user;
    if (!u) return;

    const nameEl = document.querySelector('.sidebar-profile-name');
    const roleEl = document.querySelector('.sidebar-profile-role');
    const avatarEl = document.querySelector('.sidebar-avatar');

    if (nameEl && u.name) nameEl.textContent = u.name;
    if (roleEl) roleEl.textContent = `${u.hostel || 'Hostel B'} · ${u.room || 'Room 214'}`;
    if (avatarEl) {
      if (u.avatar) {
        avatarEl.innerHTML = `<img src="${u.avatar}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      } else if (u.name) {
        avatarEl.textContent = u.name.trim()[0].toUpperCase();
      }
    }
  } catch (e) { }
}

/* ─── EVENT LISTENERS ────────────────────────────────────── */
function initEvents() {
  // Back button
  document.getElementById('backButton')?.addEventListener('click', () => {
    if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  });

  // Save profile form
  document.getElementById('profileForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const profName = document.getElementById('profName')?.value?.trim();
    const profPhone = document.getElementById('profPhone')?.value?.trim();
    const profHostel = document.getElementById('profHostel')?.value?.trim();
    const profRoom = document.getElementById('profRoom')?.value?.trim();

    if (profName) ProfileState.user.name = profName;
    if (profPhone !== undefined) ProfileState.user.phone = profPhone;
    if (profHostel) ProfileState.user.hostel = profHostel;
    if (profRoom) ProfileState.user.room = profRoom;

    saveProfileData();
    renderProfile();
  });

  // Logout button
  document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

  // Connect Google button
  document.getElementById('switchGoogleBtn')?.addEventListener('click', handleConnectGoogle);

  // Helpdesk button
  document.getElementById('campusHelpdeskBtn')?.addEventListener('click', () => {
    showToast('UniMall Helpdesk: Ground Floor, Main Entrance');
  });

  // Sound FX toggle
  const soundToggle = document.getElementById('toggleSoundFX');
  if (soundToggle) {
    soundToggle.checked = localStorage.getItem('unimall_sound_enabled') !== 'false';
    soundToggle.addEventListener('change', (e) => {
      localStorage.setItem('unimall_sound_enabled', e.target.checked ? 'true' : 'false');
      if (e.target.checked && window.UniMallSound) {
        window.UniMallSound.play('pop');
        showToast('Tactile audio enabled');
      } else {
        showToast('Tactile audio silenced');
      }
    });
  }

  // Share profile
  document.getElementById('headerShareBtn')?.addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title: 'My UniMall Profile', url: window.location.href }).catch(() => { });
    } else {
      showToast('Profile link ready to share');
    }
  });
}

/* ─── INITIALIZATION ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadProfileData();
  initEvents();
  renderProfile();
  syncCartBadge();
  syncSidebarProfile();
});

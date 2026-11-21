/* ===========================================
   ADMIN.JS — Shared Admin Utilities
   Auth, Navigation, Toast, Socket
   =========================================== */
(function () {
  'use strict';

  window.Admin = window.Admin || {};

 const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000/api/v1'
  : '/api/v1';

  // ── Auth Check ──
  function checkAuth() {
    if (!api || !api.isAuthenticated()) {
      window.location.href = './login.html';
      return false;
    }
    return true;
  }

  // ── Get Token ──
  function getToken() {
    return api && api.token ? api.token : localStorage.getItem('auth_token');
  }

  // ── Get Current User ──
  function getCurrentUser() {
    return api ? api.getCurrentUser() : null;
  }

  // ── API Request Helper ──
  async function request(url, options) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...(options && options.headers)
    };

    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  // ── Toast ──
  function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(120%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3500);
  }

  // ── Mobile Menu (Handles BOTH desktop & mobile buttons) ──
  function initMobileMenu() {
    // Grab both possible menu buttons
    const hamburger = document.getElementById('hamburgerAdmin'); 
    const mobileToggle = document.getElementById('menuToggle'); 
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('menuOverlay');

    if (!sidebar) return;

    function openMenu() {
      sidebar.classList.add('open');
      if (hamburger) hamburger.classList.add('active');
      if (overlay) overlay.classList.add('active');
    }

    function closeMenu() {
      sidebar.classList.remove('open');
      if (hamburger) hamburger.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
    }

    function toggleMenu() {
      if (sidebar.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    // Bind to both the desktop hamburger and the mobile menu button
    if (hamburger) hamburger.addEventListener('click', toggleMenu);
    if (mobileToggle) mobileToggle.addEventListener('click', toggleMenu);

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    // Close if clicking outside the sidebar
    document.addEventListener('click', function (e) {
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          (!hamburger || !hamburger.contains(e.target)) &&
          (!mobileToggle || !mobileToggle.contains(e.target))) {
        closeMenu();
      }
    });
  }

    // ── User Info ──
  function initUserInfo() {
    const user = getCurrentUser();
    if (!user) return;

    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userRole = document.getElementById('userRole');

    if (userName) userName.textContent = user.name || 'Admin';
    if (userRole) userRole.textContent = user.role || 'Admin';
    
    // CHECK: Only replace with the letter if there is NO image already there
    if (userAvatar) {
      const hasImage = userAvatar.querySelector('img');
      if (!hasImage) {
        userAvatar.textContent = (user.name?.[0] || 'A').toUpperCase();
      }
    }
  }

  // ── Greeting ──
  function initGreeting() {
    const greetingEl = document.getElementById('greetingTitle');
    if (!greetingEl) return;

    const user = getCurrentUser();
    const hour = new Date().getHours();
    let greeting = 'Good evening';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';

    greetingEl.textContent = greeting + ', ' + (user?.name?.split(' ')[0] || 'Ganiyu');
  }

  // ── Logout ──
  function initLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        api.logout();
      });
    }
  }

  // ── Socket ──
  function initSocket() {
    if (typeof io === 'undefined') return;

   const SOCKET_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : window.location.origin; // Uses Netlify's proxy

const socket = io(SOCKET_URL);

    socket.on('connect', function () {
      socket.emit('user-join', { role: 'admin' });
      updateSocketStatus(true);
    });

    socket.on('disconnect', function () {
      updateSocketStatus(false);
    });

    socket.on('admin-notification', function (data) {
      if (data.type === 'new-message') {
        showToast('New message from ' + (data.message?.sender?.name || 'Visitor'), 'info');
        if (typeof window.onNewMessage === 'function') {
          window.onNewMessage(data);
        }
      }
    });

    window.adminSocket = socket;
  }

  function updateSocketStatus(connected) {
    const dot = document.getElementById('socketDot');
    const status = document.getElementById('socketStatus');
    if (dot) dot.className = 'status-dot ' + (connected ? 'online' : 'offline');
    if (status) status.textContent = connected ? 'Connected' : 'Disconnected';
  }

  // ── Escape HTML ──
  function escapeHTML(str) {
    if (!str && str !== 0) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // ── Format Date ──
  function formatDate(dateStr) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  // ── Format Number ──
  function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return String(num);
  }

  // ── Debounce ──
  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  // ── Expose to Window ──
  window.Admin = {
    API_BASE: API_BASE,
    checkAuth: checkAuth,
    getToken: getToken,
    getCurrentUser: getCurrentUser,
    request: request,
    showToast: showToast,
    escapeHTML: escapeHTML,
    formatDate: formatDate,
    formatNumber: formatNumber,
    debounce: debounce,
  };

  // ── Init ──
  if (checkAuth()) {
    initMobileMenu();
    initUserInfo();
    initGreeting();
    initLogout();
    initSocket();
    // Note: initTheme() was removed here because theme.js handles it globally!
  }

})();
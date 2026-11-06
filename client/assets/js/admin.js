/* ===========================================
   ADMIN.JS — Shared Admin Utilities
   Auth, Theme, Navigation, Toast, Socket
   =========================================== */
(function () {
  'use strict';

  window.Admin = window.Admin || {};

  const API_BASE = 'http://localhost:5000/api/v1';

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

  // ── Theme Toggle ──
  function initTheme() {
    const saved = localStorage.getItem('admin_theme');
    if (saved === 'dark') document.body.classList.add('dark-theme');
    if (saved === 'light') document.body.classList.remove('dark-theme');

    document.querySelectorAll('.theme-toggle-admin').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('admin_theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
      });
    });
  }

  // ── Mobile Menu (REPLACE existing initMobileMenu) ──
function initMobileMenu() {
  const hamburger = document.getElementById('hamburgerAdmin');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('menuOverlay');

  if (!hamburger || !sidebar) return;

  function openMenu() {
    sidebar.classList.add('open');
    hamburger.classList.add('active');
    if (overlay) overlay.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    sidebar.classList.remove('open');
    hamburger.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  hamburger.addEventListener('click', function () {
    if (sidebar.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  document.addEventListener('click', function (e) {
    if (sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== hamburger &&
        !hamburger.contains(e.target)) {
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
    if (userAvatar) userAvatar.textContent = (user.name?.[0] || 'A').toUpperCase();
    if (userRole) userRole.textContent = user.role || 'Admin';
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

    const socket = io('http://localhost:5000');

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
    initTheme();
    initMobileMenu();
    initUserInfo();
    initGreeting();
    initLogout();
    initSocket();
  }

})();
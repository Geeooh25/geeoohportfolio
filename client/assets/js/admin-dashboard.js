/* ===========================================
   ADMIN-DASHBOARD.JS — Dashboard Logic
   =========================================== */
(function () {
  'use strict';

  if (!Admin.checkAuth()) return;

  // ── DOM Refs ──
  const DOM = {
    totalProjects: document.getElementById('totalProjects'),
    totalBlogs: document.getElementById('totalBlogs'),
    totalMessages: document.getElementById('totalMessages'),
    totalViews: document.getElementById('totalViews'),
    messageBadge: document.getElementById('messageBadge'),
    unreadBadge: document.getElementById('unreadBadge'),
    qaMessageDesc: document.getElementById('qaMessageDesc'),
    activityList: document.getElementById('activityList'),
    activityCount: document.getElementById('activityCount'),
    apiDot: document.getElementById('apiDot'),
    apiStatus: document.getElementById('apiStatus'),
    dbDot: document.getElementById('dbDot'),
    dbStatus: document.getElementById('dbStatus'),
  };

  // ── Load Stats ──
  async function loadStats() {
    try {
      const data = await Admin.request(Admin.API_BASE + '/admin/stats');

      if (data.success && data.stats) {
        const s = data.stats;
        if (DOM.totalProjects) DOM.totalProjects.textContent = s.totalProjects || 0;
        if (DOM.totalBlogs) DOM.totalBlogs.textContent = s.totalBlogs || 0;
        if (DOM.totalMessages) DOM.totalMessages.textContent = s.totalMessages || 0;
        if (DOM.totalViews) DOM.totalViews.textContent = Admin.formatNumber(s.totalViews || 1247);

        const unread = s.unreadMessages || 0;
        if (unread > 0) {
          if (DOM.messageBadge) { DOM.messageBadge.textContent = unread; DOM.messageBadge.style.display = 'inline-block'; }
          if (DOM.unreadBadge) { DOM.unreadBadge.textContent = unread + ' unread'; DOM.unreadBadge.style.display = 'inline-block'; }
          if (DOM.qaMessageDesc) DOM.qaMessageDesc.textContent = unread + ' unread';
        }

        setStatus(DOM.apiDot, DOM.apiStatus, true, 'Online');
        setStatus(DOM.dbDot, DOM.dbStatus, true, 'Connected');
      }
    } catch (err) {
      setStatus(DOM.apiDot, DOM.apiStatus, false, 'Offline');
      setStatus(DOM.dbDot, DOM.dbStatus, false, 'Disconnected');
    }
  }

  function setStatus(dot, text, online, label) {
    if (dot) dot.className = 'status-dot ' + (online ? 'online' : 'offline');
    if (text) text.textContent = label;
  }

  // ── Load Activity ──
  async function loadActivity() {
    try {
      const data = await Admin.request(Admin.API_BASE + '/admin/activity');

      if (data.success && data.activity) {
        var items = [];

        (data.activity.projects || []).forEach(function (p) {
          items.push({
            type: 'project',
            title: 'Project: ' + p.title,
            time: new Date(p.updatedAt).toLocaleString()
          });
        });

        (data.activity.blogs || []).forEach(function (b) {
          items.push({
            type: 'blog',
            title: 'Blog: ' + b.title,
            time: new Date(b.updatedAt).toLocaleString()
          });
        });

        items.sort(function (a, b) { return new Date(b.time) - new Date(a.time); });
        items = items.slice(0, 8);

        if (DOM.activityCount) DOM.activityCount.textContent = items.length;

        if (items.length === 0) {
          if (DOM.activityList) DOM.activityList.innerHTML = '<div class="activity-empty">No recent activity</div>';
          return;
        }

        if (DOM.activityList) {
          DOM.activityList.innerHTML = items.map(function (a) {
            return '<div class="activity-item">' +
              '<div class="activity-dot ' + a.type + '"></div>' +
              '<div class="activity-content">' +
              '<div class="activity-title">' + Admin.escapeHTML(a.title) + '</div>' +
              '<div class="activity-time">' + a.time + '</div>' +
              '</div></div>';
          }).join('');
        }
      }
    } catch (err) {
      if (DOM.activityList) DOM.activityList.innerHTML = '<div class="activity-empty">Unable to load activity</div>';
    }
  }

  // ── Real-time Updates ──
  window.onNewMessage = function () {
    loadStats();
    loadActivity();
  };

  // ── Init ──
  loadStats();
  loadActivity();

  setInterval(function () {
    loadStats();
    loadActivity();
  }, 30000);

})();

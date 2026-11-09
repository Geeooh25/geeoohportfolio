/**
 * GLOBAL THEME & ACCENT MANAGER
 */
(function () {
  'use strict';

  const API_BASE = 'http://localhost:5000/api/v1';
  const ACCENT_KEY = 'portfolio_accent';

  // 1. Apply saved theme & accent INSTANTLY (Prevents flash)
  const savedTheme = localStorage.getItem('portfolio_theme') || 'dark';
  const savedAccent = localStorage.getItem(ACCENT_KEY) || 'orange';

  // Theme
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.body.classList.add('dark-theme');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.add('light-theme');
  }

  // Accent
  document.body.classList.remove('accent-orange', 'accent-blue', 'accent-emerald', 'accent-purple', 'accent-rose');
  if (savedAccent !== 'orange') {
    document.body.classList.add(`accent-${savedAccent}`);
  }

  // 2. Fetch Global Accent from Database (Sync across devices)
  async function syncGlobalAccent() {
    try {
      const res = await fetch(`${API_BASE}/settings`);
      const data = await res.json();
      
      if (data.success && data.settings.accentColor) {
        const color = data.settings.accentColor;
        
        // Only apply if it's different from what we have
        if (localStorage.getItem(ACCENT_KEY) !== color) {
          localStorage.setItem(ACCENT_KEY, color); // Save locally for next page
          
          document.body.classList.remove('accent-orange', 'accent-blue', 'accent-emerald', 'accent-purple', 'accent-rose');
          if (color !== 'orange') {
            document.body.classList.add(`accent-${color}`);
          }
        }
      }
    } catch (err) {
      console.error('Failed to sync accent color', err);
    }
  }

  syncGlobalAccent();

  // 3. Handle Light/Dark Toggle
  function initToggles() {
    document.querySelectorAll('#themeToggle, #themeToggleDesk, #themeToggleMobile, .theme-toggle, .theme-toggle-admin').forEach(btn => {
      btn.addEventListener('click', () => {
        const current = localStorage.getItem('portfolio_theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        
        if (next === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.body.classList.add('dark-theme');
          document.body.classList.remove('light-theme');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
          document.body.classList.add('light-theme');
          document.body.classList.remove('dark-theme');
        }
        localStorage.setItem('portfolio_theme', next);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggles);
  } else {
    initToggles();
  }
})();
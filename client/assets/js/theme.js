// ===== THEME MANAGER =====
class ThemeManager {
  constructor() {
    this.body = document.body;
    this.themeToggle = document.getElementById('themeToggle');
    this.currentTheme = 'light';
    
    this.init();
  }

  init() {
    // Load saved theme
    const savedTheme = localStorage.getItem('portfolio_theme');
    
    if (savedTheme) {
      this.setTheme(savedTheme, false);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light', false);
    }

    // Add click handler
    if (this.themeToggle) {
      this.themeToggle.addEventListener('click', (e) => {
        this.toggleTheme(e);
      });
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('portfolio_theme')) {
        this.setTheme(e.matches ? 'dark' : 'light', true);
      }
    });

    // Add keyboard shortcut (Ctrl/Cmd + T)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        this.toggleTheme();
      }
    });
  }

  setTheme(theme, animate = true) {
    this.currentTheme = theme;
    
    if (animate) {
      this.createTransitionOverlay();
    }

    if (theme === 'dark') {
      this.body.classList.add('dark-theme');
      this.body.classList.remove('light-theme');
    } else {
      this.body.classList.remove('dark-theme');
      this.body.classList.add('light-theme');
    }

    // Update theme toggle icon
    this.updateToggleIcon();

    // Save preference
    localStorage.setItem('portfolio_theme', theme);

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
  }

  toggleTheme(event) {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme, true);

    // Update transition overlay position
    if (event) {
      const overlay = document.querySelector('.theme-transition-overlay');
      if (overlay) {
        overlay.style.setProperty('--x', `${event.clientX}px`);
        overlay.style.setProperty('--y', `${event.clientY}px`);
      }
    }
  }

  createTransitionOverlay() {
    // Remove existing overlay
    const existing = document.querySelector('.theme-transition-overlay');
    if (existing) existing.remove();

    // Create new overlay
    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';
    document.body.appendChild(overlay);

    // Remove after animation
    setTimeout(() => {
      overlay.remove();
    }, 500);
  }

  updateToggleIcon() {
    if (!this.themeToggle) return;

    const sunIcon = this.themeToggle.querySelector('.sun-icon');
    const moonIcon = this.themeToggle.querySelector('.moon-icon');

    if (this.currentTheme === 'dark') {
      this.themeToggle.setAttribute('aria-label', 'Switch to light mode');
      this.themeToggle.style.transform = 'rotate(180deg)';
    } else {
      this.themeToggle.setAttribute('aria-label', 'Switch to dark mode');
      this.themeToggle.style.transform = 'rotate(0deg)';
    }
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Initialize theme manager
const themeManager = new ThemeManager();
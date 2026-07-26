/* ===========================================
   BLOG.JS — Blog Listing Engine
   Fetches from API, renders with filters
   =========================================== */
(function () {
  'use strict';

  const API_BASE = 'http://localhost:5000/api/v1/public/blogs';
  const POSTS_PER_PAGE = 6;

  let state = {
    posts: [],
    filteredPosts: [],
    currentPage: 1,
    activeCategory: 'all',
    searchQuery: '',
    isLoading: true,
  };

  // ── DOM Refs ──
  const DOM = {
    blogContent: document.getElementById('blogContent'),
    featuredPost: document.getElementById('featuredPost'),
    blogGrid: document.getElementById('blogGrid'),
    blogEmpty: document.getElementById('blogEmpty'),
    loadMoreContainer: document.getElementById('loadMoreContainer'),
    loadMoreBtn: document.getElementById('loadMoreBtn'),
    blogSearch: document.getElementById('blogSearch'),
    blogFilters: document.getElementById('blogFilters'),
    newsletterForm: document.getElementById('newsletterForm'),
  };

  // ── Init ──
  function init() {
    if (!DOM.blogContent) return;
    fetchPosts();
    bindEvents();
  }

  // ── Fetch ──
  async function fetchPosts() {
    showSkeleton();
    try {
      const res = await fetch(`${API_BASE}?limit=50`);
      const data = await res.json();
      if (data.success && data.blogs) {
        state.posts = data.blogs.map(normalizePost);
        state.filteredPosts = [...state.posts];
        state.isLoading = false;
        render();
      } else {
        showError('No articles found.');
      }
    } catch (err) {
      console.error('Blog fetch error:', err);
      showError('Failed to load articles. Make sure the server is running.');
    }
  }

  // ── Normalize API post → consistent shape ──
  function normalizePost(b) {
    return {
      id: b._id,
      slug: b.slug,
      title: b.title || 'Untitled',
      subtitle: b.subtitle || '',
      excerpt: b.excerpt || '',
      content: b.content || '',
      category: b.category || 'General',
      tags: b.tags || [],
      featured: b.featured || false,
      readTime: b.readTime || 5,
      views: b.views || 0,
      date: b.publishedAt || b.createdAt || new Date().toISOString(),
      image: getHeroImage(b),
      author: b.author || { name: 'Ganiyu Usman' },
    };
  }

  function getHeroImage(b) {
    if (b.media && b.media.length) {
      const hero = b.media.find(m => m.isHero && m.type === 'image') ||
                   b.media.find(m => m.type === 'image');
      if (hero && hero.url) return hero.url;
    }
    if (b.coverImage && b.coverImage.url) return b.coverImage.url;
    return '';
  }

  // ── Skeleton ──
  function showSkeleton() {
    DOM.blogContent.innerHTML = `
      <section class="blog-hero">
        <div class="blog-hero-content">
          <div class="skeleton-line short" style="margin:0 auto 20px;"></div>
          <div class="skeleton-line long" style="height:40px;margin:0 auto 20px;"></div>
          <div class="skeleton-line medium" style="margin:0 auto;"></div>
        </div>
      </section>
      <div class="blog-skeleton-grid">
        ${Array(6).fill(`
          <div class="blog-skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-body">
              <div class="skeleton-line short"></div>
              <div class="skeleton-line long"></div>
              <div class="skeleton-line medium"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ── Error ──
  function showError(msg) {
    state.isLoading = false;
    DOM.blogContent.innerHTML = `
      <div class="blog-status">
        <span class="material-symbols-outlined blog-status-icon">error_outline</span>
        <h3>Something went wrong</h3>
        <p>${escapeHTML(msg)}</p>
        <button class="btn btn-primary" onclick="location.reload()" style="margin-top:1.5rem;">
          <span class="material-symbols-outlined">refresh</span>
          Try Again
        </button>
      </div>
    `;
  }

  // ── Render ──
  function render() {
    const featured = state.filteredPosts.find(p => p.featured) || state.filteredPosts[0];
    const remaining = state.filteredPosts.filter(p => p.id !== (featured ? featured.id : null));
    const displayed = remaining.slice(0, state.currentPage * POSTS_PER_PAGE);

    let html = '';

    // Hero
    html += `
      <section class="blog-hero">
        <div class="blog-hero-content">
          <span class="blog-eyebrow">The Journal</span>
          <h1 class="blog-hero-title">Thoughts, code & <span class="text-accent">occasional</span> rants.</h1>
          <p class="blog-hero-subtitle">Deep dives into full-stack development, real-time systems, and building premium digital experiences.</p>
          <div class="blog-controls">
            <div class="blog-search">
              <span class="material-symbols-outlined search-icon">search</span>
              <input type="text" id="blogSearch" placeholder="Search articles..." class="blog-search-input" value="${escapeHTML(state.searchQuery)}" />
            </div>
            <div class="blog-filters" id="blogFilters">
              ${['all', ...new Set(state.posts.map(p => p.category))].map(cat => `
                <button class="filter-pill${state.activeCategory === cat ? ' active' : ''}" data-category="${cat}">${cat === 'all' ? 'All' : cat}</button>
              `).join('')}
            </div>
          </div>
        </div>
      </section>
    `;

    // Featured
    if (featured) {
      html += `
        <section class="blog-featured">
          <a href="./blog-detail.html?slug=${featured.slug}" class="featured-card">
            <div class="featured-image">
              ${featured.image ? `<img src="${featured.image}" alt="${escapeHTML(featured.title)}" loading="eager" />` : ''}
              <div class="featured-badge">
                <span class="material-symbols-outlined" style="font-size:16px;">push_pin</span>
                Featured
              </div>
            </div>
            <div class="featured-body">
              <span class="featured-category">${escapeHTML(featured.category)}</span>
              <h2 class="featured-title">${escapeHTML(featured.title)}</h2>
              <p class="featured-excerpt">${escapeHTML(featured.excerpt)}</p>
              <div class="featured-meta">
                <span>${formatDate(featured.date)}</span>
                <span>·</span>
                <span>${featured.readTime} min read</span>
                <span>·</span>
                <span>${featured.views} views</span>
              </div>
              <span class="featured-read">Read Article <span class="material-symbols-outlined" style="font-size:18px;">arrow_forward</span></span>
            </div>
          </a>
        </section>
      `;
    }

    // Grid
    html += `
      <section class="blog-grid-section">
        <div class="blog-grid">${displayed.map(p => blogCard(p)).join('')}</div>
        <div class="blog-empty" style="${displayed.length === 0 ? '' : 'display:none;'}">
          <span class="material-symbols-outlined blog-status-icon">search_off</span>
          <h3>No posts found</h3>
          <p>Try adjusting your search or filter.</p>
        </div>
        <div class="blog-load-more" style="${remaining.length > state.currentPage * POSTS_PER_PAGE ? '' : 'display:none;'}">
          <button class="btn-load-more" id="loadMoreBtn">Load More Articles <span class="material-symbols-outlined">expand_more</span></button>
        </div>
      </section>
    `;

    // Newsletter
    html += `
      <section class="blog-newsletter">
        <div class="newsletter-card">
          <div class="newsletter-content">
            <span class="material-symbols-outlined newsletter-icon">mail</span>
            <h2 class="newsletter-title">Stay in the loop</h2>
            <p class="newsletter-text">New articles every couple of weeks. No spam — I hate that too.</p>
            <form class="newsletter-form" id="newsletterForm">
              <input type="email" placeholder="you@email.com" class="newsletter-input" required />
              <button type="submit" class="newsletter-btn">Subscribe <span class="material-symbols-outlined">arrow_forward</span></button>
            </form>
          </div>
          <div class="newsletter-decoration">
            <div class="decoration-circle"></div>
            <div class="decoration-circle small"></div>
            <div class="decoration-dots"></div>
          </div>
        </div>
      </section>
    `;

    DOM.blogContent.innerHTML = html;
    refreshDOMRefs();
    bindEvents();
    animateCardsIn();
  }

  function blogCard(p) {
    return `
      <a href="./blog-detail.html?slug=${p.slug}" class="blog-card">
        <div class="blog-card-image">
          ${p.image ? `<img src="${p.image}" alt="${escapeHTML(p.title)}" loading="lazy" />` : ''}
          <span class="blog-card-category">${escapeHTML(p.category)}</span>
        </div>
        <div class="blog-card-body">
          <h3 class="blog-card-title">${escapeHTML(p.title)}</h3>
          <p class="blog-card-excerpt">${escapeHTML(p.excerpt)}</p>
          <div class="blog-card-meta">
            <span>${formatDate(p.date)}</span>
            <span>${p.readTime} min read</span>
          </div>
        </div>
      </a>
    `;
  }

  // ── Refresh DOM refs after render ──
  function refreshDOMRefs() {
    DOM.blogSearch = document.getElementById('blogSearch');
    DOM.blogFilters = document.getElementById('blogFilters');
    DOM.loadMoreBtn = document.getElementById('loadMoreBtn');
    DOM.loadMoreContainer = document.querySelector('.blog-load-more');
    DOM.blogEmpty = document.querySelector('.blog-empty');
    DOM.newsletterForm = document.getElementById('newsletterForm');
  }

  // ── Filter ──
  function filterPosts() {
    state.currentPage = 1;
    state.filteredPosts = state.posts.filter(p => {
      const matchCat = state.activeCategory === 'all' || p.category === state.activeCategory;
      const q = state.searchQuery.toLowerCase();
      const matchSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
    render();
  }

  // ── Events ──
  function bindEvents() {
    // Search
    if (DOM.blogSearch) {
      DOM.blogSearch.addEventListener('input', debounce(function () {
        state.searchQuery = this.value.trim();
        filterPosts();
      }, 300));
    }

    // Filter pills
    if (DOM.blogFilters) {
      DOM.blogFilters.addEventListener('click', function (e) {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
        state.activeCategory = pill.dataset.category;
        filterPosts();
      });
    }

    // Load more
    if (DOM.loadMoreBtn) {
      DOM.loadMoreBtn.addEventListener('click', function () {
        state.currentPage++;
        render();
      });
    }

    // Newsletter
    if (DOM.newsletterForm) {
      DOM.newsletterForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const input = this.querySelector('.newsletter-input');
        const btn = this.querySelector('.newsletter-btn');
        if (input && isValidEmail(input.value)) {
          const orig = btn.innerHTML;
          btn.innerHTML = 'Subscribed! ✓';
          btn.disabled = true;
          setTimeout(() => { btn.innerHTML = orig; btn.disabled = false; input.value = ''; }, 2500);
        }
      });
    }
  }

  // ── Card animation ──
  function animateCardsIn() {
    if (!('IntersectionObserver' in window)) return;
    const cards = document.querySelectorAll('.blog-card, .featured-card');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    cards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.05}s`;
      obs.observe(card);
    });
  }

  // ── Utilities ──
  function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); }
  function escapeHTML(s) { const div = document.createElement('div'); div.textContent = s || ''; return div.innerHTML; }
  function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }
  function debounce(fn, ms) { let t; return function (...args) { clearTimeout(t); t = setTimeout(() => fn.apply(this, args), ms); }; }

  // ── Start ──
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
/* ===========================================
   BLOG-DETAIL.JS — Single Post Engine
   TOC, reading progress, likes, share
   =========================================== */
(function () {
  'use strict';

  const API_BASE = 'http://localhost:5000/api/v1/public/blogs';
  const slug = new URLSearchParams(window.location.search).get('slug');

  const DOM = {
    postLoading: document.getElementById('postLoading'),
    postArticle: document.getElementById('postArticle'),
    postError: document.getElementById('postError'),
    postErrorMessage: document.getElementById('postErrorMessage'),
    postTitle: document.getElementById('postTitle'),
    postCategory: document.getElementById('postCategory'),
    postDate: document.getElementById('postDate'),
    postReadTime: document.getElementById('postReadTime'),
    postAuthorName: document.getElementById('postAuthorName'),
    postAuthorAvatar: document.getElementById('postAuthorAvatar'),
    postHeroImg: document.getElementById('postHeroImg'),
    postHeroImage: document.getElementById('postHeroImage'),
    postContent: document.getElementById('postContent'),
    postTags: document.getElementById('postTags'),
    authorCardBio: document.getElementById('authorCardBio'),
    tocNav: document.getElementById('tocNav'),
    readingProgressBar: document.getElementById('readingProgressBar'),
    tocProgressFill: document.getElementById('tocProgressFill'),
    tocProgressText: document.getElementById('tocProgressText'),
    likeBtn: document.getElementById('likeBtn'),
    likeCount: document.getElementById('likeCount'),
    shareBtn: document.getElementById('shareBtn'),
    bookmarkBtn: document.getElementById('bookmarkBtn'),
    relatedGrid: document.getElementById('relatedGrid'),
    relatedPosts: document.getElementById('relatedPosts'),
  };

  function init() {
    if (!slug) {
      showError('No article specified.');
      return;
    }
    fetchPost();
    bindEvents();
  }

  async function fetchPost() {
    try {
      const res = await fetch(`${API_BASE}/${slug}`);
      const data = await res.json();
      if (!data.success || !data.blog) throw new Error('Post not found');
      renderPost(data.blog);
      if (data.relatedPosts) renderRelated(data.relatedPosts);
    } catch (err) {
      console.error('Post fetch error:', err);
      showError('The article you\'re looking for doesn\'t exist or has been moved.');
    }
  }

  function getHeroImage(b) {
    if (b.media && b.media.length) {
      const hero = b.media.find(m => m.isHero && m.type === 'image') || b.media.find(m => m.type === 'image');
      if (hero && hero.url) return hero.url;
    }
    if (b.coverImage && b.coverImage.url) return b.coverImage.url;
    return '';
  }

  function renderPost(b) {
    document.title = `${b.title} · Ganiyu Usman`;
    const heroImg = getHeroImage(b);

    // Header
    DOM.postCategory.textContent = b.category || 'General';
    DOM.postTitle.textContent = b.title;
    DOM.postDate.textContent = formatDate(b.publishedAt || b.createdAt);
    DOM.postReadTime.textContent = `${b.readTime || 5} min read`;
    DOM.postAuthorName.textContent = b.author?.name || 'Ganiyu Usman';
    DOM.authorCardBio.textContent = b.author?.bio || 'Full-stack developer obsessed with performance, real-time systems, and digital experiences that feel alive.';

    // Hero image
    if (heroImg) {
      DOM.postHeroImg.src = heroImg;
      DOM.postHeroImg.alt = b.title;
      DOM.postHeroImage.style.display = '';
    } else {
      DOM.postHeroImage.style.display = 'none';
    }

    // Content
    DOM.postContent.innerHTML = b.content || '<p>No content available.</p>';

    // Generate TOC from h2/h3
    generateTOC();

    // Tags
    if (b.tags && b.tags.length) {
      DOM.postTags.innerHTML = b.tags.map(t => `<span class="post-tag">#${t}</span>`).join('');
    }

    // Likes from localStorage
    updateLikeState();

    // Show article
    DOM.postLoading.style.display = 'none';
    DOM.postArticle.style.display = '';
  }

  function generateTOC() {
    const headings = DOM.postContent.querySelectorAll('h2, h3');
    if (headings.length < 2) {
      document.querySelector('.post-toc-sidebar').style.display = 'none';
      return;
    }

    let html = '';
    headings.forEach((h, i) => {
      const id = `section-${i}`;
      h.id = id;
      const cls = h.tagName === 'H2' ? 'toc-h2' : 'toc-h3';
      html += `<a href="#${id}" class="toc-link ${cls}" data-target="${id}">${h.textContent}</a>`;
    });
    DOM.tocNav.innerHTML = html;

    // Click handler
    DOM.tocNav.querySelectorAll('.toc-link').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.getElementById(this.dataset.target);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function renderRelated(posts) {
    if (!posts.length) return;
    DOM.relatedPosts.style.display = '';
    DOM.relatedGrid.innerHTML = posts.map(rp => {
      const img = getHeroImage(rp);
      return `
        <a href="./blog-detail.html?slug=${rp.slug}" class="related-card">
          ${img ? `<img src="${img}" alt="${escapeHTML(rp.title)}" loading="lazy" />` : ''}
          <div class="related-card-body">
            <h5>${escapeHTML(rp.title)}</h5>
            <span>${rp.readTime || 5} min read</span>
          </div>
        </a>
      `;
    }).join('');
  }

  function showError(msg) {
    DOM.postLoading.style.display = 'none';
    DOM.postArticle.style.display = 'none';
    DOM.postError.style.display = '';
    DOM.postErrorMessage.textContent = msg;
  }

  // ── Reading Progress ──
  function updateReadingProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;

    if (DOM.readingProgressBar) DOM.readingProgressBar.style.width = progress + '%';
    if (DOM.tocProgressFill) DOM.tocProgressFill.style.width = progress + '%';
    if (DOM.tocProgressText) DOM.tocProgressText.textContent = Math.round(progress) + '%';

    // Highlight active TOC link
    const headings = DOM.postContent.querySelectorAll('h2, h3');
    let current = '';
    headings.forEach(h => {
      if (h.getBoundingClientRect().top <= 120) current = h.id;
    });
    DOM.tocNav.querySelectorAll('.toc-link').forEach(link => {
      link.classList.toggle('active', link.dataset.target === current);
    });
  }

  // ── Likes ──
  function updateLikeState() {
    const liked = localStorage.getItem(`liked_${slug}`) === 'true';
    const count = parseInt(localStorage.getItem(`likes_${slug}`) || '0', 10);
    DOM.likeCount.textContent = count;
    if (liked) DOM.likeBtn.classList.add('liked');
  }

  function toggleLike() {
    const liked = DOM.likeBtn.classList.toggle('liked');
    let count = parseInt(DOM.likeCount.textContent || '0', 10);
    count = liked ? count + 1 : Math.max(0, count - 1);
    DOM.likeCount.textContent = count;
    localStorage.setItem(`liked_${slug}`, liked);
    localStorage.setItem(`likes_${slug}`, count);
  }

  // ── Share ──
  function sharePost() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url });
    } else {
      navigator.clipboard.writeText(url).then(() => showToast('Link copied!'));
    }
  }

  // ── Bookmark ──
  function toggleBookmark() {
    DOM.bookmarkBtn.classList.toggle('bookmarked');
    const isBookmarked = DOM.bookmarkBtn.classList.contains('bookmarked');
    let bookmarks = JSON.parse(localStorage.getItem('blog_bookmarks') || '[]');
    if (isBookmarked) {
      if (!bookmarks.includes(slug)) bookmarks.push(slug);
      showToast('Article bookmarked!');
    } else {
      bookmarks = bookmarks.filter(s => s !== slug);
      showToast('Bookmark removed');
    }
    localStorage.setItem('blog_bookmarks', JSON.stringify(bookmarks));
  }

  // ── Share buttons in sidebar ──
  function handleSidebarShare(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    let shareUrl = '';
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
    else if (platform === 'linkedin') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    else if (platform === 'copy') { navigator.clipboard.writeText(window.location.href).then(() => showToast('Link copied!')); return; }
    if (shareUrl) window.open(shareUrl, '_blank', 'width=600,height=400');
  }

  // ── Toast ──
  function showToast(msg) {
    const container = document.getElementById('blogToastContainer');
    const toast = document.createElement('div');
    toast.className = 'blog-toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ── Events ──
  function bindEvents() {
    window.addEventListener('scroll', updateReadingProgress, { passive: true });
    if (DOM.likeBtn) DOM.likeBtn.addEventListener('click', toggleLike);
    if (DOM.shareBtn) DOM.shareBtn.addEventListener('click', sharePost);
    if (DOM.bookmarkBtn) DOM.bookmarkBtn.addEventListener('click', toggleBookmark);

    document.querySelectorAll('.toc-share-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        handleSidebarShare(this.dataset.platform);
      });
    });

    // Restore bookmark state
    const bookmarks = JSON.parse(localStorage.getItem('blog_bookmarks') || '[]');
    if (bookmarks.includes(slug) && DOM.bookmarkBtn) {
      DOM.bookmarkBtn.classList.add('bookmarked');
    }
  }

  // ── Utilities ──
  function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
  function escapeHTML(s) { const div = document.createElement('div'); div.textContent = s || ''; return div.innerHTML; }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
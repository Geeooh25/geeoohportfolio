// ===== PROJECT DETAIL — CINEMATIC CASE STUDY v3.0 =====
// Architecture: Component-based, XSS-safe, IntersectionObserver-driven

(function() {
  'use strict';

  // ===== UTILITIES =====
  function escapeHTML(str) {
    if (!str && str !== 0) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  function safeHTML(str) {
    return escapeHTML(str);
  }

  function calculateReadingTime(project) {
    let words = 0;
    const fields = ['longDescription', 'personalNote'];
    fields.forEach(f => { if (project[f]) words += project[f].split(/\s+/).length; });
    if (project.challenges) {
      project.challenges.forEach(c => {
        if (c.problem) words += c.problem.split(/\s+/).length;
        if (c.solution) words += c.solution.split(/\s+/).length;
      });
    }
    if (project.results && project.results.summary) words += project.results.summary.split(/\s+/).length;
    if (project.clientFeedback && project.clientFeedback.quote) words += project.clientFeedback.quote.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  function getImageSrcset(img) {
    if (!img) return '';
    const url = img.url;
    if (!url) return '';
    return `${url}?w=400 400w, ${url}?w=800 800w, ${url}?w=1200 1200w`;
  }

  // ===== STATE =====
  let currentLightboxImages = [];
  let currentLightboxIndex = 0;
  let revealObserver = null;

  // ===== THEME & NAVIGATION =====
  const st = localStorage.getItem('portfolio_theme');
  if (st === 'dark') document.body.classList.add('dark-theme');

  document.getElementById('themeToggle').addEventListener('click', function() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('portfolio_theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  });

  const hb = document.getElementById('hamburgerBtn'),
    nb = document.getElementById('navbar'),
    ol = document.getElementById('overlay');
  if (hb) { hb.addEventListener('click', function() { hb.classList.toggle('active'); nb.classList.toggle('open'); ol.classList.toggle('active'); }); }
  if (ol) { ol.addEventListener('click', function() { hb.classList.remove('active'); nb.classList.remove('open'); ol.classList.remove('active'); }); }

  window.addEventListener('scroll', function() {
    const bar = document.getElementById('scrollProgress');
    if (bar) bar.style.width = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100 + '%';
    const pdBar = document.getElementById('pdProgress');
    if (pdBar) pdBar.style.width = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100 + '%';
    const btt = document.getElementById('backToTop');
    if (btt) btt.classList.toggle('visible', window.scrollY > 500);
    updateTocHighlight();
  });

  document.getElementById('backToTop').addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  function updateTocHighlight() {
    const links = document.querySelectorAll('.pd-toc-link');
    const scrollPos = window.scrollY + 120;
    links.forEach(function(link) {
      const section = document.querySelector(link.getAttribute('href'));
      if (section) {
        const top = section.offsetTop;
        const bottom = top + section.offsetHeight;
        link.classList.toggle('active', scrollPos >= top && scrollPos < bottom);
      }
    });
  }

  document.querySelectorAll('.pd-toc-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) window.scrollTo({ top: target.offsetTop - 120, behavior: 'smooth' });
    });
  });

  // Mobile TOC toggle
  const tocNav = document.getElementById('pdToc');
  if (tocNav && window.innerWidth < 768) {
    const tocToggle = document.createElement('button');
    tocToggle.className = 'pd-toc-mobile-toggle';
    tocToggle.setAttribute('aria-label', 'Sections');
    tocToggle.setAttribute('aria-expanded', 'false');
    tocToggle.innerHTML = '☰ Sections';
    tocToggle.addEventListener('click', function() {
      const links = tocNav.querySelector('.pd-toc-inner');
      const isOpen = links.classList.toggle('open');
      tocToggle.setAttribute('aria-expanded', isOpen);
    });
    tocNav.insertBefore(tocToggle, tocNav.firstChild);
  }

  // ===== INTERSECTION OBSERVER (replaces getBoundingClientRect) =====
  function initRevealObserver() {
    if (revealObserver) revealObserver.disconnect();
    revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.pd-reveal, .pd-stat-item').forEach(function(el) {
      revealObserver.observe(el);
    });
  }

  // ===== SKELETON LOADING =====
  function showSkeleton() {
    return `
      <div class="pd-skeleton-hero">
        <div class="pd-skeleton-line pd-skeleton-title"></div>
        <div class="pd-skeleton-line pd-skeleton-subtitle"></div>
        <div class="pd-skeleton-line pd-skeleton-btn"></div>
      </div>
      <div class="pd-skeleton-stats">
        ${Array(4).fill('<div class="pd-skeleton-stat"></div>').join('')}
      </div>
      <div class="pd-skeleton-content">
        ${Array(3).fill('<div class="pd-skeleton-block"><div class="pd-skeleton-line w-30"></div><div class="pd-skeleton-line w-100"></div><div class="pd-skeleton-line w-80"></div></div>').join('')}
      </div>
    `;
  }

  // ===== ERROR STATES =====
  function renderError(title, message, showRetry) {
    return `
      <section class="pd-error">
        <div class="pd-error-inner">
          <div class="pd-error-icon">${title === '404' ? '🔍' : '📡'}</div>
          <h2 class="pd-error-title">${safeHTML(title)}</h2>
          <p class="pd-error-message">${safeHTML(message)}</p>
          <div class="pd-error-actions">
            <a href="./index.html#projects" class="pd-btn pd-btn-primary">← Back to Projects</a>
            ${showRetry ? '<button class="pd-btn pd-btn-outline" onclick="location.reload()">🔄 Try Again</button>' : ''}
          </div>
        </div>
      </section>
    `;
  }

  // ===== COMPONENTS =====

  function renderHero(p) {
    const heroImg = p.images && p.images.length > 0 ? (p.images.find(i => i.isHero) || p.images[0]) : null;
    const heroUrl = heroImg ? heroImg.url : '';
    const readingTime = calculateReadingTime(p);

    return `
      <section class="pd-hero" aria-labelledby="pd-hero-title">
        <div class="pd-hero-ambient">
          <div class="pd-hero-glow orange"></div>
          <div class="pd-hero-glow purple"></div>
          <div class="pd-hero-grid"></div>
        </div>
        <div class="pd-hero-inner">
          <div class="pd-hero-text">
            <a href="./index.html#projects" class="pd-back">← Back to Projects</a>
            <div class="pd-category-badge">${safeHTML(p.category || 'Project')}</div>
            <div class="pd-tldr">
              <div class="pd-tldr-item"><span class="pd-tldr-icon">📅</span> ${safeHTML(p.timeline && p.timeline.duration ? p.timeline.duration : 'Recent')}</div>
              <div class="pd-tldr-item"><span class="pd-tldr-icon">⭐</span> ${safeHTML(p.stats && p.stats.stars ? p.stats.stars + ' stars' : 'Featured')}</div>
              <div class="pd-tldr-item"><span class="pd-tldr-icon">🟢</span> ${safeHTML(p.timeline && p.timeline.status ? p.timeline.status : 'Completed')}</div>
              <div class="pd-tldr-item"><span class="pd-tldr-icon">📖</span> ${readingTime} min read</div>
            </div>
            <h1 class="pd-title" id="pd-hero-title">${safeHTML(p.title)}</h1>
            <p class="pd-subtitle">${safeHTML(p.description || '')}</p>
            ${p.personalNote ? `<p class="pd-personal-note">"${safeHTML(p.personalNote)}"</p>` : ''}
            <div class="pd-hero-actions">
              ${p.links && p.links.live ? `<a href="${safeHTML(p.links.live)}" target="_blank" rel="noopener" class="pd-btn pd-btn-primary">🚀 Live Demo</a>` : ''}
              ${p.links && p.links.github ? `<a href="${safeHTML(p.links.github)}" target="_blank" rel="noopener" class="pd-btn pd-btn-outline">📂 Source Code</a>` : ''}
            </div>
          </div>
          ${heroUrl ? `
          <div class="pd-hero-image-wrap">
            <div class="pd-hero-image-glow"></div>
            <img src="${safeHTML(heroUrl)}" alt="${safeHTML(p.title)}" class="pd-hero-image" loading="eager" decoding="async" />
          </div>` : ''}
        </div>
      </section>
    `;
  }

  function renderStats(p) {
    return `
      <section class="pd-stats-strip" aria-label="Project statistics">
        <div class="pd-stats-grid">
          <div class="pd-stat-item"><div class="pd-stat-number">${safeHTML(p.stats && p.stats.stars ? p.stats.stars : '—')}</div><div class="pd-stat-label">⭐ Stars</div></div>
          <div class="pd-stat-item"><div class="pd-stat-number">${safeHTML(p.stats && p.stats.forks ? p.stats.forks : '—')}</div><div class="pd-stat-label">⑂ Forks</div></div>
          <div class="pd-stat-item"><div class="pd-stat-number">${safeHTML(p.stats && p.stats.views ? p.stats.views : '—')}</div><div class="pd-stat-label">👁️ Views</div></div>
          ${p.timeline && p.timeline.duration ? `<div class="pd-stat-item"><div class="pd-stat-number">${safeHTML(p.timeline.duration)}</div><div class="pd-stat-label">⏱️ Timeline</div></div>` : ''}
        </div>
      </section>
    `;
  }

  function renderOverview(p) {
    if (!p.longDescription && !p.personalNote) return '';
    return `
      <section class="pd-section" id="overview" aria-labelledby="overview-title">
        <div class="pd-section-inner">
          <div class="pd-reveal"><span class="pd-section-label">Overview</span></div>
          <div class="pd-reveal pd-reveal-delay-1"><h2 class="pd-section-title" id="overview-title">The Story</h2></div>
          ${p.longDescription ? `<div class="pd-reveal pd-reveal-delay-2"><p class="pd-section-text">${safeHTML(p.longDescription)}</p></div>` : ''}
          ${p.personalNote ? `
          <div class="pd-voice-block pd-reveal pd-reveal-delay-3">
            <div class="pd-voice-label">My Perspective</div>
            <p class="pd-voice-text">"${safeHTML(p.personalNote)}"</p>
          </div>` : ''}
        </div>
      </section>
    `;
  }

  function renderTimeline(p) {
    if (!p.timelineSteps || p.timelineSteps.length === 0) return '';
    return `
      <section class="pd-section pd-section-alt" aria-labelledby="timeline-title">
        <div class="pd-section-inner">
          <div class="pd-reveal"><span class="pd-section-label">Process</span></div>
          <div class="pd-reveal pd-reveal-delay-1"><h2 class="pd-section-title" id="timeline-title">How It Came Together</h2></div>
          <div class="pd-timeline">
            <div class="pd-timeline-line" aria-hidden="true"></div>
            ${p.timelineSteps.map((step, i) => `
              <div class="pd-timeline-step pd-reveal pd-reveal-delay-${i + 2}">
                <div class="pd-timeline-dot" aria-hidden="true"></div>
                <div class="pd-timeline-content">
                  <div class="pd-timeline-phase">${safeHTML(step.phase)}</div>
                  ${step.duration ? `<div class="pd-timeline-duration">${safeHTML(step.duration)}</div>` : ''}
                  <p class="pd-timeline-desc">${safeHTML(step.description)}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderTechStack(p) {
    if (!p.technologies || p.technologies.length === 0) return '';
    return `
      <section class="pd-section pd-section-alt" id="tech" aria-labelledby="tech-title">
        <div class="pd-section-inner">
          <div class="pd-reveal"><span class="pd-section-label">Technology</span></div>
          <div class="pd-reveal pd-reveal-delay-1"><h2 class="pd-section-title" id="tech-title">Built With</h2></div>
          <div class="pd-reveal pd-reveal-delay-2"><div class="pd-tech-grid">
            ${p.technologies.map(t => `<span class="pd-tech-tag">${safeHTML(t)}</span>`).join('')}
          </div></div>
        </div>
      </section>
    `;
  }

  function renderFeatures(p) {
    if (!p.features || p.features.length === 0) return '';
    return `
      <section class="pd-section" aria-labelledby="features-title">
        <div class="pd-section-inner">
          <div class="pd-reveal"><span class="pd-section-label">Features</span></div>
          <div class="pd-reveal pd-reveal-delay-1"><h2 class="pd-section-title" id="features-title">What It Does</h2></div>
          <div class="pd-features-grid">
            ${p.features.map((f, i) => `
              <div class="pd-feature-card pd-reveal pd-reveal-delay-${i + 2}">
                <div class="pd-feature-icon">${safeHTML(f.icon || '✅')}</div>
                <h4>${safeHTML(f.title)}</h4>
                <p>${safeHTML(f.description)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderChallenges(p) {
    if (!p.challenges || p.challenges.length === 0) return '';
    return `
      <section class="pd-section pd-section-alt" id="challenges" aria-labelledby="challenges-title">
        <div class="pd-section-inner">
          <div class="pd-reveal"><span class="pd-section-label">Problems Solved</span></div>
          <div class="pd-reveal pd-reveal-delay-1"><h2 class="pd-section-title" id="challenges-title">Challenges & Solutions</h2></div>
          ${p.challenges.map((c, i) => `
            <div class="pd-challenge-card pd-reveal pd-reveal-delay-${i + 2}">
              <div class="pd-challenge-header">
                <div class="pd-challenge-icon" aria-hidden="true">🔴</div>
                <h4>${safeHTML(c.title)}</h4>
              </div>
              <div class="pd-challenge-row">
                <div>
                  <div class="pd-challenge-label">Problem</div>
                  <div class="pd-challenge-text">${safeHTML(c.problem)}</div>
                </div>
                <div>
                  <div class="pd-challenge-label">Solution</div>
                  <div class="pd-challenge-text">${safeHTML(c.solution)}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  }

  function renderResults(p) {
    if (!p.results) return '';
    return `
      <section class="pd-section" id="results" aria-labelledby="results-title">
        <div class="pd-section-inner">
          <div class="pd-reveal"><span class="pd-section-label">Impact</span></div>
          <div class="pd-reveal pd-reveal-delay-1"><h2 class="pd-section-title" id="results-title">Results That Matter</h2></div>
          ${p.results.summary ? `<div class="pd-reveal pd-reveal-delay-2"><p class="pd-section-text">${safeHTML(p.results.summary)}</p></div>` : ''}
          ${p.results.metrics && p.results.metrics.length > 0 ? `
          <div class="pd-stats-grid">
            ${p.results.metrics.map((m, i) => `
              <div class="pd-stat-item pd-reveal pd-reveal-delay-${i + 3}">
                <div class="pd-stat-number" style="font-size:2rem;">${safeHTML(m.value)}</div>
                <div class="pd-stat-label">${safeHTML(m.icon || '📊')} ${safeHTML(m.label)}</div>
              </div>
            `).join('')}
          </div>` : ''}
          ${p.results.beforeAfter ? `
          <div class="pd-before-after">
            <div class="pd-ba-card before"><div class="pd-ba-label">Before</div><div class="pd-ba-metric">${safeHTML(p.results.beforeAfter.before)}</div></div>
            <div class="pd-ba-card after"><div class="pd-ba-label">After</div><div class="pd-ba-metric">${safeHTML(p.results.beforeAfter.after)}</div></div>
          </div>` : ''}
        </div>
      </section>
    `;
  }

  function renderShare(p) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(p.title + ' — Case Study by Ganiyu Usman');
    return `
      <section class="pd-section pd-section-alt" aria-label="Share this case study">
        <div class="pd-section-inner">
          <div class="pd-reveal"><span class="pd-section-label">Share</span></div>
          <div class="pd-reveal pd-reveal-delay-1"><h2 class="pd-section-title">Share This Case Study</h2></div>
          <div class="pd-share-grid pd-reveal pd-reveal-delay-2">
            <a href="https://linkedin.com/sharing/share-offsite/?url=${url}" target="_blank" rel="noopener" class="pd-share-btn linkedin" aria-label="Share on LinkedIn">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="currentColor"/></svg>
              LinkedIn
            </a>
            <a href="https://twitter.com/intent/tweet?url=${url}&text=${title}" target="_blank" rel="noopener" class="pd-share-btn twitter" aria-label="Share on X (Twitter)">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" fill="currentColor"/></svg>
              X / Twitter
            </a>
            <button class="pd-share-btn copy" onclick="navigator.clipboard.writeText(window.location.href).then(function(){var t=document.getElementById('copyToast');t.classList.add('show');setTimeout(function(){t.classList.remove('show');},2000);})" aria-label="Copy link">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" stroke="currentColor" stroke-width="2" fill="none"/></svg>
              Copy Link
            </button>
          </div>
        </div>
      </section>
    `;
  }

  function renderCTA(p) {
    return `
      <section class="pd-cta-section" id="contact-cta" aria-labelledby="cta-title">
        <div class="pd-section-inner">
          <div class="pd-reveal"><span class="pd-section-label">Next Steps</span></div>
          <div class="pd-reveal pd-reveal-delay-1"><h2 class="pd-cta-title" id="cta-title">Want something like this?</h2></div>
          <div class="pd-reveal pd-reveal-delay-2"><p class="pd-cta-subtitle">I build products people remember. Let's build yours.</p></div>
          <div class="pd-cta-actions pd-reveal pd-reveal-delay-3">
            <a href="./index.html#contact" class="pd-btn pd-btn-primary">💬 Start a Conversation</a>
            ${p.links && p.links.live ? `<a href="${safeHTML(p.links.live)}" target="_blank" rel="noopener" class="pd-btn pd-btn-outline">🚀 Try Live Demo</a>` : ''}
          </div>
        </div>
      </section>
    `;
  }

  function renderClientFeedback(p) {
    if (!p.clientFeedback || !p.clientFeedback.quote) return '';
    return `
      <section class="pd-section pd-section-alt" aria-labelledby="feedback-title">
        <div class="pd-section-inner">
          <div class="pd-reveal"><span class="pd-section-label">Feedback</span></div>
          <div class="pd-reveal pd-reveal-delay-1"><h2 class="pd-section-title" id="feedback-title">What They Said</h2></div>
          <div class="pd-spotlight pd-reveal pd-reveal-delay-2">
            <p style="font-size:1.2rem;font-style:italic;margin-bottom:16px;">"${safeHTML(p.clientFeedback.quote)}"</p>
            ${p.clientFeedback.name ? `<p style="font-weight:600;color:var(--text-primary);">— ${safeHTML(p.clientFeedback.name)}${p.clientFeedback.role ? ', <span style="color:var(--text-secondary);">' + safeHTML(p.clientFeedback.role) + '</span>' : ''}</p>` : ''}
          </div>
        </div>
      </section>
    `;
  }

  function renderGallery(p) {
    if (!p.images || p.images.length <= 1) return '';
    return `
      <section class="pd-section" aria-labelledby="gallery-title">
        <div class="pd-section-inner">
          <div class="pd-reveal"><span class="pd-section-label">Gallery</span></div>
          <div class="pd-reveal pd-reveal-delay-1"><h2 class="pd-section-title" id="gallery-title">Visual Showcase</h2></div>
          <div class="pd-gallery-grid">
            ${p.images.map((img, i) => `
              <div class="pd-gallery-item pd-reveal pd-reveal-delay-${i + 2}" data-gallery-index="${i}" role="button" tabindex="0" aria-label="View image ${i + 1}: ${safeHTML(img.caption || '')}">
                <img src="${safeHTML(img.url)}" alt="${safeHTML(img.caption || p.title + ' screenshot ' + (i + 1))}" loading="lazy" decoding="async" />
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderRelatedProjects(d) {
    if (!d.relatedProjects || d.relatedProjects.length === 0) return '';
    return `
      <section class="pd-section pd-section-alt" aria-labelledby="related-title">
        <div class="pd-section-inner">
          <div class="pd-reveal"><span class="pd-section-label">Explore More</span></div>
          <div class="pd-reveal pd-reveal-delay-1"><h2 class="pd-section-title" id="related-title">Related Projects</h2></div>
          <div class="pd-related-grid">
            ${d.relatedProjects.map((rp, i) => {
              const rImg = rp.images && rp.images.length > 0 ? rp.images[0].url : '';
              return `
                <a href="./project-detail.html?slug=${safeHTML(rp.slug)}" class="pd-related-card pd-reveal pd-reveal-delay-${i + 2}">
                  ${rImg ? `<img src="${safeHTML(rImg)}" alt="${safeHTML(rp.title)}" loading="lazy" decoding="async" />` : ''}
                  <div class="pd-related-body"><h5>${safeHTML(rp.title)}</h5><span>${safeHTML(rp.category || '')}</span></div>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      </section>
    `;
  }

  function renderNextProject(d) {
    if (!d.relatedProjects || d.relatedProjects.length === 0) return '';
    const next = d.relatedProjects[0];
    return `
      <section class="pd-next-project">
        <div class="pd-section-inner">
          <div class="pd-next-label">Next Project</div>
          <a href="./project-detail.html?slug=${safeHTML(next.slug)}" class="pd-next-title-link"><h3 class="pd-next-title">${safeHTML(next.title)} →</h3></a>
        </div>
      </section>
    `;
  }

  // ===== COMPOSE =====
  function buildProjectHTML(project, data) {
    return `
      ${renderHero(project)}
      ${renderStats(project)}
      ${renderOverview(project)}
      ${renderTimeline(project)}
      ${renderTechStack(project)}
      ${renderFeatures(project)}
      ${renderChallenges(project)}
      ${renderResults(project)}
      ${renderShare(project)}
      ${renderCTA(project)}
      ${renderClientFeedback(project)}
      ${renderGallery(project)}
      ${renderRelatedProjects(data)}
      ${renderNextProject(data)}
    `;
  }

  // ===== LIGHTBOX =====
  function initLightbox() {
    const overlay = document.getElementById('pdLightbox');
    if (overlay) overlay.remove();

    const lightbox = document.createElement('div');
    lightbox.className = 'pd-lightbox';
    lightbox.id = 'pdLightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-label', 'Image gallery');
    lightbox.innerHTML = `
      <button class="pd-lightbox-close" aria-label="Close gallery">×</button>
      <button class="pd-lightbox-prev" aria-label="Previous image">‹</button>
      <button class="pd-lightbox-next" aria-label="Next image">›</button>
      <div class="pd-lightbox-content">
        <img src="" alt="" id="pdLightboxImg" />
        <p class="pd-lightbox-caption" id="pdLightboxCaption"></p>
        <div class="pd-lightbox-counter" id="pdLightboxCounter"></div>
      </div>
    `;
    document.body.appendChild(lightbox);

    function openLightbox(images, index) {
      currentLightboxImages = images;
      currentLightboxIndex = index;
      updateLightboxImage();
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
      document.getElementById('pdLightboxPrev').focus();
    }

    function updateLightboxImage() {
      const img = currentLightboxImages[currentLightboxIndex];
      document.getElementById('pdLightboxImg').src = img.url;
      document.getElementById('pdLightboxImg').alt = img.caption || '';
      document.getElementById('pdLightboxCaption').textContent = img.caption || '';
      document.getElementById('pdLightboxCounter').textContent = `${currentLightboxIndex + 1} / ${currentLightboxImages.length}`;
    }

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }

    function nextImage() {
      currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
      updateLightboxImage();
    }

    function prevImage() {
      currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
      updateLightboxImage();
    }

    lightbox.querySelector('.pd-lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.pd-lightbox-next').addEventListener('click', nextImage);
    lightbox.querySelector('.pd-lightbox-prev').addEventListener('click', prevImage);
    lightbox.addEventListener('click', function(e) { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener('keydown', function(e) {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    });

    let touchStartX = 0;
    lightbox.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; });
    lightbox.addEventListener('touchend', function(e) {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { diff > 0 ? nextImage() : prevImage(); }
    });

    document.addEventListener('click', function(e) {
      const item = e.target.closest('.pd-gallery-item');
      if (!item) return;
      const index = parseInt(item.getAttribute('data-gallery-index'));
      if (isNaN(index)) return;
      const gallerySection = item.closest('.pd-gallery-grid');
      const images = Array.from(gallerySection.querySelectorAll('.pd-gallery-item')).map((el, i) => ({
        url: el.querySelector('img').src,
        caption: el.querySelector('img').alt || ''
      }));
      openLightbox(images, index);
    });
  }

  // ===== LOAD =====
  function loadProject() {
    const slug = new URLSearchParams(window.location.search).get('slug');
    const container = document.getElementById('projectContent');

    if (!slug) {
      container.innerHTML = renderError('No Project', 'No project was specified in the URL.', false);
      return;
    }

    container.innerHTML = showSkeleton();

    const url = (typeof api !== 'undefined' && api.baseURL ? api.baseURL : 'http://localhost:5000/api/v1') + '/public/projects/' + slug;

    fetch(url)
      .then(function(r) {
        if (!r.ok) throw new Error('Network error');
        return r.json();
      })
      .then(function(d) {
        if (!d.success || !d.project) throw new Error('Not found');
        document.title = d.project.title + ' · Case Study · Ganiyu Usman';
        container.innerHTML = buildProjectHTML(d.project, d);
        initRevealObserver();
        initLightbox();
      })
      .catch(function(err) {
        if (err.message === 'Not found') {
          container.innerHTML = renderError('404', 'This project could not be found. It may have been removed or the link is incorrect.', false);
        } else {
          container.innerHTML = renderError('Connection Error', 'Unable to load the case study. Please check your connection and try again.', true);
        }
      });
  }

  // ===== COPY TOAST =====
  const toast = document.createElement('div');
  toast.className = 'pd-copy-toast';
  toast.id = 'copyToast';
  toast.textContent = '✓ Link copied!';
  document.body.appendChild(toast);

  loadProject();
})();
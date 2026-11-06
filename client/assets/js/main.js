// ===== MAIN APPLICATION =====
class PortfolioApp {
  constructor() {
    this.projects = [];
    this.skills = [];
    this.settings = [];
    this._tmTimer = null;
    this.init();
  }

  async init() {
    this.hideLoadingScreen();
    this.initNavigation();
    await this.loadContent();
    this.initComponents();
    this.initExpandClose();
    this.bindGlobalDismiss();
  }

  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
      setTimeout(() => { loadingScreen.classList.add('hidden'); }, 500);
    }
  }

  initNavigation() {
    const hamburger = document.getElementById('hamburgerBtn');
    const navbar = document.getElementById('navbar');
    const overlay = document.getElementById('overlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const header = document.querySelector('.header');
    const sections = Array.from(document.querySelectorAll('section[id]'));

    if (hamburger) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navbar?.classList.toggle('open');
        overlay?.classList.toggle('active');
        document.body.classList.toggle('menu-open');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        hamburger?.classList.remove('active');
        navbar?.classList.remove('open');
        overlay.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    }

    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) current = section.getAttribute('id');
      });
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
      });
      if (window.scrollY > 50) header?.classList.add('scrolled');
      else header?.classList.remove('scrolled');
    }, { passive: true });
  }

  async loadContent() {
    try {
      const results = await Promise.allSettled([
        this.loadProjects(),
        this.loadSkills(),
        this.loadExperiences(),
        this.loadGitHubStats(),
        this.loadSettings(),
        this.loadTestimonials()
      ]);
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          console.warn(`[loadContent] loader #${i} failed:`, r.reason);
        }
      });
      window.dispatchEvent(new CustomEvent('content-loaded'));
    } catch (error) {
      console.error('Failed to load content:', error);
      this.useFallbackContent();
    }
  }

  // ===== PROJECTS =====
  async loadProjects() {
    try {
      const data = await api.getPublicProjects();
      if (data.success && data.projects.length > 0) {
        this.projects = data.projects;
        this.renderProjects(data.projects);
        this.renderProjectFilters(data.projects);
      }
    } catch (error) {
      console.log('Using static projects data');
    }
  }

  renderProjects(projects) {
    const gallery = document.getElementById('projectGallery');
    const dotsContainer = document.getElementById('galleryDots');
    if (!gallery) return;

    gallery.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    const getFullImageUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      if (url.startsWith('/')) return 'http://localhost:5000' + url;
      return url;
    };

    const placeholderUrl = 'data:image/svg+xml,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250">' +
      '<rect fill="#f1f5f9" width="400" height="250"/>' +
      '<text x="200" y="130" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="Arial, sans-serif">No Image Available</text>' +
      '</svg>'
    );

    projects.forEach((project, index) => {
      const heroImage = project.images?.find(img => img.isHero) || project.images?.[0];
      const imgUrl = heroImage?.url ? getFullImageUrl(heroImage.url) : placeholderUrl;

      const card = document.createElement('div');
      card.className = 'gallery-card reveal';
      card.style.transitionDelay = `${index * 0.1}s`;
      card.setAttribute('data-index', index);
      card.setAttribute('data-project-id', project.slug || project._id);

      card.innerHTML = `
        <div class="gallery-card-image">
          <img src="${imgUrl}" alt="${project.title}" loading="lazy" onerror="this.src='${placeholderUrl}'" />
          <div class="gallery-card-overlay">
            ${project.links?.live ? `<a href="${project.links.live}" target="_blank" rel="noopener" class="gallery-overlay-btn live">Live Demo</a>` : ''}
            ${project.links?.github ? `<a href="${project.links.github}" target="_blank" rel="noopener" class="gallery-overlay-btn github">GitHub</a>` : ''}
          </div>
        </div>
        <div class="gallery-card-body">
          <span class="gallery-card-category ${project.category || 'fullstack'}">${project.category || 'fullstack'}</span>
          <h3 class="gallery-card-title" data-id="${project._id}" data-slug="${project.slug}">${project.title}</h3>
          <p class="gallery-card-desc">${project.description || ''}</p>
          <div class="gallery-card-tech">
            ${(project.technologies || []).slice(0, 4).map(tech => `<span class="gallery-tech-tag">${tech}</span>`).join('')}
            ${(project.technologies || []).length > 4 ? `<span class="gallery-tech-tag">+${project.technologies.length - 4}</span>` : ''}
          </div>
          <div class="gallery-card-stats">
            <span class="gallery-stat">⭐ ${project.stats?.stars || 0}</span>
            <span class="gallery-stat">⑂ ${project.stats?.forks || 0}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.gallery-card-overlay') || e.target.closest('a')) return;
        window.location.href = './project-detail.html?slug=' + (project.slug || project._id);
      });

      gallery.appendChild(card);

      if (dotsContainer) {
        const dot = document.createElement('div');
        dot.className = `gallery-dot ${index === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => this.scrollToCard(index));
        dotsContainer.appendChild(dot);
      }
    });

    this.initGallery();
  }

  initGallery() {
    const gallery = document.getElementById('projectGallery');
    const leftArrow = document.getElementById('galleryArrowLeft');
    const rightArrow = document.getElementById('galleryArrowRight');
    if (!gallery) return;

    if (leftArrow) leftArrow.addEventListener('click', () => gallery.scrollBy({ left: -400, behavior: 'smooth' }));
    if (rightArrow) rightArrow.addEventListener('click', () => gallery.scrollBy({ left: 400, behavior: 'smooth' }));

    gallery.addEventListener('scroll', () => {
      const cards = gallery.querySelectorAll('.gallery-card');
      const dots = document.querySelectorAll('.gallery-dot');
      const galleryCenter = gallery.scrollLeft + gallery.offsetWidth / 2;
      let activeIndex = 0;
      cards.forEach((card, index) => {
        const cardLeft = card.offsetLeft;
        const cardRight = cardLeft + card.offsetWidth;
        if (galleryCenter >= cardLeft && galleryCenter <= cardRight) activeIndex = index;
      });
      dots.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));
      if (leftArrow) leftArrow.disabled = gallery.scrollLeft <= 10;
      if (rightArrow) rightArrow.disabled = gallery.scrollLeft >= gallery.scrollWidth - gallery.offsetWidth - 10;
    }, { passive: true });

    let isDown = false, startX, scrollLeftVal;
    gallery.addEventListener('mousedown', (e) => {
      isDown = true; gallery.classList.add('dragging');
      startX = e.pageX - gallery.offsetLeft;
      scrollLeftVal = gallery.scrollLeft;
    });
    gallery.addEventListener('mouseleave', () => { isDown = false; gallery.classList.remove('dragging'); });
    gallery.addEventListener('mouseup', () => { isDown = false; gallery.classList.remove('dragging'); });
    gallery.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - gallery.offsetLeft;
      gallery.scrollLeft = scrollLeftVal - (x - startX) * 2;
    });

    setTimeout(() => { if (leftArrow) leftArrow.disabled = true; }, 100);
  }

  scrollToCard(index) {
    const gallery = document.getElementById('projectGallery');
    if (!gallery) return;
    const cards = gallery.querySelectorAll('.gallery-card');
    if (cards[index]) {
      const cardLeft = cards[index].offsetLeft;
      const galleryWidth = gallery.offsetWidth;
      const cardWidth = cards[index].offsetWidth;
      const scrollTo = cardLeft - (galleryWidth / 2) + (cardWidth / 2);
      gallery.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  }

  renderProjectFilters(projects) {
    const filterContainer = document.getElementById('projectFilters');
    if (!filterContainer) return;
    const categories = ['all', ...new Set(projects.map(p => p.category).filter(Boolean))];
    filterContainer.innerHTML = '';
    categories.forEach(category => {
      const count = category === 'all' ? projects.length : projects.filter(p => p.category === category).length;
      const btn = document.createElement('button');
      btn.className = `filter-btn ${category === 'all' ? 'active' : ''}`;
      btn.setAttribute('data-filter', category);
      btn.innerHTML = `${category.charAt(0).toUpperCase() + category.slice(1)} <span class="filter-count">${count}</span>`;
      btn.addEventListener('click', () => this.filterProjects(category, btn));
      filterContainer.appendChild(btn);
    });
  }

  filterProjects(category, clickedBtn) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
    document.querySelectorAll('.gallery-card').forEach(card => {
      const cat = card.querySelector('.gallery-card-category')?.textContent;
      card.style.display = (category === 'all' || cat === category) ? '' : 'none';
    });
  }

  // ===== TESTIMONIALS =====
  async loadTestimonials() {
    try {
      const data = await api.fetchAPI('/public/testimonials');
      if (data.success && data.testimonials) {
        this.buildTestimonials(data.testimonials);
      }
    } catch (error) { console.log('No testimonials loaded'); }
  }

  buildTestimonials(testimonials) {
    if (!testimonials || testimonials.length === 0) return;

    let currentSlide = 0;
    const heroContainer = document.getElementById('tmHero');
    const sliderContainer = document.getElementById('tmFloating');
    if (!heroContainer) return;

    function renderSlide() {
      const t = testimonials[currentSlide];
      const companyName = t.company || '';
      const roleName = t.role || '';
      const fullTitle = [roleName, companyName].filter(Boolean).join(', ');

      heroContainer.innerHTML = `
        <div class="tm-hero-card">
          <div class="tm-hero-quote-mark">"</div>
          <p class="tm-hero-quote">${(t.quote || '').replace(/(\d+%)/g, '<em>$1</em>')}</p>
          <div class="tm-hero-author">
            <div class="tm-hero-avatar">${(t.name || '?').charAt(0).toUpperCase()}</div>
            <div class="tm-hero-name">${t.name || 'Anonymous'}</div>
            <div class="tm-hero-role">${fullTitle || 'Client'}</div>
          </div>
          ${t.impact && t.impact.metrics && t.impact.metrics.length > 0 ? `
            <div class="tm-hero-metrics">
              ${t.impact.metrics.map(m => `
                <div>
                  <div class="tm-hero-metric-value">${m.value}</div>
                  <div class="tm-hero-metric-label">${m.label}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;

      document.querySelectorAll('.tm-slider-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
      });

      const counter = document.getElementById('tmCounter');
      if (counter) counter.textContent = `${currentSlide + 1} / ${testimonials.length}`;
    }

    if (sliderContainer) {
      sliderContainer.innerHTML = `
        <button class="tm-slider-arrow tm-prev" id="tmPrev" aria-label="Previous testimonial">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="tm-slider-dots" id="tmDots">
          ${testimonials.map((_, i) => `<span class="tm-slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
        </div>
        <button class="tm-slider-arrow tm-next" id="tmNext" aria-label="Next testimonial">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <div class="tm-counter" id="tmCounter">1 / ${testimonials.length}</div>
      `;
    }

    function goToSlide(index) {
      currentSlide = index;
      if (currentSlide < 0) currentSlide = testimonials.length - 1;
      if (currentSlide >= testimonials.length) currentSlide = 0;
      renderSlide();
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }

    setTimeout(() => {
      document.getElementById('tmNext')?.addEventListener('click', nextSlide);
      document.getElementById('tmPrev')?.addEventListener('click', prevSlide);
      document.querySelectorAll('.tm-slider-dot').forEach(dot => {
        dot.addEventListener('click', () => goToSlide(parseInt(dot.getAttribute('data-index'))));
      });
    }, 100);

    renderSlide();

    if (this._tmTimer) clearInterval(this._tmTimer);
    this._tmTimer = setInterval(nextSlide, 5000);
  }

  // ===== SKILLS =====
  async loadSkills() {
    try {
      const data = await api.getSkills();
      if (data.success && data.skills) {
        this.skills = data.skills;
        this.renderSkills(data.skills);
      }
    } catch (error) { console.log('Using static skills data'); }
  }

  renderSkills(skills) {
    const cloud = document.getElementById('skillsCloud');
    if (!cloud) return;

    cloud.innerHTML = '';

    skills.forEach((skill, index) => {
      const bubble = document.createElement('button');
      bubble.type = 'button';
      bubble.setAttribute('role', 'listitem');
      bubble.setAttribute('aria-label', skill.name + ' — ' + this.getLevelText(skill.level) + ', ' + (skill.category || 'frontend'));
      bubble.setAttribute('tabindex', '0');

      let sizeClass = 'intermediate';
      if (skill.level >= 90) sizeClass = 'expert';
      else if (skill.level >= 75) sizeClass = 'advanced';
      else if (skill.level >= 50) sizeClass = 'intermediate';
      else sizeClass = 'beginner';

      bubble.className = `skill-bubble ${skill.category || 'frontend'} ${sizeClass}`;
      bubble.textContent = skill.name;
      bubble.setAttribute('data-category', skill.category || 'frontend');
      bubble.setAttribute('data-level', skill.level || 80);
      bubble.setAttribute('data-name', skill.name);
      bubble.style.animationDelay = `${index * 0.15}s`;

      bubble.addEventListener('mouseenter', (e) => {
        if (window.matchMedia('(pointer: fine)').matches) this.showSkillTooltip(e, bubble);
      });
      bubble.addEventListener('mouseleave', () => { this.hideSkillTooltip(); });
      bubble.addEventListener('mousemove', (e) => {
        if (window.matchMedia('(pointer: fine)').matches) this.moveTooltip(e);
      });
      bubble.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = bubble.classList.contains('active-bubble');
        document.querySelectorAll('.skill-bubble').forEach(b => b.classList.remove('active-bubble'));
        this.hideSkillTooltip();
        if (!isActive) {
          bubble.classList.add('active-bubble');
          this.showSkillTooltip(e, bubble);
        }
      });
      bubble.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bubble.click(); }
      });

      cloud.appendChild(bubble);
    });

    const filterBtns = document.querySelectorAll('.skills-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const filter = btn.getAttribute('data-filter');
        cloud.querySelectorAll('.skill-bubble').forEach(bubble => {
          if (filter === 'all' || bubble.getAttribute('data-category') === filter) {
            bubble.classList.remove('filtered-out');
            bubble.setAttribute('tabindex', '0');
          } else {
            bubble.classList.add('filtered-out');
            bubble.setAttribute('tabindex', '-1');
          }
        });
      });
    });
  }

  // Bound once in init() — dismisses active skill bubble / tooltip on outside click
  bindGlobalDismiss() {
    document.addEventListener('click', () => {
      document.querySelectorAll('.skill-bubble').forEach(b => b.classList.remove('active-bubble'));
      this.hideSkillTooltip();
    });
  }

  getLevelText(level) {
    if (level >= 90) return 'Expert';
    if (level >= 75) return 'Advanced';
    if (level >= 50) return 'Intermediate';
    return 'Beginner';
  }

  showSkillTooltip(e, bubble) {
    const tooltip = document.getElementById('skillTooltip');
    if (!tooltip) return;
    const name = bubble.getAttribute('data-name');
    const level = parseInt(bubble.getAttribute('data-level'));
    const category = bubble.getAttribute('data-category');
    const levelText = this.getLevelText(level);

    const nameEl = document.getElementById('tooltipName');
    const levelEl = document.getElementById('tooltipLevel');
    const catEl = document.getElementById('tooltipCategory');
    const fill = document.getElementById('tooltipFill');

    if (nameEl) nameEl.textContent = name;
    if (levelEl) levelEl.textContent = `${levelText} • ${level}%`;
    if (catEl) catEl.textContent = category;
    if (fill) {
      fill.style.width = '0%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { fill.style.width = level + '%'; });
      });
    }

    tooltip.classList.add('show');
    this.moveTooltip(e);
  }

  moveTooltip(e) {
    const tooltip = document.getElementById('skillTooltip');
    if (!tooltip) return;
    const rect = tooltip.getBoundingClientRect();
    let x = e.clientX + 16;
    let y = e.clientY - rect.height - 12;
    if (x + rect.width > window.innerWidth - 10) x = e.clientX - rect.width - 16;
    if (y < 10) y = e.clientY + 24;
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
  }

  hideSkillTooltip() {
    const tooltip = document.getElementById('skillTooltip');
    if (tooltip) tooltip.classList.remove('show');
  }

  // ===== EXPERIENCE =====
  async loadExperiences() {
    try {
      const data = await api.fetchAPI('/public/experiences');
      if (data.success && data.experiences) {
        this.buildLuxuryExperience(data.experiences);
      }
    } catch (error) {
      console.log('Using static experience data');
    }
  }

  buildLuxuryExperience(experiences) {
    if (!experiences || experiences.length === 0) return;

    const workExp = experiences.filter(e => e && e.type === 'work');
    const eduExp = experiences.filter(e => e && (e.type === 'education' || e.type === 'certification'));
    const showcase = document.getElementById('expShowcase');
    const impactGrid = document.getElementById('expImpactGrid');
    const prestigeGrid = document.getElementById('expPrestigeGrid');

    if (showcase) {
      showcase.innerHTML = workExp.map((exp, i) => {
        const endDate = exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
        const startDate = new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const color = exp.color || '#FF6B00';
        return `
          <div class="exp-showcase-item visible" style="transition-delay:${i * 0.08}s">
            <div class="exp-showcase-visual">
              <div class="exp-showcase-frame" style="border-left: 4px solid ${color};">
                <div class="exp-showcase-icon" style="background:${color}15;color:${color};">💼</div>
                <div class="exp-showcase-org">${startDate} — ${endDate}</div>
                <h3 class="exp-showcase-role">${exp.title || ''}</h3>
                ${exp.organization ? '<p class="exp-showcase-company">' + exp.organization + '</p>' : ''}
                ${exp.description ? '<p class="exp-showcase-desc">' + exp.description + '</p>' : ''}
                ${exp.skills && exp.skills.length ? '<div class="exp-showcase-skills">' + exp.skills.map(s => '<span class="exp-showcase-skill">' + s + '</span>').join('') + '</div>' : ''}
              </div>
            </div>
            <div class="exp-showcase-text">
              ${exp.achievements && exp.achievements.length ? '<div class="exp-showcase-label">Achievements</div><ul class="exp-showcase-achievements">' + exp.achievements.map(a => '<li>' + a + '</li>').join('') + '</ul>' : ''}
            </div>
          </div>
        `;
      }).join('');
    }

    if (impactGrid) {
      let totalYears = '3+';
      if (workExp.length > 0) {
        const firstExp = workExp[workExp.length - 1];
        if (firstExp && firstExp.startDate) {
          const startYear = new Date(firstExp.startDate).getFullYear();
          if (!isNaN(startYear)) totalYears = Math.max(1, new Date().getFullYear() - startYear) + '+';
        }
      }
      const metrics = [
        { icon: '📅', value: totalYears, label: 'Years Experience' },
        { icon: '🚀', value: (workExp.length + 3) + '+', label: 'Projects Built' },
        { icon: '⚡', value: '15+', label: 'Technologies' },
        { icon: '📜', value: '2', label: 'Certifications' }
      ];
      impactGrid.innerHTML = metrics.map((m, i) => `
        <div class="exp-impact-card visible" style="transition-delay:${i * 0.08}s">
          <div class="exp-impact-icon">${m.icon}</div>
          <div class="exp-impact-value">${m.value}</div>
          <div class="exp-impact-label">${m.label}</div>
        </div>
      `).join('');
    }

    if (prestigeGrid && eduExp.length) {
      prestigeGrid.innerHTML = eduExp.map((exp, i) => `
        <div class="exp-prestige-card visible" style="transition-delay:${i * 0.1}s">
          <div class="exp-prestige-icon">${exp.type === 'certification' ? '📜' : '🎓'}</div>
          <h4 class="exp-prestige-degree">${exp.title || ''}</h4>
          ${exp.organization ? '<p class="exp-prestige-school">' + exp.organization + '</p>' : ''}
          ${exp.description ? '<p class="exp-prestige-desc">' + exp.description + '</p>' : ''}
        </div>
      `).join('');
    }

    document.querySelectorAll('.exp-intro-eyebrow, .exp-intro-headline, .exp-intro-line, .exp-intro-sub').forEach(el => el.classList.add('visible'));
    document.querySelectorAll('.exp-impact-headline, .exp-prestige-headline').forEach(el => el.classList.add('visible'));
  }
  // ===== GITHUB STATS =====
  async loadGitHubStats() {
    const GITHUB_USERNAME = 'geeooh25';
    const GITHUB_API_BASE = 'https://api.github.com';
    const REQUEST_TIMEOUT_MS = 8000;
    const githubStatsEl = document.getElementById('githubStats');
    if (!githubStatsEl) return;

    const loadingEl = document.getElementById('githubLoading');
    const errorEl   = document.getElementById('githubError');
    const retryBtn  = document.getElementById('githubRetry');
    const updatedEl = document.getElementById('githubUpdated');
    const subtitleEl = document.getElementById('githubSubtitle');

    // --- state helpers (belt-and-suspenders: hidden attr + inline display) ---
    const showLoading = () => {
      if (loadingEl) { loadingEl.hidden = false; loadingEl.style.display = ''; }
      if (errorEl)   { errorEl.hidden = true;   errorEl.style.display = 'none'; }
      githubStatsEl.hidden = true;
      githubStatsEl.style.display = 'none';
    };
    const showStats = () => {
      if (loadingEl) { loadingEl.hidden = true; loadingEl.style.display = 'none'; }
      if (errorEl)   { errorEl.hidden = true;   errorEl.style.display = 'none'; }
      githubStatsEl.hidden = false;
      githubStatsEl.style.display = '';   // defer to your .github-stats CSS
    };
    const showError = () => {
      if (loadingEl) { loadingEl.hidden = true; loadingEl.style.display = 'none'; }
      if (errorEl)   { errorEl.hidden = false; errorEl.style.display = ''; }
      githubStatsEl.hidden = true;
      githubStatsEl.style.display = 'none';
    };

    const fetchWithTimeout = async (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        return await fetch(url, { ...options, signal: controller.signal });
      } catch (error) {
        if (error.name === 'AbortError') throw new Error('Request timed out');
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const fallbackMetrics = [
      { icon: '📦', value: '25', label: 'Repositories' },
      { icon: '⭐', value: '12', label: 'Stars Earned' },
      { icon: '⑂', value: '2',  label: 'Forks' },
      { icon: '👥', value: '8',  label: 'Followers' }
    ];

    // wire retry button ONCE (guard against duplicate binding on re-runs)
    if (retryBtn && !retryBtn.dataset.bound) {
      retryBtn.dataset.bound = '1';
      retryBtn.addEventListener('click', () => {
        try { sessionStorage.removeItem(`gh-stats-${GITHUB_USERNAME}`); } catch {}
        this.loadGitHubStats();
      });
    }

    // reset UI to loading state
    showLoading();

    // --- cache check (1h TTL, sessionStorage) ---
    const CACHE_KEY = `gh-stats-${GITHUB_USERNAME}`;
    const CACHE_TTL = 1000 * 60 * 60;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { t, data } = JSON.parse(cached);
        if (Date.now() - t < CACHE_TTL && data && data.metrics) {
          this.renderGitHubMetrics(data.metrics);
         // this._applyGitHubExtras(data);
          showStats();
          if (updatedEl) updatedEl.textContent =
            `Last updated ${new Date(data.fetchedAt).toLocaleTimeString()} · Data from public GitHub API (cached)`;
          return;
        }
      }
    } catch { /* ignore cache errors */ }

    try {
      const [profileRes, reposRes] = await Promise.all([
        fetchWithTimeout(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}`),
        fetchWithTimeout(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos?per_page=100&sort=updated&type=owner`)
      ]);
      if (!profileRes.ok || !reposRes.ok) throw new Error('GitHub API request failed');

      const profile = await profileRes.json();
      const repos   = await reposRes.json();

      const myForks    = repos.filter(r => r.fork);
      const originals  = repos.filter(r => !r.fork);
      const totalStars = originals.reduce((s, r) => s + (r.stargazers_count || 0), 0);

      const metrics = [
        { icon: '📦', value: String(profile.public_repos || repos.length), label: 'Repositories' },
        { icon: '⭐', value: String(totalStars),                          label: 'Stars Earned' },
        { icon: '⑂',  value: String(myForks.length),                      label: 'Forks' },
        { icon: '👥', value: String(profile.followers || 0),              label: 'Followers' }
      ];

      const payload = {
        metrics,
        forks: myForks.map(f => ({ name: f.name, url: f.html_url })),
        fetchedAt: Date.now()
      };

      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: payload.fetchedAt, data: payload })); } catch {}

      this.renderGitHubMetrics(metrics);
      // this._applyGitHubExtras(payload);
      showStats();
      if (updatedEl) updatedEl.textContent =
        `Last updated ${new Date(payload.fetchedAt).toLocaleTimeString()} · Data from public GitHub API`;
    } catch (error) {
      console.warn('GitHub fetch failed:', error.message);
      // show fallback numbers + error note (keeps section populated, not blank)
      this.renderGitHubMetrics(fallbackMetrics);
      showStats();
      if (subtitleEl) subtitleEl.textContent = 'Live stats unavailable — showing cached fallback';
      if (updatedEl) updatedEl.textContent = `Could not load live data (${error.message})`;
    }
  }

  // Applies the non-grid extras: subtitle "Forked: …" line
  /*applyGitHubExtras(payload) {
    const subtitleEl = document.getElementById('githubSubtitle');
    if (!subtitleEl) return;
    const forks = payload && payload.forks ? payload.forks : [];
    if (forks.length) {
      subtitleEl.innerHTML = 'Forked: ' + forks
        .map(f => `<a href="${f.url}" target="_blank" rel="noopener">${f.name}</a>`)
        .join(', ');
    } else {
      subtitleEl.textContent = '';
    }
  } */

  renderGitHubMetrics(metrics) {
    const container = document.getElementById('githubStats');
    if (!container) return;

    // Ensure loader/error are hidden whenever metrics render (defensive; harmless if already hidden)
    const loading = document.getElementById('githubLoading');
    const error   = document.getElementById('githubError');
    if (loading) { loading.hidden = true; loading.style.display = 'none'; }
    if (error)   { error.hidden = true;   error.style.display = 'none'; }
    container.hidden = false;
    container.style.display = '';

    container.innerHTML = metrics.map((m, i) => `
      <div class="stat-card reveal" style="transition-delay:${i * 0.1}s">
        <div class="stat-icon">${m.icon}</div>
        <div class="stat-number">${m.value}</div>
        <div class="stat-label">${m.label}</div>
      </div>
    `).join('');
  }

  // ===== SETTINGS =====
  async loadSettings() {
    try {
      const data = await api.getSettings();
      if (data.success && data.settings) {
        this.settings = data.settings;
        this.applySettings(data.settings);
      }
    } catch (error) { console.log('Using default settings'); }
  }

  applySettings(settings) {
    if (settings.heroSection) {
      const title = document.querySelector('.title-line');
      const subtitle = document.querySelector('.title-highlight');
      const desc = document.getElementById('heroDescription');
      if (title && settings.heroSection.title) title.textContent = settings.heroSection.title;
      if (subtitle && settings.heroSection.subtitle) subtitle.textContent = settings.heroSection.subtitle;
      if (desc && settings.heroSection.description) desc.textContent = settings.heroSection.description;
    }
  }

  // ===== COMPONENTS =====
  initComponents() {
    this.initContactForm();
    this.initTiltEffect();
  }

  initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('.submit-btn');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Sending...'; }
      try {
        const result = await api.sendContactMessage({
          name: form.querySelector('#name').value,
          email: form.querySelector('#email').value,
          content: form.querySelector('#message').value
        });
        if (result.success) {
          toast('Message sent! 🎉', 'success');
          form.reset();
        } else {
          toast('Failed to send. Try again.', 'error');
        }
      } catch (error) {
        toast('Failed to send. Try again.', 'error');
      }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalText; }
    });
  }

  initTiltEffect() {
    document.querySelectorAll('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = ((y - rect.height/2) / (rect.height/2)) * -10;
        const rotateY = ((x - rect.width/2) / (rect.width/2)) * 10;
        el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)'; });
    });
  }

  initExpandClose() {
    const overlay = document.getElementById('projectExpandOverlay');
    const closeBtn = document.getElementById('projectExpandClose');
    if (!overlay) return;
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  useFallbackContent() { console.log('Using static fallback content'); }
}

// ===== TOAST HELPER (self-contained, no CSS dependency) =====
function toast(message, type = 'info', duration = 3200) {
  let container = document.getElementById('__toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = '__toastContainer';
    container.style.cssText = [
      'position:fixed', 'right:20px', 'bottom:20px', 'z-index:99999',
      'display:flex', 'flex-direction:column', 'gap:10px',
      'pointer-events:none', 'max-width:min(360px, 90vw)'
    ].join(';');
    document.body.appendChild(container);
  }

  const colors = {
    success: { bg: '#16a34a', fg: '#ffffff' },
    error:   { bg: '#dc2626', fg: '#ffffff' },
    info:    { bg: '#1f2937', fg: '#ffffff' }
  }[type] || { bg: '#1f2937', fg: '#ffffff' };

  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.textContent = message;
  el.style.cssText = [
    `background:${colors.bg}`, `color:${colors.fg}`,
    'padding:12px 16px', 'border-radius:10px',
    'font:14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    'box-shadow:0 8px 24px rgba(0,0,0,.25)',
    'transform:translateY(12px)', 'opacity:0',
    'transition:transform .25s ease, opacity .25s ease',
    'pointer-events:auto'
  ].join(';');

  container.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = 'translateY(0)';
    el.style.opacity = '1';
  });

  setTimeout(() => {
    el.style.transform = 'translateY(12px)';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ===== EVENT DELEGATION =====
document.addEventListener('mousemove', function(e) {
  const frame = e.target.closest('.exp-showcase-frame');
  if (!frame) return;
  const rect = frame.getBoundingClientRect();
  frame.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
  frame.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
}, { passive: true });

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
  window.portfolioApp = new PortfolioApp();
});
// ===== MAIN APPLICATION =====
class PortfolioApp {
  constructor() {
    this.projects = [];
    this.skills = [];
    this.settings = [];
    this.init();
  }

  async init() {
    this.hideLoadingScreen();
    this.initNavigation();
    await this.loadContent();
    this.initComponents();
    this.initExpandClose();
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
      const sections = document.querySelectorAll('section[id]');
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) current = section.getAttribute('id');
      });
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
      });
      const header = document.querySelector('.header');
      if (window.scrollY > 50) header?.classList.add('scrolled');
      else header?.classList.remove('scrolled');
    });
  }

  async loadContent() {
    try {
      await this.loadProjects();
      await this.loadSkills();
      await this.loadExperiences();
      await this.loadGitHubStats();
      await this.loadSettings();
      await this.loadTestimonials();
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

    projects.forEach((project, index) => {
      const heroImage = project.images?.find(img => img.isHero) || project.images?.[0];
      const imgUrl = heroImage?.url || './assets/images/placeholder.jpg';

      const card = document.createElement('div');
      card.className = 'gallery-card reveal';
      card.style.transitionDelay = `${index * 0.1}s`;
      card.setAttribute('data-index', index);
      card.setAttribute('data-project-id', project.slug || project._id);

      card.innerHTML = `
        <div class="gallery-card-image">
          <img src="${imgUrl}" alt="${project.title}" loading="lazy" />
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

    const featured = testimonials.find(t => t.featured) || testimonials[0];
    const rest = testimonials.filter(t => t._id !== featured._id);

    const heroContainer = document.getElementById('tmHero');
    if (heroContainer && featured) {
      heroContainer.innerHTML = `
        <div class="tm-hero-card">
          <div class="tm-hero-quote-mark">"</div>
          <p class="tm-hero-quote">${featured.quote.replace(/(\d+%)/g, '<em>$1</em>')}</p>
          <div class="tm-hero-author">
            <div class="tm-hero-avatar">${featured.name.charAt(0)}</div>
            <div class="tm-hero-name">${featured.name}</div>
            <div class="tm-hero-role">${featured.role}, ${featured.company}</div>
          </div>
          ${featured.impact && featured.impact.metrics ? `
            <div class="tm-hero-metrics">
              ${featured.impact.metrics.map(m => `
                <div>
                  <div class="tm-hero-metric-value">${m.value}</div>
                  <div class="tm-hero-metric-label">${m.label}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    const floatingContainer = document.getElementById('tmFloating');
    if (floatingContainer && rest.length > 0) {
      floatingContainer.innerHTML = rest.map((t, i) => `
        <div class="tm-float-card" style="transition-delay:${i * 0.1}s">
          <p class="tm-float-quote">"${t.shortQuote || t.quote.substring(0, 120)}..."</p>
          <div class="tm-float-author">
            <div class="tm-float-avatar">${t.name.charAt(0)}</div>
            <div>
              <div class="tm-float-name">${t.name}</div>
              <div class="tm-float-company">${t.role}, ${t.company}</div>
            </div>
          </div>
        </div>
      `).join('');
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.tm-float-card').forEach(card => observer.observe(card));
  }

  initGallery() {
    const gallery = document.getElementById('projectGallery');
    const leftArrow = document.getElementById('galleryArrowLeft');
    const rightArrow = document.getElementById('galleryArrowRight');
    const dots = document.querySelectorAll('.gallery-dot');
    if (!gallery) return;

    if (leftArrow) leftArrow.addEventListener('click', () => gallery.scrollBy({ left: -400, behavior: 'smooth' }));
    if (rightArrow) rightArrow.addEventListener('click', () => gallery.scrollBy({ left: 400, behavior: 'smooth' }));

    gallery.addEventListener('scroll', () => {
      const cards = gallery.querySelectorAll('.gallery-card');
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
    });

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
    const categories = ['all', ...new Set(projects.map(p => p.category))];
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
      card.style.display = (category === 'all' || cat === category) ? 'block' : 'none';
    });
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
        if (window.matchMedia('(pointer: fine)').matches) {
          this.showSkillTooltip(e, bubble);
        }
      });
      bubble.addEventListener('mouseleave', () => { this.hideSkillTooltip(); });
      bubble.addEventListener('mousemove', (e) => {
        if (window.matchMedia('(pointer: fine)').matches) {
          this.moveTooltip(e);
        }
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
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          bubble.click();
        }
      });

      cloud.appendChild(bubble);
    });

    document.addEventListener('click', () => {
      document.querySelectorAll('.skill-bubble').forEach(b => b.classList.remove('active-bubble'));
      this.hideSkillTooltip();
    });

    const filterBtns = document.querySelectorAll('.skills-filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const filter = btn.getAttribute('data-filter');
        const bubbles = cloud.querySelectorAll('.skill-bubble');
        bubbles.forEach(bubble => {
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
    document.getElementById('tooltipName').textContent = name;
    document.getElementById('tooltipLevel').textContent = `${levelText} • ${level}%`;
    document.getElementById('tooltipCategory').textContent = category;
    const fill = document.getElementById('tooltipFill');
    fill.style.width = '0%';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fill.style.width = level + '%';
      });
    });
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

  // ===== LUXURY CINEMATIC EXPERIENCE =====
  async loadExperiences() {
    try {
      const data = await api.fetchAPI('/public/experiences');
      if (data.success && data.experiences) {
        buildLuxuryExperience(data.experiences);
      }
    } catch (error) {
      console.log('Using static experience data');
    }
  }

  // ===== GITHUB STATS =====
  async loadGitHubStats() {
    const GITHUB_USERNAME = 'geeooh25';
    const GITHUB_API_BASE = 'https://api.github.com';
    const REQUEST_TIMEOUT_MS = 8000;

    const githubStatsEl = document.getElementById('githubStats');
    const githubLoadingEl = document.getElementById('githubLoading');
    const githubErrorEl = document.getElementById('githubError');
    const githubUpdatedEl = document.getElementById('githubUpdated');
    const githubSubtitleEl = document.getElementById('githubSubtitle');
    const githubRetryBtn = document.getElementById('githubRetry');

    if (!githubStatsEl) return;

    // Helper functions
    const fetchWithTimeout = async (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(options.headers || {})
          }
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw error;
      }
    };

    const fetchGitHubProfile = async (username) => {
      const response = await fetchWithTimeout(`${GITHUB_API_BASE}/users/${username}`);
      if (response.status === 404) throw new Error('User not found');
      if (response.status === 403) throw new Error('Rate limited');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    };

    const fetchGitHubRepos = async (username) => {
      const response = await fetchWithTimeout(
        `${GITHUB_API_BASE}/users/${username}/repos?per_page=100&sort=updated`
      );
      if (!response.ok) throw new Error('Failed to fetch repositories');
      return response.json();
    };

    const getTopLanguage = (repos) => {
      const langCount = {};
      repos.forEach(repo => {
        if (repo.language) {
          langCount[repo.language] = (langCount[repo.language] || 0) + 1;
        }
      });
      let topLang = '';
      let topCount = 0;
      Object.entries(langCount).forEach(([lang, count]) => {
        if (count > topCount) {
          topLang = lang;
          topCount = count;
        }
      });
      return topLang;
    };

    const formatNumber = (num) => {
      if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
      }
      return String(num);
    };

    const calculateGitHubMetrics = (profile, repos) => {
      const totalStars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
      const totalForks = repos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0);
      const repoCount = profile.public_repos || repos.length;
      const followerCount = profile.followers || 0;
      const topLanguage = getTopLanguage(repos);

      return [
        { icon: '📦', value: formatNumber(repoCount), label: 'Repositories' },
        { icon: '⭐', value: formatNumber(totalStars), label: 'Stars Earned' },
        { icon: '⑂', value: formatNumber(totalForks), label: 'Forks' },
        { icon: '👥', value: formatNumber(followerCount), label: 'Followers' },
        { icon: '🔤', value: topLanguage || '—', label: 'Top Language' }
      ];
    };

    const createStatCard = (metric, index) => {
      const card = document.createElement('div');
      card.className = 'github-stat-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'figure');
      card.setAttribute('aria-label', `${metric.value} ${metric.label}`);
      card.style.transitionDelay = `${index * 0.08}s`;

      const icon = document.createElement('span');
      icon.className = 'github-stat-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = metric.icon;

      const value = document.createElement('div');
      value.className = 'github-stat-value';
      value.textContent = metric.value;

      const label = document.createElement('div');
      label.className = 'github-stat-label';
      label.textContent = metric.label;

      card.appendChild(icon);
      card.appendChild(value);
      card.appendChild(label);

      return card;
    };

    const renderGitHubStats = (metrics) => {
      githubStatsEl.innerHTML = '';
      const fragment = document.createDocumentFragment();
      metrics.forEach((metric, index) => {
        fragment.appendChild(createStatCard(metric, index));
      });
      githubStatsEl.appendChild(fragment);
      requestAnimationFrame(() => {
        githubStatsEl.querySelectorAll('.github-stat-card').forEach(card => {
          card.style.opacity = '1';
        });
      });
    };

    const showGitHubLoading = () => {
      if (githubLoadingEl) githubLoadingEl.hidden = false;
      githubStatsEl.innerHTML = '';
      if (githubErrorEl) githubErrorEl.hidden = true;
      if (githubUpdatedEl) githubUpdatedEl.textContent = '';
      if (githubSubtitleEl) githubSubtitleEl.textContent = '';
    };

    const showGitHubError = () => {
      if (githubLoadingEl) githubLoadingEl.hidden = true;
      if (githubErrorEl) githubErrorEl.hidden = false;
      if (githubUpdatedEl) githubUpdatedEl.textContent = '';
    };

    const showGitHubUpdated = () => {
      if (!githubUpdatedEl) return;
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      githubUpdatedEl.textContent = `Last updated: ${dateStr} at ${timeStr}`;
    };

    const getFallbackMetrics = () => {
      return [
        { icon: '📦', value: '25', label: 'Repositories' },
        { icon: '⭐', value: '12', label: 'Stars Earned' },
        { icon: '⑂', value: '8', label: 'Forks' },
        { icon: '👥', value: '8', label: 'Followers' },
        { icon: '🔤', value: 'JavaScript', label: 'Top Language' }
      ];
    };

    // Retry handler
    if (githubRetryBtn) {
      githubRetryBtn.addEventListener('click', () => {
        this.loadGitHubStats();
      });
    }

    // Main loading logic
    showGitHubLoading();

    try {
      const [profile, repos] = await Promise.all([
        fetchGitHubProfile(GITHUB_USERNAME),
        fetchGitHubRepos(GITHUB_USERNAME)
      ]);

      const metrics = calculateGitHubMetrics(profile, repos);

      if (githubLoadingEl) githubLoadingEl.hidden = true;
      renderGitHubStats(metrics);
      showGitHubUpdated();

      if (githubSubtitleEl && profile.bio) {
        githubSubtitleEl.textContent = profile.bio;
      } else if (githubSubtitleEl) {
        githubSubtitleEl.textContent = `${GITHUB_USERNAME} on GitHub`;
      }

    } catch (error) {
      console.warn('GitHub stats fetch failed:', error.message);
      showGitHubError();

      setTimeout(() => {
        if (githubErrorEl) githubErrorEl.hidden = true;
        if (githubLoadingEl) githubLoadingEl.hidden = true;
        renderGitHubStats(getFallbackMetrics());
        if (githubUpdatedEl) githubUpdatedEl.textContent = 'Showing estimated metrics';
      }, 1500);
    }
  }

  // ===== SETTINGS =====
  async loadSettings() {
    try {
      const data = await api.getSettings();
      if (data.success && data.settings) { 
        this.settings = data.settings; 
        this.applySettings(data.settings); 
      }
    } catch (error) { 
      console.log('Using default settings'); 
    }
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
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending...';
      try {
        const result = await api.sendContactMessage({
          name: form.querySelector('#name').value,
          email: form.querySelector('#email').value,
          content: form.querySelector('#message').value
        });
        if (result.success) { 
          alert('Message sent! 🎉'); 
          form.reset(); 
        }
      } catch (error) { 
        alert('Failed to send. Try again.'); 
      }
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
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
      el.addEventListener('mouseleave', () => { 
        el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)'; 
      });
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

  useFallbackContent() { 
    console.log('Using static fallback content'); 
  }
}

// ===== UTILITIES (outside class — used by experience renderer) =====
function escapeHTML(str) {
  if (!str && str !== 0) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function formatDate(dateStr, fallback) {
  if (!dateStr) return escapeHTML(fallback || '—');
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return escapeHTML(fallback || '—');
    return escapeHTML(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  } catch (e) {
    return escapeHTML(fallback || '—');
  }
}

// ===== LUXURY CINEMATIC EXPERIENCE — STANDALONE FUNCTIONS =====
let luxuryObserver = null;

function disconnectLuxuryObserver() {
  if (luxuryObserver) {
    luxuryObserver.disconnect();
    luxuryObserver = null;
  }
}

function observeLuxuryElements() {
  disconnectLuxuryObserver();
  luxuryObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        luxuryObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  const selectors = [
    '.exp-intro-eyebrow',
    '.exp-intro-headline',
    '.exp-intro-line',
    '.exp-intro-sub',
    '.exp-showcase-item',
    '.exp-impact-headline',
    '.exp-impact-card',
    '.exp-prestige-headline',
    '.exp-prestige-card'
  ];

  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => luxuryObserver.observe(el));
  });
}

function renderWorkExperience(workExp) {
  if (!workExp || workExp.length === 0) return '';

  return workExp.map((exp, i) => {
    const endDate = exp.current ? 'Present' : formatDate(exp.endDate, 'Present');
    const startDate = formatDate(exp.startDate, '');
    const color = escapeHTML(exp.color || '#FF6B00');
    const iconBg = color + '15';
    const title = escapeHTML(exp.title || 'Untitled Role');
    const organization = escapeHTML(exp.organization || '');
    const description = escapeHTML(exp.description || '');
    const hasAchievements = exp.achievements && exp.achievements.length > 0;
    const hasSkills = exp.skills && exp.skills.length > 0;

    let skillsHTML = '';
    if (hasSkills) {
      skillsHTML = '<div class="exp-showcase-skills">' +
        exp.skills.map(s => '<span class="exp-showcase-skill">' + escapeHTML(s) + '</span>').join('') +
        '</div>';
    }

    let achievementsHTML = '';
    if (hasAchievements) {
      achievementsHTML =
        '<div class="exp-showcase-label">Achievements</div>' +
        '<ul class="exp-showcase-achievements" role="list">' +
        exp.achievements.map(a => '<li>' + escapeHTML(a) + '</li>').join('') +
        '</ul>';
    }

    return `
      <div class="exp-showcase-item" style="transition-delay:${i * 0.08}s" role="article" aria-label="Experience: ${title}${organization ? ' at ' + organization : ''}">
        <div class="exp-showcase-visual">
          <div class="exp-showcase-frame" tabindex="0" aria-label="${title}${organization ? ' at ' + organization : ''}">
            <div class="exp-showcase-icon" style="background:${iconBg};color:${color};" aria-hidden="true">💼</div>
            <div class="exp-showcase-org">${startDate} — ${endDate}</div>
            <h3 class="exp-showcase-role">${title}</h3>
            ${organization ? '<p class="exp-showcase-company">' + organization + '</p>' : ''}
            ${description ? '<p class="exp-showcase-desc">' + description + '</p>' : ''}
            ${skillsHTML}
          </div>
        </div>
        <div class="exp-showcase-text">
          ${achievementsHTML}
        </div>
      </div>
    `;
  }).join('');
}

function renderImpactMetrics(workExp) {
  let totalYears = '3+';
  if (workExp && workExp.length > 0) {
    const firstExp = workExp[workExp.length - 1];
    if (firstExp && firstExp.startDate) {
      try {
        const startYear = new Date(firstExp.startDate).getFullYear();
        if (!isNaN(startYear)) {
          totalYears = Math.max(1, new Date().getFullYear() - startYear) + '+';
        }
      } catch (e) { /* keep default */ }
    }
  }

  const metrics = [
    { icon: '📅', value: totalYears, label: 'Years Experience' },
    { icon: '🚀', value: (workExp ? workExp.length + 3 : 6) + '+', label: 'Projects Built' },
    { icon: '⚡', value: '15+', label: 'Technologies' },
    { icon: '📜', value: '2', label: 'Certifications' }
  ];

  return metrics.map((m, i) => `
    <div class="exp-impact-card" style="transition-delay:${i * 0.08}s" role="figure" aria-label="${escapeHTML(m.value)} ${escapeHTML(m.label)}">
      <div class="exp-impact-icon" aria-hidden="true">${escapeHTML(m.icon)}</div>
      <div class="exp-impact-value">${escapeHTML(m.value)}</div>
      <div class="exp-impact-label">${escapeHTML(m.label)}</div>
    </div>
  `).join('');
}

function renderEducation(eduExp) {
  if (!eduExp || eduExp.length === 0) return '';

  return eduExp.map((exp, i) => {
    const title = escapeHTML(exp.title || 'Untitled Degree');
    const organization = escapeHTML(exp.organization || '');
    const description = escapeHTML(exp.description || '');

    return `
      <div class="exp-prestige-card" style="transition-delay:${i * 0.1}s" role="article" aria-label="Education: ${title}${organization ? ' at ' + organization : ''}">
        <div class="exp-prestige-icon" aria-hidden="true">🎓</div>
        <h4 class="exp-prestige-degree">${title}</h4>
        ${organization ? '<p class="exp-prestige-school">' + organization + '</p>' : ''}
        ${description ? '<p class="exp-prestige-desc">' + description + '</p>' : ''}
      </div>
    `;
  }).join('');
}

function buildLuxuryExperience(experiences) {
  if (!experiences || experiences.length === 0) return;

  const workExp = experiences.filter(e => e && e.type === 'work');
  const eduExp = experiences.filter(e => e && e.type === 'education');

  const showcase = document.getElementById('expShowcase');
  const impactGrid = document.getElementById('expImpactGrid');
  const prestigeGrid = document.getElementById('expPrestigeGrid');

  if (showcase) {
    showcase.innerHTML = renderWorkExperience(workExp);
  }

  if (impactGrid) {
    impactGrid.innerHTML = renderImpactMetrics(workExp);
  }

  if (prestigeGrid) {
    prestigeGrid.innerHTML = renderEducation(eduExp);
  }

  observeLuxuryElements();
}

// ===== EVENT DELEGATION FOR FRAME MOUSEMOVE =====
document.addEventListener('mousemove', function(e) {
  const frame = e.target.closest('.exp-showcase-frame');
  if (!frame) return;
  const rect = frame.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  frame.style.setProperty('--mouse-x', x + 'px');
  frame.style.setProperty('--mouse-y', y + 'px');
}, { passive: true });

// ===== INITIALIZE =====
document.addEventListener('DOMContentLoaded', () => {
  window.portfolioApp = new PortfolioApp();
});
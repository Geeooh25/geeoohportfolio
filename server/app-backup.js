(function() {
  // ========== HAMBURGER MENU ==========
  const hamburger = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('navbar');
  const overlay = document.getElementById('overlay');
  const body = document.body;
  const menuLinks = nav ? nav.querySelectorAll('a') : [];

  function toggleMenu(force) {
    if (!nav) return;
    const isOpen = force !== undefined ? force : !nav.classList.contains('open');
    nav.classList.toggle('open', isOpen);
    if (overlay) overlay.classList.toggle('active', isOpen);
    body.classList.toggle('menu-open', isOpen);
    if (hamburger) hamburger.setAttribute('aria-expanded', isOpen);
  }

  if (hamburger) hamburger.addEventListener('click', () => toggleMenu());
  if (overlay) overlay.addEventListener('click', () => toggleMenu(false));
  menuLinks.forEach(l => l.addEventListener('click', () => toggleMenu(false)));

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && nav && nav.classList.contains('open')) {
      toggleMenu(false);
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav && nav.classList.contains('open')) toggleMenu(false);
  });

  // ========== DARK MODE TOGGLE ==========
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
      const isDark = document.body.classList.contains('dark-theme');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // ========== TYPEWRITER EFFECT ==========
  const titles = ['Fullstack Developer', 'Web Developer', 'Node.js Expert', 'Problem Solver'];
  let titleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const heroTitle = document.querySelector('.hero h2');

  if (heroTitle) {
    function typeEffect() {
      const currentTitle = titles[titleIndex];
      
      if (isDeleting) {
        heroTitle.textContent = currentTitle.substring(0, charIndex - 1);
        charIndex--;
      } else {
        heroTitle.textContent = currentTitle.substring(0, charIndex + 1);
        charIndex++;
      }
      
      if (!isDeleting && charIndex === currentTitle.length) {
        isDeleting = true;
        setTimeout(typeEffect, 2000);
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        titleIndex = (titleIndex + 1) % titles.length;
        setTimeout(typeEffect, 500);
      } else {
        setTimeout(typeEffect, isDeleting ? 50 : 100);
      }
    }
    
    setTimeout(typeEffect, 1000);
  }

  // ========== SCROLL PROGRESS BAR ==========
  const scrollProgress = document.createElement('div');
  scrollProgress.className = 'scroll-progress';
  document.body.appendChild(scrollProgress);

  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = (winScroll / height) * 100;
    scrollProgress.style.width = scrolled + '%';
  });

  // ========== REVEAL ON SCROLL ANIMATION ==========
  const revealElements = document.querySelectorAll(
    '.section, .project-card, .skill-item, .work-card, .education-card, .achievement-card, .testimonial-card, .contact-form, .contact-info-side, .stat-card'
  );

  revealElements.forEach(el => {
    el.classList.add('reveal');
  });

  document.querySelectorAll('.project-card').forEach((el, index) => {
    el.style.setProperty('--card-index', index);
  });

  document.querySelectorAll('.skill-item').forEach((el, index) => {
    el.style.setProperty('--card-index', index);
  });

  document.querySelectorAll('.work-card').forEach((el, index) => {
    el.style.setProperty('--card-index', index);
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { 
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ========== LOAD PROJECTS FROM JSON FILE ==========
  let projectCardsArray = [];

  async function loadProjects() {
    try {
      const response = await fetch('./data/projects.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.projects || [];
    } catch (error) {
      console.error('Error loading projects:', error);
      return [];
    }
  }

  // Render projects dynamically
  async function renderProjects() {
    const projects = await loadProjects();
    const projectGrid = document.querySelector('.project-grid');
    
    if (!projectGrid) return;
    
    if (!projects || projects.length === 0) {
      projectGrid.innerHTML = '<div style="text-align: center; padding: 50px;">No projects found. Check back soon!</div>';
      return;
    }
    
    projectGrid.innerHTML = projects.map(project => `
      <div class="project-card" data-category="${project.category || ''}">
        <div class="project-image-wrapper">
          <img src="${project.image || './IMAGE/placeholder.png'}" alt="${project.title}" loading="lazy" />
          <div class="project-overlay">
            <div class="project-stats">
              <span>⭐ ${project.stars || 0} stars</span>
              <span>⑂ ${project.forks || 0} forks</span>
            </div>
          </div>
        </div>
        <h3>${escapeHtml(project.title)}</h3>
        <div class="tech-tags">
          ${(project.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}
        </div>
        <p>
          <ul>
            ${(project.features || []).map(feature => `<li>${escapeHtml(feature)}</li>`).join('')}
          </ul>
        </p>
        <div class="project-links">
          <a href="${project.liveLink || '#'}" target="_blank" rel="noopener" class="live-link">
            <svg viewBox="0 0 16 16"><path d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"/><path d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"/></svg>
            Live Demo
          </a>
          <a href="${project.githubLink || '#'}" target="_blank" rel="noopener" class="github-link">
            <svg viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
            GitHub
          </a>
        </div>
      </div>
    `).join('');
    
    // Update projectCardsArray and filter counts
    projectCardsArray = document.querySelectorAll('.project-card');
    updateFilterCountsFromDOM();
    setupFilterListeners();
  }

  // Helper function to escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Update filter counts from DOM elements
  function updateFilterCountsFromDOM() {
    const cards = document.querySelectorAll('.project-card');
    
    const counts = {
      all: cards.length,
      javascript: 0,
      node: 0,
      mongodb: 0
    };
    
    cards.forEach(card => {
      const category = card.dataset.category || '';
      if (category.includes('javascript')) counts.javascript++;
      if (category.includes('node')) counts.node++;
      if (category.includes('mongodb')) counts.mongodb++;
    });
    
    const allBtn = document.querySelector('[data-filter="all"] .filter-count');
    const jsBtn = document.querySelector('[data-filter="javascript"] .filter-count');
    const nodeBtn = document.querySelector('[data-filter="node"] .filter-count');
    const mongoBtn = document.querySelector('[data-filter="mongodb"] .filter-count');
    
    if (allBtn) allBtn.textContent = counts.all;
    if (jsBtn) jsBtn.textContent = counts.javascript;
    if (nodeBtn) nodeBtn.textContent = counts.node;
    if (mongoBtn) mongoBtn.textContent = counts.mongodb;
  }

  // Setup filter button listeners
  function setupFilterListeners() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterBtns.forEach(btn => {
      // Remove existing listeners to avoid duplicates
      btn.removeEventListener('click', btn._listener);
      
      const listener = function() {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const filter = this.dataset.filter;
        
        projectCards.forEach(card => {
          const categories = card.dataset.category || '';
          
          if (filter === 'all' || categories.includes(filter)) {
            card.style.display = 'block';
            setTimeout(() => {
              card.style.opacity = '1';
              card.style.transform = 'scale(1)';
            }, 10);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
              card.style.display = 'none';
            }, 300);
          }
        });
      };
      
      btn.addEventListener('click', listener);
      btn._listener = listener;
    });
    
    projectCards.forEach(card => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });
  }

  // Initialize projects
  renderProjects();

  // ========== TESTIMONIAL CAROUSEL ==========
  const track = document.getElementById('testimonialTrack');
  const testimonialCards = document.querySelectorAll('.testimonial-card');
  const prevBtn = document.getElementById('prevTestimonial');
  const nextBtn = document.getElementById('nextTestimonial');
  const dots = document.querySelectorAll('.dot');
  let currentIndex = 0;
  let autoPlayInterval;

  function updateCarousel() {
    if (track) {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
    }
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function nextSlide() {
    if (testimonialCards.length === 0) return;
    currentIndex = (currentIndex + 1) % testimonialCards.length;
    updateCarousel();
  }

  function prevSlide() {
    if (testimonialCards.length === 0) return;
    currentIndex = (currentIndex - 1 + testimonialCards.length) % testimonialCards.length;
    updateCarousel();
  }

  function startAutoPlay() {
    if (testimonialCards.length <= 1) return;
    autoPlayInterval = setInterval(nextSlide, 5000);
  }

  function resetAutoPlay() {
    clearInterval(autoPlayInterval);
    startAutoPlay();
  }

  if (prevBtn && nextBtn && testimonialCards.length > 0) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      resetAutoPlay();
    });
    
    nextBtn.addEventListener('click', () => {
      nextSlide();
      resetAutoPlay();
    });
    
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
        resetAutoPlay();
      });
    });
    
    startAutoPlay();
    
    const carousel = document.querySelector('.testimonials-carousel');
    if (carousel) {
      carousel.addEventListener('mouseenter', () => {
        clearInterval(autoPlayInterval);
      });
      
      carousel.addEventListener('mouseleave', () => {
        startAutoPlay();
      });
    }
  }

  // Swipe support for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  if (track) {
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const swipeThreshold = 50;
      const difference = touchStartX - touchEndX;
      
      if (Math.abs(difference) > swipeThreshold) {
        if (difference > 0) {
          nextSlide();
        } else {
          prevSlide();
        }
        resetAutoPlay();
      }
    });
  }

  // ========== COUNT UP ANIMATION FOR STATS ==========
  const statNumbers = document.querySelectorAll('.stat-number');

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        if (isNaN(target)) return;
        
        let count = 0;
        const duration = 2000;
        const interval = 20;
        const steps = duration / interval;
        const increment = target / steps;
        
        const updateCount = () => {
          count += increment;
          if (count < target) {
            el.textContent = Math.floor(count);
            setTimeout(updateCount, interval);
          } else {
            el.textContent = target;
          }
        };
        
        updateCount();
        countObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => countObserver.observe(el));

  // ========== RESUME DOWNLOAD TRACKER ==========
  const resumeBtn = document.querySelector('.resume-btn');
  if (resumeBtn) {
    let downloadCount = localStorage.getItem('resumeDownloads') || 0;

    resumeBtn.addEventListener('click', function() {
      downloadCount++;
      localStorage.setItem('resumeDownloads', downloadCount);
      
      const toast = document.createElement('div');
      toast.textContent = `Thanks for downloading! (${downloadCount} total downloads)`;
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        font-size: 14px;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideUp 0.3s ease, fadeOut 0.3s ease 2.7s forwards;
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.remove();
      }, 3000);
    });
  }

  // ========== LAZY LOADING FOR IMAGES ==========
  const lazyImages = document.querySelectorAll('img:not([loading="lazy"])');
  lazyImages.forEach(img => {
    img.setAttribute('loading', 'lazy');
  });

  // ========== FORM VALIDATION ==========
  window.validateForm = function() {
    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');
    const messageInput = document.querySelector('textarea[name="message"]');
    
    if (!nameInput || !emailInput || !messageInput) return true;
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!name || !email || !message) {
      alert('Please fill all fields');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      alert('Please enter a valid email address');
      return false;
    }

    const spinner = document.getElementById('formSpinner');
    const submitBtn = document.getElementById('submitBtn');
    if (spinner) spinner.style.display = 'block';
    if (submitBtn) submitBtn.disabled = true;
    return true;
  };

  // ========== SMOOTH SCROLL ==========
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        if (nav && nav.classList.contains('open')) toggleMenu(false);
      }
    });
  });

  // ========== ACTIVE NAVIGATION HIGHLIGHT ==========
  const sections = document.querySelectorAll('section[id]');
  
  function highlightNavigation() {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 100;
      const sectionId = section.getAttribute('id');
      
      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        const activeLink = document.querySelector(`.navigation a[href*="${sectionId}"]`);
        if (activeLink) activeLink.classList.add('active');
      } else {
        const inactiveLink = document.querySelector(`.navigation a[href*="${sectionId}"]`);
        if (inactiveLink) inactiveLink.classList.remove('active');
      }
    });
  }

 // Always sticky - never goes away
(function() {
  const heading = document.querySelector('.heading');
  if (!heading) return;
  
  heading.style.position = 'fixed';
  heading.style.top = '0';
  heading.style.left = '0';
  heading.style.right = '0';
  heading.style.zIndex = '9999';
  heading.style.width = '100%';
  heading.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  
  // Add padding to body to prevent content hiding
  document.body.style.paddingTop = heading.offsetHeight + 'px';
})();
  window.addEventListener('scroll', highlightNavigation);
})();
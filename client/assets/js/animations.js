// ===== ANIMATION CONTROLLER =====
class AnimationController {
  constructor() {
    this.observer = null;
    this.animatedElements = new Set();
    this.init();
  }

  init() {
    // Initialize Intersection Observer for scroll animations
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Observe all reveal elements
    this.observeElements();

    // Initialize scroll progress
    this.initScrollProgress();

    // Initialize back to top button
    this.initBackToTop();

    // Initialize smooth scroll
    this.initSmoothScroll();

    // Initialize counter animations
    this.initCounters();

    // Initialize parallax
    this.initParallax();

    // NOTE: Loading screen is handled by loading.js - DO NOT add initLoadingScreen here
  }

  observeElements() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    revealElements.forEach((el, index) => {
      // Add stagger delay
      if (!el.style.transitionDelay) {
        el.style.transitionDelay = `${index * 0.1}s`;
      }
      this.observer.observe(el);
    });
  }

  initScrollProgress() {
    const progressBar = document.getElementById('scrollProgress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
      const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / windowHeight) * 100;
      progressBar.style.width = `${scrolled}%`;
    });
  }

  initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', () => {
      if (window.scrollY > 500) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  initCounters() {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const counter = entry.target;
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const start = parseInt(counter.textContent) || 0;
            const increment = (target - start) / (duration / 16);
            let current = start;

            const updateCounter = () => {
              current += increment;
              if (
                (increment > 0 && current >= target) ||
                (increment < 0 && current <= target)
              ) {
                counter.textContent = target;
                return;
              }
              counter.textContent = Math.round(current);
              requestAnimationFrame(updateCounter);
            };

            updateCounter();
            counterObserver.unobserve(counter);
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('.stat-number[data-target]').forEach(counter => {
      counterObserver.observe(counter);
    });
  }

  initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax-layer');
    
    window.addEventListener('scroll', () => {
      parallaxElements.forEach(element => {
        const speed = element.getAttribute('data-speed') || 0.5;
        const yPos = -(window.scrollY * speed);
        element.style.transform = `translate3d(0, ${yPos}px, 0)`;
      });
    });
  }

  // Utility: Animate element
  animate(element, keyframes, options = {}) {
    return element.animate(keyframes, {
      duration: options.duration || 500,
      easing: options.easing || 'ease',
      fill: 'forwards',
      ...options
    });
  }

  // Utility: Add stagger animation
  staggerAnimation(container, selector, delay = 0.1) {
    const elements = container.querySelectorAll(selector);
    elements.forEach((el, index) => {
      el.style.animationDelay = `${index * delay}s`;
      el.classList.add('animate');
    });
  }
}

// Initialize animations AFTER DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.animations = new AnimationController();
});

// Re-observe elements when content is dynamically loaded
window.addEventListener('content-loaded', () => {
  if (window.animations) {
    window.animations.observeElements();
  }
});
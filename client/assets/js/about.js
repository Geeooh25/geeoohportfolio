// ===== THE MIND BEHIND THE WORK — SCROLL ANIMATIONS =====
(function() {
  const phases = document.querySelectorAll('.about-phase');
  const imageWrapper = document.getElementById('aboutImageWrapper');
  const imageReveal = document.getElementById('aboutImageReveal');
  const signatureLine = document.getElementById('aboutSignatureLine');
  
  if (!phases.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const phase = entry.target;
        phase.classList.add('visible');
        
        const phaseNum = phase.getAttribute('data-phase');
        if (imageWrapper && phaseNum) {
          imageWrapper.setAttribute('data-phase', phaseNum);
        }
        
        if (phaseNum === '04' && signatureLine) {
          setTimeout(() => {
            signatureLine.classList.add('visible');
            if (imageWrapper) imageWrapper.classList.add('phase-4-active');
          }, 1200);
        }
        
        observer.unobserve(phase);
      }
    });
  }, {
    threshold: 0.3,
    rootMargin: '0px 0px -50px 0px'
  });
  
  phases.forEach(phase => observer.observe(phase));
  
  // Image hover easter egg (Phase 4 only)
  let hoverTimeout;
  if (imageWrapper && imageReveal) {
    imageWrapper.addEventListener('mouseenter', () => {
      if (imageWrapper.classList.contains('phase-4-active')) {
        hoverTimeout = setTimeout(() => {
          imageReveal.classList.add('show');
        }, 3000);
      }
    });
    
    imageWrapper.addEventListener('mouseleave', () => {
      clearTimeout(hoverTimeout);
      imageReveal.classList.remove('show');
    });
  }
})();
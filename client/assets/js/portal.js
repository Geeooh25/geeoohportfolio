// ===========================================
// THE IDENTITY REVEAL
// Cinematic · Luxurious · Intentional
// ===========================================

class IdentityReveal {
  constructor() {
    this.wrapper = document.getElementById('profilePortal');
    this.photo = document.getElementById('portalPhotoContainer');
    this.ring = document.getElementById('portalRing');
    this.hint = document.getElementById('portalHint');
    this.heroText = document.querySelector('.hero-text');
    
    this.isRevealed = false;
    this.ambient = null;
    this.revealPanel = null;
    this.indicators = [];
    
    this.stats = [
      { value: '3+', label: 'Years Experience' },
      { value: '6+', label: 'Projects Delivered' },
      { value: '15+', label: 'Technologies' },
      { value: '1.2K+', label: 'Contributions' }
    ];
    
    this.init();
  }

  init() {
    if (!this.wrapper) return;
    
    this.createAmbientGlow();
    this.createRevealPanel();
    this.createIndicators();
    
    this.photo.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });
  }

  createAmbientGlow() {
    this.ambient = document.createElement('div');
    this.ambient.className = 'id-ambient';
    this.wrapper.appendChild(this.ambient);
  }

  createRevealPanel() {
    this.revealPanel = document.createElement('div');
    this.revealPanel.className = 'id-reveal';
    
    let statsHTML = '';
    this.stats.forEach((stat, i) => {
      statsHTML += `
        <div class="id-stat" style="transition-delay:${0.5 + i * 0.12}s">
          <div class="id-stat-value">${stat.value}</div>
          <div class="id-stat-label">${stat.label}</div>
        </div>
      `;
    });
    
    this.revealPanel.innerHTML = `
      <div class="id-reveal-inner">
        ${statsHTML}
        <div class="id-philosophy">
          Building premium digital experiences through clean code and thoughtful design.
        </div>
      </div>
    `;
    
    this.wrapper.appendChild(this.revealPanel);
  }

  createIndicators() {
    const indicators = [
      { text: 'Node.js', cls: 'node' },
      { text: 'MongoDB', cls: 'mongo' },
      { text: 'React', cls: 'react' }
    ];
    
    indicators.forEach(ind => {
      const el = document.createElement('div');
      el.className = `id-indicator ${ind.cls}`;
      el.textContent = ind.text;
      this.wrapper.appendChild(el);
      this.indicators.push(el);
    });
  }

  reveal() {
    this.isRevealed = true;
    
    // Ambient glow expands
    this.ambient.classList.add('active');
    
    // Ring activates
    this.ring.classList.add('active');
    
    // Photo rotates in 3D
    this.photo.classList.add('revealing');
    
    // Dim hero text
    if (this.heroText) {
      this.heroText.classList.add('id-dimmed');
    }
    
    // Update hint
    this.hint.classList.add('hidden');
    setTimeout(() => {
      this.hint.textContent = 'Click to close';
      this.hint.classList.remove('hidden');
    }, 300);
    
    // Show reveal panel with stats
    setTimeout(() => {
      this.revealPanel.classList.add('visible');
      
      // Animate stats in sequence
      setTimeout(() => {
        this.revealPanel.querySelectorAll('.id-stat').forEach(s => {
          s.classList.add('show');
        });
      }, 200);
      
      // Show philosophy quote last
      setTimeout(() => {
        const philosophy = this.revealPanel.querySelector('.id-philosophy');
        if (philosophy) philosophy.classList.add('show');
      }, 800);
    }, 400);
    
    // Show floating tech indicators
    this.indicators.forEach((ind, i) => {
      setTimeout(() => {
        ind.classList.add('show');
      }, 600 + i * 150);
    });
  }

  hide() {
    this.isRevealed = false;
    
    // Reverse everything
    this.ambient.classList.remove('active');
    this.ring.classList.remove('active');
    this.photo.classList.remove('revealing');
    this.revealPanel.classList.remove('visible');
    
    if (this.heroText) {
      this.heroText.classList.remove('id-dimmed');
    }
    
    // Reset hint
    this.hint.classList.add('hidden');
    setTimeout(() => {
      this.hint.textContent = 'Click to reveal';
      this.hint.classList.remove('hidden');
    }, 300);
    
    // Hide stats
    this.revealPanel.querySelectorAll('.id-stat').forEach(s => {
      s.classList.remove('show');
    });
    
    // Hide philosophy
    const philosophy = this.revealPanel.querySelector('.id-philosophy');
    if (philosophy) philosophy.classList.remove('show');
    
    // Hide indicators
    this.indicators.forEach(ind => {
      ind.classList.remove('show');
    });
  }

  toggle() {
    if (this.isRevealed) {
      this.hide();
    } else {
      this.reveal();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.identityReveal = new IdentityReveal();
});
// ===== GEEOOH OS AWAKENING SEQUENCE =====
(function() {
  'use strict';
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startBoot);
  } else {
    startBoot();
  }
  
  function startBoot() {
    const bootScreen = document.getElementById('loadingScreen');
    const terminal = document.getElementById('terminalBody');
    const progressFill = document.getElementById('bootProgressFill');
    const statusText = document.getElementById('bootStatus');
    const percentText = document.getElementById('bootPercent');
    const bootGlow = document.getElementById('bootGlow');
    const bootHint = document.getElementById('bootHint');
    const terminalWindow = document.getElementById('terminalWindow');
    
    if (!bootScreen || !terminal) return;

    // Only prevent scrolling and hide hero content – header stays untouched
    document.body.classList.add('boot-active');
    document.querySelectorAll('.hero-content, .stats-grid').forEach(el => {
      el.classList.add('boot-hidden');
    });
    
    let skipped = false;
    let currentIndex = 0;
    let currentPhase = 1;
    const startTime = Date.now();
    
    createParticles();
    
    const sequence = [
      { delay: 800, html: '', phase: 1, status: 'Awakening...' },
      { delay: 600, html: '<span class="phase-label">PHASE 1 — AWAKENING</span>', phase: 1 },
      { delay: 600, html: '<span class="terminal-prompt">⟡</span> <span class="terminal-command">Initializing consciousness...</span>', phase: 1 },
      { delay: 500, html: '<span class="terminal-output">  └─ Loading curiosity .................. </span><span class="status-ok">OK</span>', phase: 1 },
      { delay: 450, html: '<span class="terminal-output">  └─ Loading empathy .................... </span><span class="status-ok">OK</span>', phase: 1 },
      { delay: 450, html: '<span class="terminal-output">  └─ Loading obsession with detail ...... </span><span class="status-ok">OK</span>', phase: 1 },
      { delay: 500, html: '<span class="terminal-output">  └─ Loading taste ...................... </span><span class="status-ok">OK</span>', phase: 1 },
      { delay: 800, html: '<span class="terminal-output highlight">Consciousness online.</span>', phase: 1 },
      { delay: 1200, html: '', phase: 1 },
      
      { delay: 800, html: '<span class="phase-label">PHASE 2 — IDENTITY COMPILATION</span>', phase: 2, status: 'Compiling identity...' },
      { delay: 600, html: '<span class="terminal-prompt">◈</span> <span class="terminal-command">Compiling identity...</span>', phase: 2 },
      { delay: 550, html: '<span class="terminal-output">  Designer ............................. </span><span class="status-ready">READY</span>', phase: 2 },
      { delay: 450, html: '<span class="terminal-output">  Developer ............................ </span><span class="status-ready">READY</span>', phase: 2 },
      { delay: 450, html: '<span class="terminal-output">  Systems Thinker ...................... </span><span class="status-ready">READY</span>', phase: 2 },
      { delay: 450, html: '<span class="terminal-output">  Storyteller .......................... </span><span class="status-ready">READY</span>', phase: 2 },
      { delay: 500, html: '<span class="terminal-output">  Problem Solver ....................... </span><span class="status-ready">READY</span>', phase: 2 },
      { delay: 700, html: '<span class="terminal-output highlight">Identity compiled. Integrity: 100%</span>', phase: 2 },
      { delay: 1200, html: '', phase: 2 },
      
      { delay: 800, html: '<span class="phase-label">PHASE 3 — PURPOSE DISCOVERY</span>', phase: 3, status: 'Discovering purpose...' },
      { delay: 600, html: '<span class="terminal-prompt">◉</span> <span class="terminal-command">Searching purpose...</span>', phase: 3 },
      { delay: 500, html: '<span class="terminal-output">  └─ Money .............................. </span><span class="status-not-found">NOT FOUND</span>', phase: 3 },
      { delay: 450, html: '<span class="terminal-output">  └─ Fame ............................... </span><span class="status-not-found">NOT FOUND</span>', phase: 3 },
      { delay: 550, html: '<span class="terminal-output">  └─ Building things people remember ... </span><span class="status-found">FOUND</span>', phase: 3 },
      { delay: 700, html: '<span class="terminal-output highlight">Purpose located. Locked.</span>', phase: 3 },
      { delay: 1200, html: '', phase: 3 },
      
      { delay: 800, html: '<span class="phase-label">PHASE 4 — REALITY SHIFT</span>', phase: 4, status: 'Shifting reality...' },
      { delay: 600, html: '<span class="terminal-prompt">◈</span> <span class="terminal-command">Initializing experience...</span>', phase: 4 },
      { delay: 450, html: '<span class="terminal-output">  └─ Preparing environment .............. </span><span class="status-done">DONE</span>', phase: 4 },
      { delay: 450, html: '<span class="terminal-output">  └─ Calibrating attention to detail .... </span><span class="status-done">DONE</span>', phase: 4 },
      { delay: 450, html: '<span class="terminal-output">  └─ Loading personal obsession ......... </span><span class="status-done">DONE</span>', phase: 4 },
      { delay: 500, html: '<span class="terminal-output">  └─ Removing ego from equation ......... </span><span class="status-done">DONE</span>', phase: 4 },
      { delay: 700, html: '<span class="terminal-output highlight">Reality ready.</span>', phase: 4 },
      
      { delay: 1500, html: '<div style="height:20px"></div>', phase: 5, status: '...' },
      
      { delay: 400, html: '<div class="signature-reveal"><div class="signature-name">G E E O O H</div><div class="signature-tagline">Welcome to Geeooh\'s world.</div></div>', phase: 5, status: 'Ready' },
    ];
    
    const totalSteps = sequence.length;
    
    function updatePhase(phase) {
      if (currentPhase === phase) return;
      currentPhase = phase;
      bootScreen.classList.remove('phase-1', 'phase-2', 'phase-3', 'phase-4', 'phase-5');
      if (bootGlow) bootGlow.classList.remove('phase-1', 'phase-2', 'phase-3', 'phase-4', 'phase-5');
      bootScreen.classList.add('phase-' + phase);
      if (bootGlow && phase >= 2) bootGlow.classList.add('phase-' + phase);
    }
    
    function showNext() {
      if (skipped || currentIndex >= sequence.length) return;
      const step = sequence[currentIndex];
      if (step.phase) updatePhase(step.phase);
      if (step.status && statusText) statusText.textContent = step.status;
      if (step.html) {
        const div = document.createElement('div');
        div.className = 'terminal-line';
        div.innerHTML = step.html;
        terminal.appendChild(div);
        terminal.scrollTop = terminal.scrollHeight;
      }
      currentIndex++;
      const percent = Math.floor((currentIndex / totalSteps) * 100);
      if (progressFill) progressFill.style.width = percent + '%';
      if (percentText) percentText.textContent = percent + '%';
      if (currentIndex < sequence.length) {
        setTimeout(showNext, step.delay);
      } else {
        finishBoot();
      }
    }
    
    function finishBoot() {
      if (progressFill) progressFill.style.width = '100%';
      if (percentText) percentText.textContent = '100%';
      if (statusText) statusText.textContent = 'Ready';
      setTimeout(transitionToPortfolio, 2500);
    }
    
    function transitionToPortfolio() {
      if (terminalWindow) {
        terminalWindow.style.borderColor = 'rgba(255,107,0,0.3)';
        terminalWindow.style.boxShadow = '0 0 80px rgba(255,107,0,0.2)';
      }
      setTimeout(() => {
        bootScreen.style.opacity = '0';
        bootScreen.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        document.body.classList.remove('boot-active');
        document.querySelectorAll('.boot-hidden').forEach(el => el.classList.remove('boot-hidden'));
        setTimeout(() => {
          if (bootScreen.parentNode) bootScreen.parentNode.removeChild(bootScreen);
        }, 800);
      }, 400);
    }
    
    function skipAll() {
      if (skipped) return;
      skipped = true;
      if (progressFill) progressFill.style.width = '100%';
      if (percentText) percentText.textContent = '100%';
      if (statusText) statusText.textContent = 'Ready';
      terminal.innerHTML = '<div class="signature-reveal"><div class="signature-name">G E E O O H</div><div class="signature-tagline">He already thought about you.</div></div>';
      terminal.scrollTop = terminal.scrollHeight;
      setTimeout(() => {
        bootScreen.style.opacity = '0';
        bootScreen.style.transition = 'opacity 0.5s ease';
        document.body.classList.remove('boot-active');
        document.querySelectorAll('.boot-hidden').forEach(el => el.classList.remove('boot-hidden'));
        setTimeout(() => {
          if (bootScreen.parentNode) bootScreen.parentNode.removeChild(bootScreen);
        }, 500);
      }, 800);
    }
    
    function createParticles() {
      const container = document.getElementById('bootParticles');
      if (!container) return;
      for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'boot-particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (6 + Math.random() * 10) + 's';
        particle.style.width = (1 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
      }
    }
    
    if (bootHint) bootHint.addEventListener('click', e => { e.stopPropagation(); skipAll(); });
    document.addEventListener('click', e => { if (e.target !== bootHint && Date.now() - startTime > 2000) skipAll(); });
    document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && Date.now() - startTime > 2000) { e.preventDefault(); skipAll(); } });
    
    if (progressFill) progressFill.style.width = '0%';
    if (percentText) percentText.textContent = '0%';
    if (statusText) statusText.textContent = 'Awakening...';
    setTimeout(showNext, 600);
  }
})();
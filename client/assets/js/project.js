// ===== PRODUCT MUSEUM — PROJECT DATA =====
const museumProjects = [
  {
    year: "2023",
    hook: "Built to replace messy team workflows.",
    title: "TaskFlow",
    impact: "1,200+ active users",
    impactIcon: "users",
    image: "./assets/images/projects/taskflow.jpg",
    voice: "My favorite part was designing the real-time sync engine.",
    tech: ["React", "Node.js", "Socket.IO", "MongoDB"],
    caseStudy: {
      challenge: "Teams were juggling 4+ tools with no single source of truth.",
      solution: "Built a unified workspace with real-time collaboration and indexed search.",
      impact: "70% faster task retrieval. Zero data loss across sessions.",
      personalNote: "The hardest problem was keeping state synchronized when multiple users edited the same task simultaneously."
    },
    liveUrl: "#",
    githubUrl: "#"
  },
  {
    year: "2024",
    hook: "Turned a 4-second wait into 0.7 seconds.",
    title: "ShopStream",
    impact: "+42% conversion rate",
    impactIcon: "trending-up",
    image: "./assets/images/projects/shopstream.jpg",
    voice: "Performance isn't a feature. It's the foundation.",
    tech: ["Next.js", "PostgreSQL", "Redis", "Stripe"],
    caseStudy: {
      challenge: "E-commerce site with 4.2s load time and 1.8% conversion rate.",
      solution: "Implemented edge caching, lazy loading, and database query optimization.",
      impact: "Load time dropped to 0.7s. Conversion rate jumped to 2.6%.",
      personalNote: "The moment we deployed and watched the metrics shift in real-time — that's why I do this."
    },
    liveUrl: "#",
    githubUrl: "#"
  }
  // Add more projects following this structure
];

// Card HTML template
function createMuseumCard(project, index) {
  const impactIcons = {
    users: '<svg viewBox="0 0 24 24" width="12" height="12"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>',
    'trending-up': '<svg viewBox="0 0 24 24" width="12" height="12"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>'
  };
  
  return `
    <div class="gallery-card" data-index="${index}">
      <div class="gallery-card-image">
        <img src="${project.image}" alt="${project.title}" loading="lazy" />
      </div>
      <div class="gallery-card-body">
        <div class="gallery-card-hook">${project.hook}</div>
        <h3 class="gallery-card-title">${project.title}</h3>
        <div class="gallery-card-impact">
          ${impactIcons[project.impactIcon] || ''}
          ${project.impact}
        </div>
        <p class="gallery-card-voice">"${project.voice}"</p>
        <div class="gallery-card-tech">
          ${project.tech.map(t => `<span class="gallery-tech-tag">${t}</span>`).join('')}
        </div>
        <div class="gallery-card-expand">
          View case study →
        </div>
      </div>
    </div>
  `;
}// ===== PROJECT CASE STUDY — MODAL & CARD CLICK HANDLER =====
(function() {
  const overlay = document.getElementById('projectExpandOverlay');
  const content = document.getElementById('projectExpandContent');
  const closeBtn = document.getElementById('projectExpandClose');
  
  if (!overlay || !content) return;
  
  // Close modal
  function closeModal() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    content.innerHTML = '';
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }
  
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeModal();
  });
  
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closeModal();
    }
  });
  
  // Click handler for gallery cards
  document.addEventListener('click', function(e) {
    const card = e.target.closest('.gallery-card');
    if (!card) return;
    
    const projectId = card.getAttribute('data-project-id');
    if (!projectId) return;
    
    // If clicking a link inside the card, let it pass through
    if (e.target.closest('a')) return;
    
    openCaseStudy(projectId);
  });
  
  // Open case study modal
  function openCaseStudy(projectId) {
    // Show loading state
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    content.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-secondary);">
        <div style="font-size:2rem;margin-bottom:12px;">⟡</div>
        <p>Loading case study...</p>
      </div>
    `;
    
    // Fetch project data
    fetch('http://localhost:5000/api/v1/public/projects/' + projectId)
      .then(r => r.json())
      .then(d => {
        if (!d.success || !d.project) throw new Error('Not found');
        content.innerHTML = buildCaseStudyHTML(d.project);
      })
      .catch(() => {
        content.innerHTML = `
          <div style="text-align:center;padding:60px 20px;">
            <h3>Project not found</h3>
            <p style="color:var(--text-secondary);">Try again later</p>
          </div>
        `;
      });
  }
  
  // Build case study HTML (simplified for modal)
  function buildCaseStudyHTML(p) {
    const heroImg = p.images && p.images.length > 0 
      ? (p.images.find(i => i.isHero) || p.images[0]) 
      : null;
    
    return `
      ${heroImg ? `<img src="${heroImg.url}" alt="${p.title}" class="project-expand-image" />` : ''}
      <div class="project-expand-body">
        <div class="case-study-label">Case Study</div>
        <h2>${p.title}</h2>
        <p class="case-study-hook">${p.description || ''}</p>
        
        <div class="case-study-grid">
          <div class="case-study-block">
            <h4>Challenge</h4>
            <p>${p.challenges && p.challenges[0] ? p.challenges[0].problem : 'Complex problem requiring careful engineering.'}</p>
          </div>
          <div class="case-study-block">
            <h4>Solution</h4>
            <p>${p.challenges && p.challenges[0] ? p.challenges[0].solution : 'Architected a robust, scalable system.'}</p>
          </div>
          <div class="case-study-block">
            <h4>Impact</h4>
            <p>${p.results && p.results.summary ? p.results.summary : 'Delivered measurable improvements.'}</p>
          </div>
        </div>
        
        ${p.technologies ? `
        <div class="case-study-tech">
          ${p.technologies.map(t => `<span class="gallery-tech-tag">${t}</span>`).join('')}
        </div>
        ` : ''}
        
        <div class="case-study-links">
          ${p.links && p.links.live ? `<a href="${p.links.live}" target="_blank" class="btn btn-primary">🚀 Live Demo</a>` : ''}
          ${p.links && p.links.github ? `<a href="${p.links.github}" target="_blank" class="btn btn-outline">📂 Source Code</a>` : ''}
          <a href="./project-detail.html?slug=${p.slug || p._id}" class="btn btn-outline">📄 Full Case Study</a>
        </div>
      </div>
    `;
  }
  
  // Expose for gallery card rendering
  window.openProjectCaseStudy = openCaseStudy;
})();
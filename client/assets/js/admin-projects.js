/* ===========================================
   ADMIN-PROJECTS.JS — Projects CRUD
   =========================================== */
(function () {
  'use strict';

  if (!Admin.checkAuth()) return;

  let projects = [];
  let currentProjectId = null;
  let deleteTargetId = null;

  const DOM = {
    tableBody: document.getElementById('projectsTableBody'),
    search: document.getElementById('projectSearch'),
    categoryFilter: document.getElementById('categoryFilter'),
    statusFilter: document.getElementById('statusFilter'),
    addBtn: document.getElementById('addProjectBtn'),
    modal: document.getElementById('projectModal'),
    modalTitle: document.getElementById('projectModalTitle'),
    closeModal: document.getElementById('closeProjectModal'),
    cancelModal: document.getElementById('cancelProjectModal'),
    form: document.getElementById('projectForm'),
    projectId: document.getElementById('projectId'),
    projectTitle: document.getElementById('projectTitle'),
    projectDescription: document.getElementById('projectDescription'),
    projectLongDescription: document.getElementById('projectLongDescription'),
    projectPersonalNote: document.getElementById('projectPersonalNote'),
    projectCategory: document.getElementById('projectCategory'),
    projectStatus: document.getElementById('projectStatus'),
    projectTechnologies: document.getElementById('projectTechnologies'),
    projectLiveUrl: document.getElementById('projectLiveUrl'),
    projectGithubUrl: document.getElementById('projectGithubUrl'),
    projectDemoUrl: document.getElementById('projectDemoUrl'),
    projectDocUrl: document.getElementById('projectDocUrl'),
    projectDuration: document.getElementById('projectDuration'),
    projectStars: document.getElementById('projectStars'),
    projectForks: document.getElementById('projectForks'),
    projectClientQuote: document.getElementById('projectClientQuote'),
    projectClientName: document.getElementById('projectClientName'),
    projectClientRole: document.getElementById('projectClientRole'),
    projectCredAdminUrl: document.getElementById('projectCredAdminUrl'),
    projectCredUsername: document.getElementById('projectCredUsername'),
    projectCredPassword: document.getElementById('projectCredPassword'),
    projectCredNote: document.getElementById('projectCredNote'),
    projectHasCredentials: document.getElementById('projectHasCredentials'),
    projectFeatured: document.getElementById('projectFeatured'),
    projectPublished: document.getElementById('projectPublished'),
    deleteBtn: document.getElementById('deleteProjectBtn'),
    deleteConfirmModal: document.getElementById('deleteConfirmModal'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),
    cancelDelete: document.getElementById('cancelDelete'),
    confirmDelete: document.getElementById('confirmDelete'),
    uploadHeroBtn: document.getElementById('uploadHeroBtn'),
    uploadGalleryBtn: document.getElementById('uploadGalleryBtn'),
    projectHeroImage: document.getElementById('projectHeroImage'),
    projectGalleryImages: document.getElementById('projectGalleryImages'),
    projectHeroPreview: document.getElementById('projectHeroPreview'),
    projectGalleryPreview: document.getElementById('projectGalleryPreview'),
    projectImpactSummary: document.getElementById('projectImpactSummary'),
    projectImpactMetrics: document.getElementById('projectImpactMetrics'),
  };

  async function loadProjects() {
    try {
      const data = await Admin.request(Admin.API_BASE + '/projects');
      if (data.success) {
        projects = data.projects || data.data || [];
        renderTable();
      }
    } catch (err) {
      Admin.showToast('Failed to load projects', 'error');
      DOM.tableBody.innerHTML = '<tr><td colspan="6"><div class="activity-empty">Failed to load projects</div></td></tr>';
    }
  }

  function renderTable() {
    let filtered = [...projects];
    const q = DOM.search ? DOM.search.value.toLowerCase() : '';
    const cat = DOM.categoryFilter ? DOM.categoryFilter.value : 'all';
    const st = DOM.statusFilter ? DOM.statusFilter.value : 'all';

    if (q) filtered = filtered.filter(function (p) { return p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q); });
    if (cat !== 'all') filtered = filtered.filter(function (p) { return p.category === cat; });
    if (st === 'published') filtered = filtered.filter(function (p) { return p.published !== false; });
    if (st === 'draft') filtered = filtered.filter(function (p) { return p.published === false; });

    if (!filtered.length) {
      DOM.tableBody.innerHTML = '<tr><td colspan="6"><div class="activity-empty">No projects found</div></td></tr>';
      return;
    }

    DOM.tableBody.innerHTML = filtered.map(function (p) {
      return '<tr>' +
        '<td><div class="table-title">' + Admin.escapeHTML(p.title) + '</div><div class="table-subtitle">' + Admin.escapeHTML((p.description || '').substring(0, 60)) + '</div></td>' +
        '<td><span class="table-badge">' + Admin.escapeHTML(p.category || '—') + '</span></td>' +
        '<td><span class="table-status ' + (p.published !== false ? 'published' : 'draft') + '">' + (p.published !== false ? 'Published' : 'Draft') + '</span></td>' +
        '<td>' + (p.stats?.views || 0) + '</td>' +
        '<td>' + Admin.formatDate(p.updatedAt) + '</td>' +
        '<td><div class="table-actions">' +
          '<button class="table-action-btn" onclick="window.editProject(\'' + p._id + '\')" title="Edit"><span class="material-symbols-outlined">edit</span></button>' +
          '<button class="table-action-btn danger" onclick="window.confirmDeleteProject(\'' + p._id + '\')" title="Delete"><span class="material-symbols-outlined">delete</span></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function openCreateModal() {
    currentProjectId = null;
    DOM.modalTitle.textContent = 'New Project';
    DOM.form.reset();
    DOM.projectId.value = '';
    DOM.deleteBtn.style.display = 'none';
    showModal('projectModal');
  }

 window.editProject = function (id) {
    var p = projects.find(function (x) { return x._id === id; });
    if (!p) return;
    currentProjectId = id;
    DOM.modalTitle.textContent = 'Edit Project';
    DOM.projectId.value = p._id;
    DOM.projectTitle.value = p.title || '';
    DOM.projectDescription.value = p.description || '';
    DOM.projectLongDescription.value = p.longDescription || '';
    if (DOM.projectPersonalNote) DOM.projectPersonalNote.value = p.personalNote || '';
    DOM.projectCategory.value = p.category || '';
    DOM.projectStatus.value = (p.timeline && p.timeline.status) || 'completed';
    DOM.projectTechnologies.value = (p.technologies || []).join(', ');
    DOM.projectLiveUrl.value = (p.links && p.links.live) || '';
    DOM.projectGithubUrl.value = (p.links && p.links.github) || '';
    if (DOM.projectDemoUrl) DOM.projectDemoUrl.value = (p.links && p.links.demo) || '';
    if (DOM.projectDocUrl) DOM.projectDocUrl.value = (p.links && p.links.documentation) || '';
    if (DOM.projectDuration) DOM.projectDuration.value = (p.timeline && p.timeline.duration) || '';
    if (DOM.projectStars) DOM.projectStars.value = (p.stats && p.stats.stars) || 0;
    if (DOM.projectForks) DOM.projectForks.value = (p.stats && p.stats.forks) || 0;
    
    // Impact
    if (DOM.projectImpactSummary) DOM.projectImpactSummary.value = (p.impact && p.impact.summary) || '';
    if (DOM.projectImpactMetrics) {
      var metrics = ((p.impact && p.impact.metrics) || []);
      DOM.projectImpactMetrics.value = metrics.map(function(m) { return m.label + ':' + m.value; }).join(', ');
    }
    
    // Client Feedback
    if (DOM.projectClientQuote) DOM.projectClientQuote.value = (p.clientFeedback && p.clientFeedback.quote) || '';
    if (DOM.projectClientName) DOM.projectClientName.value = (p.clientFeedback && p.clientFeedback.name) || '';
    if (DOM.projectClientRole) DOM.projectClientRole.value = (p.clientFeedback && p.clientFeedback.role) || '';
    
    // Credentials
    if (DOM.projectCredAdminUrl) DOM.projectCredAdminUrl.value = (p.credentials && p.credentials.adminUrl) || '';
    if (DOM.projectCredUsername) DOM.projectCredUsername.value = (p.credentials && p.credentials.username) || '';
    if (DOM.projectCredPassword) DOM.projectCredPassword.value = (p.credentials && p.credentials.password) || '';
    if (DOM.projectCredNote) DOM.projectCredNote.value = (p.credentials && p.credentials.note) || '';
    if (DOM.projectHasCredentials) DOM.projectHasCredentials.checked = (p.credentials && p.credentials.hasCredentials) || false;
    
    DOM.projectFeatured.checked = p.featured || false;
    DOM.projectPublished.checked = p.published !== false;
    DOM.deleteBtn.style.display = 'inline-flex';
    showModal('projectModal');
  };

  async function uploadImage(file, type, previewEl) {
  if (!file) return null;
  var fd = new FormData();
  fd.append('project-image', file); // Changed from 'file' to 'project-image'
  fd.append('type', type);
  try {
    var token = Admin.getToken();
    var res = await fetch(Admin.API_BASE + '/upload', { 
      method: 'POST', 
      headers: { 'Authorization': 'Bearer ' + token }, 
      body: fd 
    });
    var data = await res.json();
    if (data.success && data.url) {
      if (previewEl) {
        previewEl.innerHTML = '<img src="' + data.url + '" alt="Preview" style="width:100px;height:60px;object-fit:cover;border-radius:8px;margin-top:4px;" />';
      }
      return data.url;
    }
  } catch (err) { 
    Admin.showToast('Upload failed', 'error'); 
    console.error('Upload error:', err);
  }
  return null;
}

  async function uploadMultipleImages(files, previewEl) {
    var urls = [];
    for (var i = 0; i < files.length; i++) {
      var url = await uploadImage(files[i], 'project-gallery', previewEl);
      if (url) urls.push({ url: url, caption: '', isHero: false });
    }
    return urls;
  }

  async function saveProject(e) {
    e.preventDefault();
    var heroFile = DOM.projectHeroImage ? DOM.projectHeroImage.files[0] : null;
    var galleryFiles = DOM.projectGalleryImages ? DOM.projectGalleryImages.files : null;
    var heroUrl = '';
    if (heroFile) heroUrl = await uploadImage(heroFile, 'project-hero', DOM.projectHeroPreview);
    var galleryUrls = [];
    if (galleryFiles && galleryFiles.length) galleryUrls = await uploadMultipleImages(galleryFiles, DOM.projectGalleryPreview);
    var images = [];
    if (heroUrl) images.push({ url: heroUrl, caption: DOM.projectTitle.value, isHero: true });
    images.push.apply(images, galleryUrls);

    // Parse impact metrics
    var metricsStr = DOM.projectImpactMetrics ? DOM.projectImpactMetrics.value : '';
    var impactMetrics = [];
    if (metricsStr) {
      impactMetrics = metricsStr.split(',').map(function(m) {
        var parts = m.split(':').map(function(s) { return s.trim(); });
        if (parts.length === 2 && parts[0] && parts[1]) {
          return { label: parts[0], value: parts[1] };
        }
        return null;
      }).filter(Boolean);
    }

    var payload = {
      title: DOM.projectTitle.value.trim(),
      description: DOM.projectDescription.value.trim(),
      longDescription: DOM.projectLongDescription.value.trim(),
      personalNote: DOM.projectPersonalNote ? DOM.projectPersonalNote.value.trim() : '',
      category: DOM.projectCategory.value,
      technologies: DOM.projectTechnologies.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
      images: images.length ? images : undefined,
      links: {
        live: DOM.projectLiveUrl.value.trim(),
        github: DOM.projectGithubUrl.value.trim(),
        demo: DOM.projectDemoUrl ? DOM.projectDemoUrl.value.trim() : '',
        documentation: DOM.projectDocUrl ? DOM.projectDocUrl.value.trim() : '',
      },
      timeline: { 
        status: DOM.projectStatus.value, 
        duration: DOM.projectDuration ? DOM.projectDuration.value.trim() : '' 
      },
      stats: { 
        stars: parseInt(DOM.projectStars ? DOM.projectStars.value : 0) || 0, 
        forks: parseInt(DOM.projectForks ? DOM.projectForks.value : 0) || 0 
      },
      impact: {
        summary: DOM.projectImpactSummary ? DOM.projectImpactSummary.value.trim() : '',
        metrics: impactMetrics
      },
      credentials: {
        hasCredentials: DOM.projectHasCredentials ? DOM.projectHasCredentials.checked : false,
        adminUrl: DOM.projectCredAdminUrl ? DOM.projectCredAdminUrl.value.trim() : '',
        username: DOM.projectCredUsername ? DOM.projectCredUsername.value.trim() : '',
        password: DOM.projectCredPassword ? DOM.projectCredPassword.value.trim() : '',
        note: DOM.projectCredNote ? DOM.projectCredNote.value.trim() : '',
      },
      clientFeedback: {
        quote: DOM.projectClientQuote ? DOM.projectClientQuote.value.trim() : '',
        name: DOM.projectClientName ? DOM.projectClientName.value.trim() : '',
        role: DOM.projectClientRole ? DOM.projectClientRole.value.trim() : '',
      },
      featured: DOM.projectFeatured.checked,
      published: DOM.projectPublished.checked,
    };

    try {
      var url = currentProjectId ? Admin.API_BASE + '/projects/' + currentProjectId : Admin.API_BASE + '/projects';
      var method = currentProjectId ? 'PUT' : 'POST';
      var data = await Admin.request(url, { method: method, body: JSON.stringify(payload) });
      if (data.success) { Admin.showToast(currentProjectId ? 'Project updated!' : 'Project created!', 'success'); closeModal('projectModal'); loadProjects(); }
    } catch (err) { Admin.showToast(err.message || 'Failed to save project', 'error'); }
  }
  window.confirmDeleteProject = function (id) { deleteTargetId = id; showModal('deleteConfirmModal'); };

  async function deleteProject() {
    if (!deleteTargetId) return;
    try { await Admin.request(Admin.API_BASE + '/projects/' + deleteTargetId, { method: 'DELETE' }); Admin.showToast('Project deleted', 'success'); closeModal('deleteConfirmModal'); deleteTargetId = null; loadProjects(); }
    catch (err) { Admin.showToast('Failed to delete project', 'error'); }
  }

  function showModal(id) { document.getElementById(id).classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeModal(id) { document.getElementById(id).classList.remove('active'); document.body.style.overflow = ''; }

  function bindEvents() {
    DOM.addBtn.addEventListener('click', openCreateModal);
    DOM.closeModal.addEventListener('click', function () { closeModal('projectModal'); });
    DOM.cancelModal.addEventListener('click', function () { closeModal('projectModal'); });
    DOM.form.addEventListener('submit', saveProject);
    DOM.deleteBtn.addEventListener('click', function () { if (currentProjectId) { closeModal('projectModal'); window.confirmDeleteProject(currentProjectId); } });
    DOM.closeDeleteModal.addEventListener('click', function () { closeModal('deleteConfirmModal'); });
    DOM.cancelDelete.addEventListener('click', function () { closeModal('deleteConfirmModal'); });
    DOM.confirmDelete.addEventListener('click', deleteProject);
    if (DOM.search) DOM.search.addEventListener('input', Admin.debounce(renderTable, 300));
    if (DOM.categoryFilter) DOM.categoryFilter.addEventListener('change', renderTable);
    if (DOM.statusFilter) DOM.statusFilter.addEventListener('change', renderTable);

    if (DOM.uploadHeroBtn) DOM.uploadHeroBtn.addEventListener('click', function () { var f = DOM.projectHeroImage.files[0]; uploadImage(f, 'project-hero', DOM.projectHeroPreview); });
    if (DOM.uploadGalleryBtn) DOM.uploadGalleryBtn.addEventListener('click', function () { var f = DOM.projectGalleryImages.files; uploadMultipleImages(f, DOM.projectGalleryPreview); });

    document.querySelectorAll('.modal-overlay').forEach(function (o) { o.addEventListener('click', function (e) { if (e.target === o) closeModal(o.id); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(function (m) { closeModal(m.id); }); });
  }

  bindEvents();
  loadProjects();
})();
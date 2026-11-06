(function () {
  'use strict';

  if (!Admin.checkAuth()) return;

  let skills = [];
  let currentSkillId = null;
  let deleteTargetId = null;

  const DOM = {
    grid: document.getElementById('skillsGrid'),
    search: document.getElementById('skillSearch'),
    categoryFilter: document.getElementById('categoryFilter'),
    levelFilter: document.getElementById('levelFilter'),
    addBtn: document.getElementById('addSkillBtn'),
    countFrontend: document.getElementById('countFrontend'),
    countBackend: document.getElementById('countBackend'),
    countDatabase: document.getElementById('countDatabase'),
    countTools: document.getElementById('countTools'),
    modal: document.getElementById('skillModal'),
    modalTitle: document.getElementById('skillModalTitle'),
    closeModal: document.getElementById('closeSkillModal'),
    cancelModal: document.getElementById('cancelSkillModal'),
    form: document.getElementById('skillForm'),
    skillId: document.getElementById('skillId'),
    skillName: document.getElementById('skillName'),
    skillCategory: document.getElementById('skillCategory'),
    skillLevel: document.getElementById('skillLevel'),
    deleteBtn: document.getElementById('deleteSkillBtn'),
    deleteConfirm: document.getElementById('deleteSkillConfirm'),
    closeDelete: document.getElementById('closeDeleteSkill'),
    cancelDelete: document.getElementById('cancelDeleteSkill'),
    confirmDelete: document.getElementById('confirmDeleteSkill'),
  };

  async function loadSkills() {
    try {
      const data = await Admin.request(Admin.API_BASE + '/admin/skills');
      if (data.success) {
        skills = data.skills || [];
        renderGrid();
        updateCounts();
      }
    } catch (err) {
      Admin.showToast('Failed to load skills', 'error');
      DOM.grid.innerHTML = '<div class="activity-empty">Failed to load skills</div>';
    }
  }

  function updateCounts() {
    DOM.countFrontend.textContent = skills.filter(function (s) { return s.category === 'frontend'; }).length;
    DOM.countBackend.textContent = skills.filter(function (s) { return s.category === 'backend'; }).length;
    DOM.countDatabase.textContent = skills.filter(function (s) { return s.category === 'database'; }).length;
    DOM.countTools.textContent = skills.filter(function (s) { return s.category === 'tools'; }).length;
  }

  function renderGrid() {
    let filtered = [...skills];
    const q = DOM.search ? DOM.search.value.toLowerCase() : '';
    const cat = DOM.categoryFilter ? DOM.categoryFilter.value : 'all';
    const lvl = DOM.levelFilter ? DOM.levelFilter.value : 'all';

    if (q) filtered = filtered.filter(function (s) { return s.name.toLowerCase().includes(q); });
    if (cat !== 'all') filtered = filtered.filter(function (s) { return s.category === cat; });
    
    // FIX: Level filter with ranges
    if (lvl !== 'all') {
      filtered = filtered.filter(function (s) {
        var levelNum = typeof s.level === 'number' ? s.level : parseInt(s.level) || 0;
        
        if (lvl === 'beginner') return levelNum < 50;
        if (lvl === 'intermediate') return levelNum >= 50 && levelNum < 70;
        if (lvl === 'advanced') return levelNum >= 70 && levelNum < 90;
        if (lvl === 'expert') return levelNum >= 90;
        return true;
      });
    }

    if (!filtered.length) {
      DOM.grid.innerHTML = '<div class="activity-empty">No skills found</div>';
      return;
    }

    DOM.grid.innerHTML = filtered.map(function (s) {
      var categoryColors = {
        frontend: 'var(--admin-accent)',
        backend: 'var(--admin-purple)',
        database: 'var(--admin-cyan)',
        tools: 'var(--admin-green)'
      };
      var color = categoryColors[s.category] || 'var(--admin-accent)';
      
      // FIX: Display numeric level as percentage
      var levelNum = typeof s.level === 'number' ? s.level : parseInt(s.level) || 80;
      var levelPercent = levelNum + '%';
      var levelText = levelNum >= 90 ? 'expert' : levelNum >= 70 ? 'advanced' : levelNum >= 50 ? 'intermediate' : 'beginner';

      return '<div class="skill-card-admin">' +
        '<div class="skill-card-top">' +
          '<span class="skill-card-icon" style="background:' + color + '20;color:' + color + ';">' + (s.name[0] || '?').toUpperCase() + '</span>' +
          '<div class="skill-card-info">' +
            '<span class="skill-card-name">' + Admin.escapeHTML(s.name) + '</span>' +
            '<span class="skill-card-meta">' + Admin.escapeHTML(s.category) + ' · ' + levelText + ' (' + levelPercent + ')</span>' +
          '</div>' +
        '</div>' +
        '<div class="skill-card-level">' +
          '<div class="level-bar">' +
            '<div class="level-fill" style="width:' + levelPercent + ';background:' + color + ';"></div>' +
          '</div>' +
        '</div>' +
        '<div class="skill-card-actions">' +
          '<button onclick="window.editSkill(\'' + s._id + '\')" title="Edit"><span class="material-symbols-outlined">edit</span></button>' +
          '<button class="danger" onclick="window.confirmDeleteSkill(\'' + s._id + '\')" title="Delete"><span class="material-symbols-outlined">delete</span></button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function openCreateModal() {
    currentSkillId = null;
    DOM.modalTitle.textContent = 'Add Skill';
    DOM.form.reset();
    DOM.skillId.value = '';
    DOM.deleteBtn.style.display = 'none';
    showModal('skillModal');
  }

  window.editSkill = function (id) {
    var s = skills.find(function (x) { return x._id === id; });
    if (!s) return;
    currentSkillId = id;
    DOM.modalTitle.textContent = 'Edit Skill';
    DOM.skillId.value = s._id;
    DOM.skillName.value = s.name;
    DOM.skillCategory.value = s.category;
    DOM.skillLevel.value = typeof s.level === 'number' ? s.level : 80; // Number
    DOM.deleteBtn.style.display = 'inline-flex';
    showModal('skillModal');
};

  async function saveSkill(e) {
    e.preventDefault();
    var payload = {
      name: DOM.skillName.value.trim(),
      category: DOM.skillCategory.value,
      level: parseInt(DOM.skillLevel.value) || 80, // Convert to number
    };

    try {
      var url = currentSkillId ? Admin.API_BASE + '/admin/skills/' + currentSkillId : Admin.API_BASE + '/admin/skills';
      var method = currentSkillId ? 'PUT' : 'POST';
      var data = await Admin.request(url, { method: method, body: JSON.stringify(payload) });
      if (data.success) {
        Admin.showToast(currentSkillId ? 'Skill updated!' : 'Skill added!', 'success');
        closeModal('skillModal');
        loadSkills();
      }
    } catch (err) {
      Admin.showToast(err.message || 'Failed to save skill', 'error');
    }
  }

  window.confirmDeleteSkill = function (id) {
    deleteTargetId = id;
    showModal('deleteSkillConfirm');
  };

  async function deleteSkill() {
    if (!deleteTargetId) return;
    try {
      await Admin.request(Admin.API_BASE + '/admin/skills/' + deleteTargetId, { method: 'DELETE' });
      Admin.showToast('Skill deleted', 'success');
      closeModal('deleteSkillConfirm');
      deleteTargetId = null;
      loadSkills();
    } catch (err) {
      Admin.showToast('Failed to delete skill', 'error');
    }
  }

  function showModal(id) { document.getElementById(id).classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeModal(id) { document.getElementById(id).classList.remove('active'); document.body.style.overflow = ''; }

  DOM.addBtn.addEventListener('click', openCreateModal);
  DOM.closeModal.addEventListener('click', function () { closeModal('skillModal'); });
  DOM.cancelModal.addEventListener('click', function () { closeModal('skillModal'); });
  DOM.form.addEventListener('submit', saveSkill);
  DOM.deleteBtn.addEventListener('click', function () { closeModal('skillModal'); window.confirmDeleteSkill(currentSkillId); });
  DOM.closeDelete.addEventListener('click', function () { closeModal('deleteSkillConfirm'); });
  DOM.cancelDelete.addEventListener('click', function () { closeModal('deleteSkillConfirm'); });
  DOM.confirmDelete.addEventListener('click', deleteSkill);
  if (DOM.search) DOM.search.addEventListener('input', Admin.debounce(renderGrid, 300));
  if (DOM.categoryFilter) DOM.categoryFilter.addEventListener('change', renderGrid);
  if (DOM.levelFilter) DOM.levelFilter.addEventListener('change', renderGrid);

  document.querySelectorAll('.modal-overlay').forEach(function (o) {
    o.addEventListener('click', function (e) { if (e.target === o) closeModal(o.id); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(function (m) { closeModal(m.id); });
  });

  loadSkills();
})();
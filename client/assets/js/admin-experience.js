(function () {
  'use strict';

  if (!Admin.checkAuth()) return;

  let experiences = [];
  let currentExpId = null;
  let deleteTargetId = null;

  const DOM = {
    timeline: document.getElementById('experienceTimeline'),
    search: document.getElementById('expSearch'),
    typeFilter: document.getElementById('typeFilter'),
    addBtn: document.getElementById('addExpBtn'),
    modal: document.getElementById('expModal'),
    modalTitle: document.getElementById('expModalTitle'),
    closeModal: document.getElementById('closeExpModal'),
    cancelModal: document.getElementById('cancelExpModal'),
    form: document.getElementById('expForm'),
    expId: document.getElementById('expId'),
    expTitle: document.getElementById('expTitle'),
    expCompany: document.getElementById('expCompany'),
    expType: document.getElementById('expType'),
    expLocation: document.getElementById('expLocation'),
    expStartDate: document.getElementById('expStartDate'),
    expEndDate: document.getElementById('expEndDate'),
    expDescription: document.getElementById('expDescription'),
    expHighlights: document.getElementById('expHighlights'),
    deleteBtn: document.getElementById('deleteExpBtn'),
    deleteConfirm: document.getElementById('deleteExpConfirm'),
    closeDelete: document.getElementById('closeDeleteExp'),
    cancelDelete: document.getElementById('cancelDeleteExp'),
    confirmDelete: document.getElementById('confirmDeleteExp'),
  };

  async function loadExperiences() {
    try {
      const data = await Admin.request(Admin.API_BASE + '/admin/experiences');
      if (data.success) {
        experiences = data.experiences || [];
        renderTimeline();
      }
    } catch (err) {
      Admin.showToast('Failed to load experiences', 'error');
      DOM.timeline.innerHTML = '<div class="activity-empty">Failed to load experiences</div>';
    }
  }

 function renderTimeline() {
    let filtered = [...experiences];
    const q = DOM.search ? DOM.search.value.toLowerCase() : '';
    const type = DOM.typeFilter ? DOM.typeFilter.value : 'all';

    if (q) {
      filtered = filtered.filter(function (e) {
        return (e.title || '').toLowerCase().includes(q) ||
               (e.organization || '').toLowerCase().includes(q) ||
               (e.description || '').toLowerCase().includes(q);
      });
    }
    if (type !== 'all') filtered = filtered.filter(function (e) { return e.type === type; });

    filtered.sort(function (a, b) { return new Date(b.startDate) - new Date(a.startDate); });

    if (!filtered.length) {
      DOM.timeline.innerHTML = '<div class="activity-empty">No experience entries found</div>';
      return;
    }

    DOM.timeline.innerHTML = '<div class="timeline-line-admin"></div>' + filtered.map(function (e, i) {
      var typeIcon = e.type === 'education' ? '🎓' : e.type === 'certification' ? '📜' : '💼';
      var startDate = e.startDate ? Admin.formatDate(e.startDate) : '';
      var endDate = e.endDate ? Admin.formatDate(e.endDate) : 'Present';
      
      // FIXED: Use achievements instead of highlights
      var achievements = '';
      if (e.achievements && e.achievements.length) {
        achievements = '<ul class="exp-highlights">' + e.achievements.map(function (h) { 
          return '<li>' + Admin.escapeHTML(h) + '</li>'; 
        }).join('') + '</ul>';
      }

      return '<div class="timeline-item-admin">' +
        '<div class="timeline-dot-admin">' + typeIcon + '</div>' +
        '<div class="timeline-content-admin">' +
          '<div class="timeline-header-admin">' +
            '<div>' +
              '<h3>' + Admin.escapeHTML(e.title) + '</h3>' +
              // FIXED: Use organization instead of company
              '<p class="timeline-company">' + Admin.escapeHTML(e.organization || e.institution || e.company || '') + (e.location ? ' · ' + Admin.escapeHTML(e.location) : '') + '</p>' +
            '</div>' +
            '<span class="timeline-date">' + startDate + ' — ' + endDate + '</span>' +
          '</div>' +
          (e.description ? '<p class="timeline-desc">' + Admin.escapeHTML(e.description) + '</p>' : '') +
          achievements +
          '<div class="timeline-actions">' +
            '<button onclick="window.editExperience(\'' + e._id + '\')"><span class="material-symbols-outlined">edit</span></button>' +
            '<button class="danger" onclick="window.confirmDeleteExp(\'' + e._id + '\')"><span class="material-symbols-outlined">delete</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function openCreateModal() {
    currentExpId = null;
    DOM.modalTitle.textContent = 'Add Experience';
    DOM.form.reset();
    DOM.expId.value = '';
    DOM.deleteBtn.style.display = 'none';
    showModal('expModal');
  }

 window.editExperience = function (id) {
    var e = experiences.find(function (x) { return x._id === id; });
    if (!e) return;
    currentExpId = id;
    DOM.modalTitle.textContent = 'Edit Experience';
    DOM.expId.value = e._id;
    DOM.expTitle.value = e.title || '';
    DOM.expCompany.value = e.organization || e.institution || '';    // CHANGED: company → organization
    DOM.expType.value = e.type || 'work';
    DOM.expLocation.value = e.location || '';
    DOM.expStartDate.value = e.startDate ? new Date(e.startDate).toISOString().split('T')[0] : '';
    DOM.expEndDate.value = e.endDate ? new Date(e.endDate).toISOString().split('T')[0] : '';
    DOM.expDescription.value = e.description || '';
    DOM.expHighlights.value = (e.achievements || []).join('\n');    // CHANGED: highlights → achievements
    DOM.deleteBtn.style.display = 'inline-flex';
    showModal('expModal');
};

  async function saveExperience(e) {
    e.preventDefault();
    var payload = {
      title: DOM.expTitle.value.trim(),
      organization: DOM.expCompany.value.trim(),    // CHANGED: company → organization
      type: DOM.expType.value,
      location: DOM.expLocation.value.trim(),
      startDate: DOM.expStartDate.value || null,
      endDate: DOM.expEndDate.value || null,
      description: DOM.expDescription.value.trim(),
      achievements: DOM.expHighlights.value.split('\n').map(function (h) { return h.trim(); }).filter(Boolean),  // CHANGED: highlights → achievements
    };

    try {
      var url = currentExpId ? Admin.API_BASE + '/admin/experiences/' + currentExpId : Admin.API_BASE + '/admin/experiences';
      var method = currentExpId ? 'PUT' : 'POST';
      var data = await Admin.request(url, { method: method, body: JSON.stringify(payload) });
      if (data.success) {
        Admin.showToast(currentExpId ? 'Experience updated!' : 'Experience added!', 'success');
        closeModal('expModal');
        loadExperiences();
      }
    } catch (err) {
      Admin.showToast(err.message || 'Failed to save experience', 'error');
    }
  }

  window.confirmDeleteExp = function (id) {
    deleteTargetId = id;
    showModal('deleteExpConfirm');
  };

  async function deleteExperience() {
    if (!deleteTargetId) return;
    try {
      await Admin.request(Admin.API_BASE + '/admin/experiences/' + deleteTargetId, { method: 'DELETE' });
      Admin.showToast('Experience deleted', 'success');
      closeModal('deleteExpConfirm');
      deleteTargetId = null;
      loadExperiences();
    } catch (err) {
      Admin.showToast('Failed to delete experience', 'error');
    }
  }

  function showModal(id) { document.getElementById(id).classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeModal(id) { document.getElementById(id).classList.remove('active'); document.body.style.overflow = ''; }

  DOM.addBtn.addEventListener('click', openCreateModal);
  DOM.closeModal.addEventListener('click', function () { closeModal('expModal'); });
  DOM.cancelModal.addEventListener('click', function () { closeModal('expModal'); });
  DOM.form.addEventListener('submit', saveExperience);
  DOM.deleteBtn.addEventListener('click', function () { closeModal('expModal'); window.confirmDeleteExp(currentExpId); });
  DOM.closeDelete.addEventListener('click', function () { closeModal('deleteExpConfirm'); });
  DOM.cancelDelete.addEventListener('click', function () { closeModal('deleteExpConfirm'); });
  DOM.confirmDelete.addEventListener('click', deleteExperience);
  if (DOM.search) DOM.search.addEventListener('input', Admin.debounce(renderTimeline, 300));
  if (DOM.typeFilter) DOM.typeFilter.addEventListener('change', renderTimeline);

  document.querySelectorAll('.modal-overlay').forEach(function (o) {
    o.addEventListener('click', function (e) { if (e.target === o) closeModal(o.id); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(function (m) { closeModal(m.id); });
  });

  loadExperiences();
})();
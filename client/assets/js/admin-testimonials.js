(function () {
  'use strict';

  if (!Admin.checkAuth()) return;

  let testimonials = [];
  let currentId = null;
  let deleteTargetId = null;

  const DOM = {
    grid: document.getElementById('testimonialsGrid'),
    addBtn: document.getElementById('addTestimonialBtn'),
    modal: document.getElementById('testimonialModal'),
    modalTitle: document.getElementById('testimonialModalTitle'),
    closeModal: document.getElementById('closeTestimonialModal'),
    cancelModal: document.getElementById('cancelTestimonialModal'),
    form: document.getElementById('testimonialForm'),
    testimonialId: document.getElementById('testimonialId'),
    testimonialName: document.getElementById('testimonialName'),
    testimonialRole: document.getElementById('testimonialRole'),
    testimonialCompany: document.getElementById('testimonialCompany'),
    testimonialQuote: document.getElementById('testimonialQuote'),
    testimonialApproved: document.getElementById('testimonialApproved'),
    tmMetrics: document.getElementById('tmMetrics'),
    deleteBtn: document.getElementById('deleteTestimonialBtn'),
    deleteConfirm: document.getElementById('deleteTestimonialConfirm'),
    closeDelete: document.getElementById('closeDeleteTestimonial'),
    cancelDelete: document.getElementById('cancelDeleteTestimonial'),
    confirmDelete: document.getElementById('confirmDeleteTestimonial'),
  };

  async function loadTestimonials() {
    try {
      const data = await Admin.request(Admin.API_BASE + '/admin/testimonials');
      if (data.success) {
        testimonials = data.testimonials || [];
        renderGrid();
      }
    } catch (err) {
      Admin.showToast('Failed to load testimonials', 'error');
      DOM.grid.innerHTML = '<div class="activity-empty">Failed to load testimonials</div>';
    }
  }

  function renderGrid() {
    var sorted = [...testimonials].sort(function (a, b) { return (a.order || 0) - (b.order || 0); });

    if (!sorted.length) {
      DOM.grid.innerHTML = '<div class="activity-empty">No testimonials yet. Add your first one.</div>';
      return;
    }

    DOM.grid.innerHTML = sorted.map(function (t) {
      return '<div class="testimonial-card-admin' + (!t.approved ? ' unapproved' : '') + '">' +
        '<div class="testimonial-card-top">' +
          '<div class="testimonial-avatar-admin">' + (t.name ? t.name[0].toUpperCase() : '?') + '</div>' +
          '<div class="testimonial-info">' +
            '<span class="testimonial-name">' + Admin.escapeHTML(t.name || 'Anonymous') + '</span>' +
            '<span class="testimonial-role">' + Admin.escapeHTML(t.role || '') + (t.company ? ' at ' + Admin.escapeHTML(t.company) : '') + '</span>' +
          '</div>' +
          (!t.approved ? '<span class="testimonial-badge-unapproved">Pending</span>' : '') +
        '</div>' +
        '<blockquote class="testimonial-quote">"' + Admin.escapeHTML(t.quote || '') + '"</blockquote>' +
        '<div class="testimonial-actions">' +
          '<button onclick="window.editTestimonial(\'' + t._id + '\')"><span class="material-symbols-outlined">edit</span></button>' +
          '<button class="danger" onclick="window.confirmDeleteTestimonial(\'' + t._id + '\')"><span class="material-symbols-outlined">delete</span></button>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function openCreateModal() {
    currentId = null;
    DOM.modalTitle.textContent = 'Add Testimonial';
    DOM.form.reset();
    DOM.testimonialId.value = '';
    DOM.testimonialApproved.checked = true;
    DOM.deleteBtn.style.display = 'none';
    showModal('testimonialModal');
  }

  window.editTestimonial = function (id) {
    var t = testimonials.find(function (x) { return x._id === id; });
    if (!t) return;
    currentId = id;
    DOM.modalTitle.textContent = 'Edit Testimonial';
    DOM.testimonialId.value = t._id;
    DOM.testimonialName.value = t.name || '';
    DOM.testimonialRole.value = t.role || '';
    if (DOM.testimonialCompany) DOM.testimonialCompany.value = t.company || '';
    DOM.testimonialQuote.value = t.quote || '';
    DOM.testimonialApproved.checked = t.approved !== false;
    
    if (DOM.tmMetrics) {
      var metrics = ((t.impact && t.impact.metrics) || []);
      DOM.tmMetrics.value = metrics.map(function(m) { return m.label + ':' + m.value; }).join(', ');
    }
    
    DOM.deleteBtn.style.display = 'inline-flex';
    showModal('testimonialModal');
  };

  async function saveTestimonial(e) {
    e.preventDefault();
    
    var metricsStr = DOM.tmMetrics ? DOM.tmMetrics.value : '';
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
      name: DOM.testimonialName.value.trim(),
      role: DOM.testimonialRole.value.trim(),
      company: DOM.testimonialCompany ? DOM.testimonialCompany.value.trim() : '',
      quote: DOM.testimonialQuote.value.trim(),
      approved: DOM.testimonialApproved.checked,
      impact: { metrics: impactMetrics }
    };

    try {
      var url = currentId ? Admin.API_BASE + '/admin/testimonials/' + currentId : Admin.API_BASE + '/admin/testimonials';
      var method = currentId ? 'PUT' : 'POST';
      var data = await Admin.request(url, { method: method, body: JSON.stringify(payload) });
      if (data.success) {
        Admin.showToast(currentId ? 'Testimonial updated!' : 'Testimonial added!', 'success');
        closeModal('testimonialModal');
        loadTestimonials();
      }
    } catch (err) {
      Admin.showToast(err.message || 'Failed to save testimonial', 'error');
    }
  }

  window.confirmDeleteTestimonial = function (id) {
    deleteTargetId = id;
    showModal('deleteTestimonialConfirm');
  };

  async function deleteTestimonial() {
    if (!deleteTargetId) return;
    try {
      await Admin.request(Admin.API_BASE + '/admin/testimonials/' + deleteTargetId, { method: 'DELETE' });
      Admin.showToast('Testimonial deleted', 'success');
      closeModal('deleteTestimonialConfirm');
      deleteTargetId = null;
      loadTestimonials();
    } catch (err) {
      Admin.showToast('Failed to delete testimonial', 'error');
    }
  }

  function showModal(id) { document.getElementById(id).classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeModal(id) { document.getElementById(id).classList.remove('active'); document.body.style.overflow = ''; }

  DOM.addBtn.addEventListener('click', openCreateModal);
  DOM.closeModal.addEventListener('click', function () { closeModal('testimonialModal'); });
  DOM.cancelModal.addEventListener('click', function () { closeModal('testimonialModal'); });
  DOM.form.addEventListener('submit', saveTestimonial);
  DOM.deleteBtn.addEventListener('click', function () { closeModal('testimonialModal'); window.confirmDeleteTestimonial(currentId); });
  DOM.closeDelete.addEventListener('click', function () { closeModal('deleteTestimonialConfirm'); });
  DOM.cancelDelete.addEventListener('click', function () { closeModal('deleteTestimonialConfirm'); });
  DOM.confirmDelete.addEventListener('click', deleteTestimonial);

  document.querySelectorAll('.modal-overlay').forEach(function (o) {
    o.addEventListener('click', function (e) { if (e.target === o) closeModal(o.id); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(function (m) { closeModal(m.id); });
  });

  loadTestimonials();
})();
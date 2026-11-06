(function () {
  'use strict';

  if (!Admin.checkAuth()) return;

  let blogs = [];
  let currentBlogId = null;
  let deleteTargetId = null;

  const DOM = {
    tableBody: document.getElementById('blogsTableBody'),
    search: document.getElementById('blogSearch'),
    categoryFilter: document.getElementById('categoryFilter'),
    statusFilter: document.getElementById('statusFilter'),
    addBtn: document.getElementById('addBlogBtn'),
    modal: document.getElementById('blogModal'),
    modalTitle: document.getElementById('blogModalTitle'),
    closeModal: document.getElementById('closeBlogModal'),
    cancelModal: document.getElementById('cancelBlogModal'),
    form: document.getElementById('blogForm'),
    blogId: document.getElementById('blogId'),
    blogTitle: document.getElementById('blogTitle'),
    blogSubtitle: document.getElementById('blogSubtitle'),
    blogExcerpt: document.getElementById('blogExcerpt'),
    blogCategory: document.getElementById('blogCategory'),
    blogReadTime: document.getElementById('blogReadTime'),
    blogTags: document.getElementById('blogTags'),
    blogContent: document.getElementById('blogContent'),
    blogFeatured: document.getElementById('blogFeatured'),
    blogStatus: document.getElementById('blogStatus'),
    deleteBtn: document.getElementById('deleteBlogBtn'),
    deleteConfirm: document.getElementById('deleteBlogConfirm'),
    closeDelete: document.getElementById('closeDeleteBlog'),
    cancelDelete: document.getElementById('cancelDeleteBlog'),
    confirmDelete: document.getElementById('confirmDeleteBlog'),
  };

  async function loadBlogs() {
    try {
      const data = await Admin.request(Admin.API_BASE + '/blogs');
      if (data.success) { blogs = data.blogs || data.data || []; renderTable(); }
    } catch (err) {
      Admin.showToast('Failed to load posts', 'error');
      DOM.tableBody.innerHTML = '<tr><td colspan="6"><div class="activity-empty">Failed to load posts</div></td></tr>';
    }
  }

  function renderTable() {
    let filtered = [...blogs];
    const q = DOM.search ? DOM.search.value.toLowerCase() : '';
    const cat = DOM.categoryFilter ? DOM.categoryFilter.value : 'all';
    const st = DOM.statusFilter ? DOM.statusFilter.value : 'all';
    if (q) filtered = filtered.filter(function (b) { return b.title.toLowerCase().includes(q); });
    if (cat !== 'all') filtered = filtered.filter(function (b) { return b.category === cat; });
    if (st === 'published') filtered = filtered.filter(function (b) { return b.status === 'published'; });
    if (st === 'draft') filtered = filtered.filter(function (b) { return b.status === 'draft'; });

    if (!filtered.length) { DOM.tableBody.innerHTML = '<tr><td colspan="6"><div class="activity-empty">No posts found</div></td></tr>'; return; }

    DOM.tableBody.innerHTML = filtered.map(function (b) {
      return '<tr>' +
        '<td><div class="table-title">' + Admin.escapeHTML(b.title) + '</div><div class="table-subtitle">' + Admin.escapeHTML((b.excerpt || '').substring(0, 60)) + '</div></td>' +
        '<td><span class="table-badge">' + Admin.escapeHTML(b.category || '—') + '</span></td>' +
        '<td><span class="table-status ' + (b.status === 'published' ? 'published' : 'draft') + '">' + (b.status === 'published' ? 'Published' : 'Draft') + '</span></td>' +
        '<td>' + (b.views || 0) + '</td>' +
        '<td>' + Admin.formatDate(b.createdAt) + '</td>' +
        '<td><div class="table-actions">' +
          '<button class="table-action-btn" onclick="window.editBlog(\'' + b._id + '\')" title="Edit"><span class="material-symbols-outlined">edit</span></button>' +
          '<button class="table-action-btn danger" onclick="window.confirmDeleteBlog(\'' + b._id + '\')" title="Delete"><span class="material-symbols-outlined">delete</span></button>' +
        '</div></td>' +
      '</tr>';
    }).join('');
  }

  function openCreateModal() {
    currentBlogId = null;
    DOM.modalTitle.textContent = 'New Post';
    DOM.form.reset();
    DOM.blogId.value = '';
    DOM.blogStatus.checked = true;
    DOM.deleteBtn.style.display = 'none';
    showModal('blogModal');
  }

  window.editBlog = function (id) {
    var b = blogs.find(function (x) { return x._id === id; });
    if (!b) return;
    currentBlogId = id;
    DOM.modalTitle.textContent = 'Edit Post';
    DOM.blogId.value = b._id;
    DOM.blogTitle.value = b.title || '';
    DOM.blogSubtitle.value = b.subtitle || '';
    DOM.blogExcerpt.value = b.excerpt || '';
    DOM.blogCategory.value = b.category || '';
    DOM.blogReadTime.value = b.readTime || 5;
    DOM.blogTags.value = (b.tags || []).join(', ');
    DOM.blogContent.value = b.content || '';
    DOM.blogFeatured.checked = b.featured || false;
    DOM.blogStatus.checked = b.status === 'published';
    DOM.deleteBtn.style.display = 'inline-flex';
    showModal('blogModal');
  };

  async function saveBlog(e) {
    e.preventDefault();
    var payload = {
      title: DOM.blogTitle.value.trim(),
      subtitle: DOM.blogSubtitle.value.trim(),
      excerpt: DOM.blogExcerpt.value.trim(),
      category: DOM.blogCategory.value,
      readTime: parseInt(DOM.blogReadTime.value) || 5,
      tags: DOM.blogTags.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean),
      content: DOM.blogContent.value.trim(),
      featured: DOM.blogFeatured.checked,
      status: DOM.blogStatus.checked ? 'published' : 'draft',
    };

    try {
      var url = currentBlogId ? Admin.API_BASE + '/blogs/' + currentBlogId : Admin.API_BASE + '/blogs';
      var method = currentBlogId ? 'PUT' : 'POST';
      var data = await Admin.request(url, { method: method, body: JSON.stringify(payload) });
      if (data.success) { Admin.showToast(currentBlogId ? 'Post updated!' : 'Post published!', 'success'); closeModal('blogModal'); loadBlogs(); }
    } catch (err) { Admin.showToast(err.message || 'Failed to save post', 'error'); }
  }

  window.confirmDeleteBlog = function (id) { deleteTargetId = id; showModal('deleteBlogConfirm'); };

  async function deleteBlog() {
    if (!deleteTargetId) return;
    try { await Admin.request(Admin.API_BASE + '/blogs/' + deleteTargetId, { method: 'DELETE' }); Admin.showToast('Post deleted', 'success'); closeModal('deleteBlogConfirm'); deleteTargetId = null; loadBlogs(); }
    catch (err) { Admin.showToast('Failed to delete post', 'error'); }
  }

  function showModal(id) { document.getElementById(id).classList.add('active'); document.body.style.overflow = 'hidden'; }
  function closeModal(id) { document.getElementById(id).classList.remove('active'); document.body.style.overflow = ''; }

  function bindEvents() {
    DOM.addBtn.addEventListener('click', openCreateModal);
    DOM.closeModal.addEventListener('click', function () { closeModal('blogModal'); });
    DOM.cancelModal.addEventListener('click', function () { closeModal('blogModal'); });
    DOM.form.addEventListener('submit', saveBlog);
    DOM.deleteBtn.addEventListener('click', function () { closeModal('blogModal'); window.confirmDeleteBlog(currentBlogId); });
    DOM.closeDelete.addEventListener('click', function () { closeModal('deleteBlogConfirm'); });
    DOM.cancelDelete.addEventListener('click', function () { closeModal('deleteBlogConfirm'); });
    DOM.confirmDelete.addEventListener('click', deleteBlog);
    if (DOM.search) DOM.search.addEventListener('input', Admin.debounce(renderTable, 300));
    if (DOM.categoryFilter) DOM.categoryFilter.addEventListener('change', renderTable);
    if (DOM.statusFilter) DOM.statusFilter.addEventListener('change', renderTable);
    document.querySelectorAll('.modal-overlay').forEach(function (o) { o.addEventListener('click', function (e) { if (e.target === o) closeModal(o.id); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(function (m) { closeModal(m.id); }); });
  }

  bindEvents();
  loadBlogs();
})();
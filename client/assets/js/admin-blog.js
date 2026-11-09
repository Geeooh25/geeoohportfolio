(function () {
  'use strict';

  if (!Admin.checkAuth()) return;

  let blogs = [];
  let currentBlogId = null;
  let deleteTargetId = null;
  let currentHeroImageUrl = '';

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
    blogExcerpt: document.getElementById('blogExcerpt'),
    blogCategory: document.getElementById('blogCategory'),
    blogReadTime: document.getElementById('blogReadTime'),
    blogTags: document.getElementById('blogTags'),
    
    // Editor Nodes
    blogContent: document.getElementById('blogContent'), 
    blogContentEditor: document.getElementById('blogContentEditor'), 
    
    blogFeatured: document.getElementById('blogFeatured'),
    blogStatus: document.getElementById('blogStatus'),
    deleteBtn: document.getElementById('deleteBlogBtn'),
    deleteConfirm: document.getElementById('deleteBlogConfirm'),
    closeDelete: document.getElementById('closeDeleteBlog'),
    cancelDelete: document.getElementById('cancelDeleteBlog'),
    confirmDelete: document.getElementById('confirmDeleteBlog'),
    
    // Image upload nodes
    heroImageInput: document.getElementById('heroImageInput'),
    heroImagePreview: document.getElementById('heroImagePreview'),
    heroImageDropArea: document.getElementById('heroImageDropArea')
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

  function resetImagePreview() {
    currentHeroImageUrl = '';
    DOM.heroImagePreview.style.display = 'none';
    DOM.heroImagePreview.src = '';
    DOM.heroImageInput.value = '';
  }

  function openCreateModal() {
    currentBlogId = null;
    DOM.modalTitle.textContent = 'New Post';
    DOM.form.reset();
    DOM.blogId.value = '';
    DOM.blogStatus.checked = true;
    DOM.deleteBtn.style.display = 'none';
    if (DOM.blogContentEditor) DOM.blogContentEditor.innerHTML = '';
    if (DOM.blogContent) DOM.blogContent.value = '';
    resetImagePreview();
    showModal('blogModal');
  }

  window.editBlog = function (id) {
    var b = blogs.find(function (x) { return x._id === id; });
    if (!b) return;
    currentBlogId = id;
    DOM.modalTitle.textContent = 'Edit Post';
    
    if (DOM.blogId) DOM.blogId.value = b._id;
    if (DOM.blogTitle) DOM.blogTitle.value = b.title || '';
    if (DOM.blogExcerpt) DOM.blogExcerpt.value = b.excerpt || '';
    if (DOM.blogCategory) DOM.blogCategory.value = b.category || '';
    if (DOM.blogReadTime) DOM.blogReadTime.value = b.readTime || 5;
    if (DOM.blogTags) DOM.blogTags.value = (b.tags || []).join(', ');
    if (DOM.blogFeatured) DOM.blogFeatured.checked = b.featured || false;
    if (DOM.blogStatus) DOM.blogStatus.checked = b.status === 'published';
    if (DOM.deleteBtn) DOM.deleteBtn.style.display = 'inline-flex';
    
    // Load Content into the visual editor
    if (DOM.blogContentEditor) DOM.blogContentEditor.innerHTML = b.content || '';
    if (DOM.blogContent) DOM.blogContent.value = b.content || '';
    
    // Set Hero Image
    resetImagePreview();
    if (b.coverImage && b.coverImage.url) {
      currentHeroImageUrl = b.coverImage.url;
      DOM.heroImagePreview.src = b.coverImage.url;
      DOM.heroImagePreview.style.display = 'block';
    }

    showModal('blogModal');
  };

  // Handle Hero Image Upload Selection
  if (DOM.heroImageDropArea) {
    DOM.heroImageDropArea.addEventListener('click', function() {
      DOM.heroImageInput.click();
    });
  }

  if (DOM.heroImageInput) {
    DOM.heroImageInput.addEventListener('change', async function() {
      if (!this.files || !this.files.length) return;
      var file = this.files[0];
      
      // Show local preview instantly
      var reader = new FileReader();
      reader.onload = function(e) { 
        DOM.heroImagePreview.src = e.target.result; 
        DOM.heroImagePreview.style.display = 'block'; 
      };
      reader.readAsDataURL(file);

      // Upload to server
      var fd = new FormData();
      fd.append('file', file);
      try {
        DOM.heroImageDropArea.style.opacity = '0.5';
        var res = await fetch(Admin.API_BASE + '/upload/public', { method: 'POST', body: fd });
        var data = await res.json();
        
        if (data.success && data.url) {
          currentHeroImageUrl = data.url;
          Admin.showToast('Cover Image uploaded!', 'success');
        } else {
          Admin.showToast('Image upload failed', 'error');
          resetImagePreview();
        }
      } catch (err) {
        Admin.showToast('Image upload error', 'error');
        resetImagePreview();
      } finally {
        DOM.heroImageDropArea.style.opacity = '1';
      }
    });
  }

  async function saveBlog(e) {
    e.preventDefault();
    
    // 1. Clean up the HTML from the visual editor
    var rawHTML = DOM.blogContentEditor ? DOM.blogContentEditor.innerHTML : '';
    // Removes empty <br> and empty <p> tags
    var cleanHTML = rawHTML.replace(/<br\s*[\/]?>/gi, '').replace(/<p><\/p>/gi, '').replace(/<div><br><\/div>/gi, '');

    // 2. Build the payload EXACTLY matching your seed file structure
    var payload = {
      title: DOM.blogTitle ? DOM.blogTitle.value.trim() : '',
      excerpt: DOM.blogExcerpt ? DOM.blogExcerpt.value.trim() : '',
      category: DOM.blogCategory ? DOM.blogCategory.value : '',
      readTime: DOM.blogReadTime ? (parseInt(DOM.blogReadTime.value) || 5) : 5,
      tags: DOM.blogTags ? DOM.blogTags.value.split(',').map(function (t) { return t.trim(); }).filter(Boolean) : [],
      content: cleanHTML, 
      featured: DOM.blogFeatured ? DOM.blogFeatured.checked : false,
      status: (DOM.blogStatus && DOM.blogStatus.checked) ? 'published' : 'draft'
    };

    // 3. Attach Hero Image using the frontend's expected format
    if (currentHeroImageUrl) {
      payload.coverImage = { url: currentHeroImageUrl };
    }

    try {
      var url = currentBlogId ? Admin.API_BASE + '/blogs/' + currentBlogId : Admin.API_BASE + '/blogs';
      var method = currentBlogId ? 'PUT' : 'POST';
      var data = await Admin.request(url, { method: method, body: JSON.stringify(payload) });
      if (data.success) { 
        Admin.showToast(currentBlogId ? 'Post updated!' : 'Post published!', 'success'); 
        closeModal('blogModal'); 
        loadBlogs(); 
      }
    } catch (err) { 
      Admin.showToast(err.message || 'Failed to save post', 'error'); 
    }
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
    if (DOM.addBtn) DOM.addBtn.addEventListener('click', openCreateModal);
    if (DOM.closeModal) DOM.closeModal.addEventListener('click', function () { closeModal('blogModal'); });
    if (DOM.cancelModal) DOM.cancelModal.addEventListener('click', function () { closeModal('blogModal'); });
    if (DOM.form) DOM.form.addEventListener('submit', saveBlog);
    if (DOM.deleteBtn) DOM.deleteBtn.addEventListener('click', function () { closeModal('blogModal'); window.confirmDeleteBlog(currentBlogId); });
    if (DOM.closeDelete) DOM.closeDelete.addEventListener('click', function () { closeModal('deleteBlogConfirm'); });
    if (DOM.cancelDelete) DOM.cancelDelete.addEventListener('click', function () { closeModal('deleteBlogConfirm'); });
    if (DOM.confirmDelete) DOM.confirmDelete.addEventListener('click', deleteBlog);
    
    if (DOM.search) DOM.search.addEventListener('input', Admin.debounce(renderTable, 300));
    if (DOM.categoryFilter) DOM.categoryFilter.addEventListener('change', renderTable);
    if (DOM.statusFilter) DOM.statusFilter.addEventListener('change', renderTable);
    
    document.querySelectorAll('.modal-overlay').forEach(function (o) { o.addEventListener('click', function (e) { if (e.target === o) closeModal(o.id); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(function (m) { closeModal(m.id); }); });

    // ── RICH TEXT EDITOR LOGIC ──
    function formatDoc(cmd, val = null) {
      document.execCommand(cmd, false, val);
      DOM.blogContentEditor.focus();
      updateHiddenContent();
    }

    function updateHiddenContent() {
      if (DOM.blogContent && DOM.blogContentEditor) {
        DOM.blogContent.value = DOM.blogContentEditor.innerHTML;
      }
    }

    if (document.getElementById('btn-h2')) {
      document.getElementById('btn-h2').onclick = () => formatDoc('formatBlock', 'h2');
      document.getElementById('btn-h3').onclick = () => formatDoc('formatBlock', 'h3');
      document.getElementById('btn-p').onclick = () => formatDoc('formatBlock', 'p');
      document.getElementById('btn-bold').onclick = () => formatDoc('bold');
      document.getElementById('btn-italic').onclick = () => formatDoc('italic');
      document.getElementById('btn-code').onclick = () => formatDoc('formatBlock', 'pre');
      document.getElementById('btn-quote').onclick = () => formatDoc('formatBlock', 'blockquote');
      
      // ── IMAGE UPLOAD FROM DEVICE (Inside Editor) ──
      document.getElementById('btn-img').onclick = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        
        fileInput.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          const fd = new FormData();
          fd.append('file', file);
          
          try {
            Admin.showToast('Uploading image...', 'info');
            const res = await fetch(Admin.API_BASE + '/upload/public', { method: 'POST', body: fd });
            const data = await res.json();
            
            if (data.success && data.url) {
              formatDoc('insertImage', data.url);
              Admin.showToast('Image inserted!', 'success');
            } else {
              Admin.showToast('Upload failed', 'error');
            }
          } catch (err) {
            Admin.showToast('Upload error', 'error');
          }
        };
        
        fileInput.click();
      };
      
      // Sync hidden textarea when typing
      DOM.blogContentEditor.addEventListener('input', updateHiddenContent);
      DOM.blogContentEditor.addEventListener('keyup', updateHiddenContent);
      DOM.blogContentEditor.addEventListener('blur', updateHiddenContent);
    }
  }

  bindEvents();
  loadBlogs();
})();
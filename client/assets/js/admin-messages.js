(function () {
  'use strict';
  if (!Admin.checkAuth()) return;

  // ── Inject the CSS safety net (runs once) ──
  // Ensures admin voice-note bubbles match the visitor widget in both light + dark themes.
  (function injectVoiceNoteCSS() {
    if (document.getElementById('__vnCSS')) return;
    var s = document.createElement('style');
    s.id = '__vnCSS';
    s.textContent = [
      // The bubble itself: own (visitor's msg on admin) = orange; other (admin's msg) = neutral
      '.chat-bubble .vn { color: inherit; }',
      // wave bars – force palette regardless of admin theme
      '.vn .vn-wave { background-repeat: no-repeat; }',
      // bubble time text should inherit bubble text color
      '.chat-bubble .chat-bubble-time { color: inherit; opacity: 0.7; }',
      // ensure play button text sits above background
      '.vn .vn-play { line-height: 1; }',
    ].join('\n');
    document.head.appendChild(s);
  })();

  // ── Shared voice-note renderer + wiring ──
  function buildVoiceNoteHTML(fileUrl, isOwnBubble) {
    var uid = 'v_' + Math.random().toString(36).substr(2, 8);
    var textColor  = isOwnBubble ? '#ffffff' : '#1f2937';
    var waveBase   = isOwnBubble ? 'rgba(255,255,255,0.3)' : 'rgba(128,128,128,0.3)';
    var waveActive = isOwnBubble ? '#ffffff' : '#FF6B00';
    var btnBg      = isOwnBubble ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)';
    var btnBorder  = isOwnBubble ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)';

    var waves = '';
    for (var i = 0; i < 12; i++) {
      var h = Math.floor(Math.random() * 18) + 8;
      waves += '<div class="vn-wave" data-wave="' + i + '" style="' +
               'width:3px;height:' + h + 'px;' +
               'background:' + waveBase + ' !important;' +
               'border-radius:2px;flex-shrink:0;transition:background .1s;">' +
               '</div>';
    }

    return (
      '<div class="vn" data-uid="' + uid + '" data-own="' + (isOwnBubble ? '1' : '0') + '" ' +
        'data-wave-base="' + waveBase + '" data-wave-active="' + waveActive + '" ' +
        'style="display:flex;align-items:center;gap:8px;min-width:160px;padding:2px 0;">' +
        '<button type="button" class="vn-play" data-uid="' + uid + '" ' +
          'style="width:32px;height:32px;border-radius:50%;' +
          'border:1px solid ' + btnBorder + ' !important;' +
          'background:' + btnBg + ' !important;' +
          'color:' + textColor + ' !important;' +
          'cursor:pointer;font-size:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;">▶</button>' +
        '<div style="flex:1;min-width:50px;">' +
          '<div style="display:flex;align-items:flex-end;gap:2px;height:28px;">' + waves + '</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:0.55rem;opacity:0.6;margin-top:2px;">' +
            '<span class="vn-cur" style="color:' + textColor + ' !important;">0:00</span>' +
            '<span class="vn-dur" style="color:' + textColor + ' !important;">0:00</span>' +
          '</div>' +
        '</div>' +
        '<audio class="vn-audio" data-uid="' + uid + '" src="' + fileUrl + '" preload="metadata" style="display:none;"></audio>' +
      '</div>'
    );
  }

  function wireVoiceNotes(root) {
    (root || document).querySelectorAll('.vn[data-uid]').forEach(function (vn) {
      if (vn.dataset.wired === '1') return;
      vn.dataset.wired = '1';

      var audio  = vn.querySelector('.vn-audio');
      var btn    = vn.querySelector('.vn-play');
      var cur    = vn.querySelector('.vn-cur');
      var dur    = vn.querySelector('.vn-dur');
      var waves  = vn.querySelectorAll('[data-wave]');
      var WAVE_BASE   = vn.dataset.waveBase;
      var WAVE_ACTIVE = vn.dataset.waveActive;

      function fmt(s) { if (!isFinite(s)) s = 0; var m = Math.floor(s/60), sec = Math.floor(s%60); return m + ':' + (sec<10?'0':'') + sec; }
      function paint(p) {
        waves.forEach(function (w, i) {
          w.style.setProperty('background', (i / waves.length) <= p ? WAVE_ACTIVE : WAVE_BASE, 'important');
        });
      }

      btn.addEventListener('click', function () {
        if (audio.paused) {
          (root || document).querySelectorAll('.vn-audio').forEach(function (a) { if (a !== audio && !a.paused) a.pause(); });
          audio.play();
        } else {
          audio.pause();
        }
      });

      audio.addEventListener('loadedmetadata', function () { dur.textContent = fmt(audio.duration); });
      audio.addEventListener('timeupdate', function () {
        cur.textContent = fmt(audio.currentTime);
        paint(audio.currentTime / (audio.duration || 1));
      });
      audio.addEventListener('ended', function () {
        btn.textContent = '▶';
        cur.textContent = '0:00';
        waves.forEach(function (w) { w.style.setProperty('background', WAVE_BASE, 'important'); });
      });
      audio.addEventListener('pause', function () { btn.textContent = '▶'; });
      audio.addEventListener('play',  function () { btn.textContent = '⏸'; });
    });
  }

  let conversations = {}, activeConversationId = null, socket = null, currentFilter = 'all', isSending = false;
  let mediaRecorder = null, audioChunks = [], recordingStart = 0, recordingTimer = null, uploadedFiles = [], onlineUsers = {};

  const DOM = {
    chatContacts: document.getElementById('chatContacts'), chatSearch: document.getElementById('chatSearch'), chatFilterTabs: document.getElementById('chatFilterTabs'),
    chatSidebar: document.getElementById('chatSidebar'), chatMain: document.getElementById('chatMain'), chatEmpty: document.getElementById('chatEmpty'), chatActive: document.getElementById('chatActive'),
    chatBackBtn: document.getElementById('chatBackBtn'), chatActiveAvatar: document.getElementById('chatActiveAvatar'), chatActiveName: document.getElementById('chatActiveName'),
    chatActiveDetails: document.getElementById('chatActiveDetails'), chatMessages: document.getElementById('chatMessages'),
    chatSendForm: document.getElementById('chatSendForm'), chatMessageInput: document.getElementById('chatMessageInput'), typingIndicator: document.getElementById('typingIndicator'), typingText: document.getElementById('typingText'),
    conversationMenu: document.getElementById('conversationMenu'), conversationMenuBtn: document.getElementById('conversationMenuBtn'),
    markResolvedBtn: document.getElementById('markResolvedBtn'), markUnreadBtn: document.getElementById('markUnreadBtn'), deleteConversationBtn: document.getElementById('deleteConversationBtn'),
    messageBadge: document.getElementById('messageBadge'), conversationCount: document.getElementById('conversationCount'),
    attachBtn: document.getElementById('attachBtn'), fileInput: document.getElementById('fileInput'), uploadPreviewBar: document.getElementById('uploadPreviewBar'),
    uploadPreviewList: document.getElementById('uploadPreviewList'), clearUploads: document.getElementById('clearUploads'),
    voiceBtn: document.getElementById('voiceBtn'), voiceRecordingBar: document.getElementById('voiceRecordingBar'), voiceCancelBtn: document.getElementById('voiceCancelBtn'),
    voiceSendBtn: document.getElementById('voiceSendBtn'), voiceRecordingTime: document.getElementById('voiceRecordingTime'), quickRepliesBar: document.getElementById('quickRepliesBar'), emojiBtn: document.getElementById('emojiBtn'),
    chatSendBtn: document.getElementById('chatSendBtn'), chatFilterBtn: document.getElementById('chatFilterBtn')
  };

  // ── Load ──
  async function loadConversations() {
    try { var d = await Admin.request(Admin.API_BASE + '/messages'); if (d.success) { groupConversations(d.messages || []); renderContactList(); updateBadge(); updateConversationCount(); } } catch (e) { DOM.chatContacts.innerHTML = '<div class="activity-empty">Failed</div>'; }
  }

  function groupConversations(msgs) {
    conversations = {};
    msgs.forEach(function (m) {
      var cid = m.conversationId || m.sender?.email || 'unknown';
      if (!conversations[cid]) conversations[cid] = { id: cid, name: m.sender?.name || 'Visitor', email: m.sender?.email || '', source: m.source || 'website', messages: [], unread: 0, resolved: false, lastActivity: m.createdAt };
      conversations[cid].messages.push(m);
      if (!m.read && m.type !== 'admin') conversations[cid].unread++;
      if (!conversations[cid].lastActivity || new Date(m.createdAt) > new Date(conversations[cid].lastActivity)) {
        conversations[cid].lastActivity = m.createdAt;
      }
    });

    Object.values(conversations).forEach(function(c) {
      c.messages.sort(function(a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
    });
  }

  // ── Contact List ──
  function renderContactList() {
    var convs = Object.values(conversations), q = DOM.chatSearch ? DOM.chatSearch.value.toLowerCase().trim() : '';
    if (q) convs = convs.filter(function (c) { return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q); });
    if (currentFilter === 'unread') convs = convs.filter(function (c) { return c.unread > 0; });
    if (currentFilter === 'active') convs = convs.filter(function (c) { return !c.resolved; });
    if (currentFilter === 'resolved') convs = convs.filter(function (c) { return c.resolved; });
    convs.sort(function (a, b) { return new Date(b.lastActivity) - new Date(a.lastActivity); });
    if (!convs.length) { DOM.chatContacts.innerHTML = '<div class="activity-empty">No conversations</div>'; return; }
    DOM.chatContacts.innerHTML = convs.map(function (c) {
      var last = c.messages[c.messages.length - 1], preview = last ? (last.content || (last.fileUrl ? '📎' : '')).substring(0, 40) : '';
      return '<div class="chat-contact' + (c.unread > 0 ? ' unread' : '') + (c.id === activeConversationId ? ' active' : '') + '" data-id="' + c.id + '"><div class="chat-contact-avatar">' + (c.name[0] || '?').toUpperCase() + '</div><div class="chat-contact-info"><span class="chat-contact-name">' + Admin.escapeHTML(c.name) + '</span><span class="chat-contact-preview">' + Admin.escapeHTML(preview) + '</span></div><div class="chat-contact-meta"><span class="chat-contact-time">' + (c.lastActivity ? formatTime(c.lastActivity) : '') + '</span>' + (c.unread > 0 ? '<span class="chat-contact-badge">' + c.unread + '</span>' : '') + '</div></div>';
    }).join('');
    DOM.chatContacts.querySelectorAll('.chat-contact').forEach(function (el) { el.addEventListener('click', function () { openConversation(this.dataset.id); }); });
  }

  function openConversation(cid) {
    activeConversationId = cid; var c = conversations[cid]; if (!c) return;

    c.unread = 0;
    c.messages.forEach(function(m) { if (!m.read) m.read = true; });

    DOM.chatEmpty.style.display = 'none'; DOM.chatActive.style.display = 'flex';
    DOM.chatActiveAvatar.textContent = (c.name[0] || '?').toUpperCase(); DOM.chatActiveName.textContent = c.name;
    DOM.chatActiveDetails.textContent = (c.email ? c.email + ' · ' : '') + (c.source || '');
    renderMessages(c); renderContactList(); updateBadge();

    scrollToBottom();
    setTimeout(function() { scrollToBottom(); }, 200);

    if (socket && socket.connected) socket.emit('admin-mark-read', { conversationId: cid });
    if (window.innerWidth <= 900) { DOM.chatSidebar.classList.add('hidden'); DOM.chatMain.classList.add('active'); }
  }

  // ── Messages ──
  function renderMessages(c) {
    var html = '', lastDate = '';
    var sorted = c.messages.slice().sort(function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
    sorted.forEach(function (m) {
      var d = new Date(m.createdAt).toDateString(), today = new Date().toDateString(), yesterday = new Date(Date.now() - 86400000).toDateString();
      if (d !== lastDate) { html += '<div class="chat-date-divider"><span>' + (d === today ? 'Today' : d === yesterday ? 'Yesterday' : new Date(m.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })) + '</span></div>'; lastDate = d; }
      var isAdmin = m.type === 'admin';
      var status = '';
      if (isAdmin) {
        if (m.pending) {
          status = ' <span class="msg-status pending" style="font-size:0.6rem;opacity:1;">🕐</span>';
        } else if (m.failed) {
          status = ' <span class="msg-status failed" style="font-size:0.6rem;color:#ef4444;cursor:pointer;" title="Tap to retry">❌</span>';
        } else if (m.read) {
          status = ' <span class="msg-status read" style="color:#3b82f6;">✓✓</span>';
        } else if (m.delivered) {
          status = ' <span class="msg-status delivered">✓✓</span>';
        } else {
          status = ' <span class="msg-status sent">✓</span>';
        }
      }
      html += '<div class="chat-bubble ' + (isAdmin ? 'admin' : 'visitor') + '"><div class="chat-bubble-avatar">' + (isAdmin ? 'G' : (c.name[0] || '?')) + '</div><div>' + renderBubble(m) + '<span class="chat-bubble-time">' + formatTime(m.createdAt) + status + '</span></div></div>';
    });
    DOM.chatMessages.innerHTML = html;
    wireVoiceNotes(DOM.chatMessages);
    scrollToBottom();
  }

  function renderBubble(m) {
    if (m.fileUrl) {
      var ext = (m.fileUrl || '').split('.').pop().toLowerCase();
      if (['jpg','jpeg','png','gif','webp'].indexOf(ext) !== -1) return '<img src="' + m.fileUrl + '" class="chat-bubble-image" onclick="window.openLightbox(\'' + m.fileUrl + '\')" loading="lazy" />';

      if (['mp3','wav','ogg','webm'].indexOf(ext) !== -1) {
        // Match the VISITOR WIDGET's palette:
        //   visitor's message (their own)  → orange bubble, white bars
        //   admin's message (received)     → neutral bubble, gray bars + orange active
        var isOwnBubble = m.type === 'admin';
        return buildVoiceNoteHTML(m.fileUrl, isOwnBubble);
      }
      return '<a href="' + m.fileUrl + '" target="_blank" class="chat-bubble-file"><span class="material-symbols-outlined">description</span>' + (m.fileName || 'Download') + '</a>';
    }
    return Admin.escapeHTML(m.content || '');
  }

  function scrollToBottom() { setTimeout(function () { DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight; }, 100); }

  // ── Send ──
  async function sendMessage(e) {
    e.preventDefault();
    if (isSending) return;
    var content = DOM.chatMessageInput.value.trim();
    if (!content && !uploadedFiles.length) return;
    if (!activeConversationId) return;
    var c = conversations[activeConversationId]; if (!c) return;

    isSending = true;
    if (DOM.chatSendBtn) { DOM.chatSendBtn.disabled = true; DOM.chatSendBtn.style.opacity = '0.5'; }

    var messagesToSend = [];
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach(function (f) { messagesToSend.push({ fileUrl: f.url, fileName: f.name, content: content || '📎 ' + f.name }); });
    } else { messagesToSend.push({ content: content }); }

    for (var i = 0; i < messagesToSend.length; i++) {
      var fdata = messagesToSend[i];
      var tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      var msg = {
        _id: tempId, conversationId: activeConversationId, content: fdata.content,
        sender: { name: 'Ganiyu Usman', email: 'admin@geeooh.dev' }, type: 'admin',
        read: false, delivered: false, replied: true, createdAt: new Date().toISOString(), pending: true
      };
      if (fdata.fileUrl) { msg.fileUrl = fdata.fileUrl; msg.fileName = fdata.fileName; }

      c.messages.push(msg); c.lastActivity = msg.createdAt;
      renderMessages(c); scrollToBottom();

      try {
        var res = await Admin.request(Admin.API_BASE + '/messages', { method: 'POST', body: JSON.stringify(msg) });
        var existing = c.messages.find(function(m) { return m._id === tempId; });
        if (res.success && res.message) {
          if (existing) { existing._id = res.message._id; existing.pending = false; }
        } else {
          if (existing) { existing.pending = false; existing.failed = true; }
        }
      } catch (err) {
        var fail = c.messages.find(function(m) { return m._id === tempId; });
        if (fail) { fail.pending = false; fail.failed = true; }
      }
    }

    renderMessages(c); scrollToBottom();
    DOM.chatMessageInput.value = ''; clearUploads();

    isSending = false;
    if (DOM.chatSendBtn) { DOM.chatSendBtn.disabled = false; DOM.chatSendBtn.style.opacity = '1'; }
  }

  async function uploadFile(file) { var fd = new FormData(); fd.append('file', file); try { var r = await fetch(Admin.API_BASE + '/upload/public', { method: 'POST', body: fd }); var d = await r.json(); return d.success ? d.url : null; } catch (e) { return null; } }
  async function handleFiles(files) {
    var maxSize = 10 * 1024 * 1024;
    for (var i = 0; i < files.length; i++) {
      if (files[i].size > maxSize) {
        var sizeMB = (files[i].size / (1024 * 1024)).toFixed(1);
        Admin.showToast('File "' + files[i].name + '" is ' + sizeMB + 'MB. Max is 10MB.', 'error');
        continue;
      }
      var url = await uploadFile(files[i]);
      if (url) {
        uploadedFiles.push({ url, name: files[i].name, type: files[i].type });
      } else {
        Admin.showToast('Failed to upload "' + files[i].name + '"', 'error');
      }
    }
    renderUploadPreviews();
  }

  function renderUploadPreviews() {
    if (!uploadedFiles.length) { DOM.uploadPreviewBar.style.display = 'none'; return; }
    DOM.uploadPreviewBar.style.display = 'flex';
    DOM.uploadPreviewList.innerHTML = uploadedFiles.map(function (f, i) {
      var isImg = f.type && f.type.startsWith('image/'), isAud = f.type && f.type.startsWith('audio/');
      if (isImg) return '<div class="upload-preview-item"><img src="' + f.url + '" /><button class="upload-preview-remove" data-idx="' + i + '">×</button></div>';
      if (isAud) return '<div class="upload-preview-item" style="width:auto;padding:6px 10px;"><audio src="' + f.url + '" controls style="height:28px;width:100px;"></audio><button class="upload-preview-remove" data-idx="' + i + '">×</button></div>';
      return '<div class="upload-preview-item"><div class="file-preview">' + (f.name||'').substring(0,10) + '</div><button class="upload-preview-remove" data-idx="' + i + '">×</button></div>';
    }).join('');
    DOM.uploadPreviewList.querySelectorAll('.upload-preview-remove').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); uploadedFiles.splice(parseInt(b.dataset.idx), 1); renderUploadPreviews(); }); });
  }

  function clearUploads() { uploadedFiles = []; DOM.uploadPreviewBar.style.display = 'none'; if (DOM.fileInput) DOM.fileInput.value = ''; }
  window.openLightbox = function (url) { var lb = document.createElement('div'); lb.className = 'chat-lightbox'; lb.innerHTML = '<img src="' + url + '" />'; lb.addEventListener('click', function () { lb.remove(); }); document.body.appendChild(lb); };
  function updateBadge() { var t = Object.values(conversations).reduce(function (s, c) { return s + c.unread; }, 0); if (DOM.messageBadge) { DOM.messageBadge.style.display = t > 0 ? 'inline-block' : 'none'; DOM.messageBadge.textContent = t; } }
  function updateConversationCount() { if (DOM.conversationCount) DOM.conversationCount.textContent = Object.values(conversations).length + ' conversations'; }

  // ── Socket ──
  function connectSocket() {
    if (typeof io === 'undefined') return;
    socket = io('http://localhost:5000', { transports: ['websocket', 'polling'], reconnection: true });

    socket.on('connect', function () {
      console.log('✅ Admin socket connected');
      socket.emit('user-join', { role: 'admin' });
    });

    socket.on('connect_error', function (err) {
      console.log('❌ Socket error:', err.message);
    });

    socket.on('admin-notification', function (data) {
      if (data.type === 'new-message' && data.message) handleIncoming(data.message);
    });

    socket.on('typing', function (data) {
      if (data.conversationId === activeConversationId) {
        DOM.typingIndicator.style.display = 'flex';
        DOM.typingText.textContent = (data.name || 'Someone') + ' is typing...';
        clearTimeout(window._tt);
        window._tt = setTimeout(function () { DOM.typingIndicator.style.display = 'none'; }, 2000);
      }
    });

    socket.on('messages-delivered', function (data) {
      var c = conversations[data.conversationId];
      if (c) {
        c.messages.forEach(function (m) { if (m.type === 'admin' && !m.read) m.delivered = true; });
        if (activeConversationId === data.conversationId) renderMessages(c);
        renderContactList();
      }
    });

    socket.on('messages-read', function (data) {
      var c = conversations[data.conversationId];
      if (c) {
        c.messages.forEach(function (m) { if (m.type === 'admin') m.read = true; });
        if (activeConversationId === data.conversationId) renderMessages(c);
        renderContactList();
      }
    });

    socket.on('user-online', function (data) {
      onlineUsers[data.conversationId] = true;
      renderContactList();
      if (activeConversationId === data.conversationId) {
        DOM.chatActiveStatus.textContent = 'Online';
        DOM.chatActiveStatus.style.color = 'var(--admin-green)';
      }
    });

    socket.on('user-offline', function (data) {
      delete onlineUsers[data.conversationId];
      renderContactList();
      if (activeConversationId === data.conversationId) {
        DOM.chatActiveStatus.textContent = '';
      }
    });
  }

  function handleIncoming(m) {
    if (m.type === 'admin') return;
    var cid = m.conversationId || m.sender?.email || 'unknown';
    if (!conversations[cid]) conversations[cid] = { id: cid, name: m.sender?.name || 'Visitor', email: m.sender?.email || '', messages: [], unread: 0, resolved: false, lastActivity: m.createdAt };
    conversations[cid].messages.push(m);

    if (!m.read && m.type !== 'admin' && activeConversationId !== cid) {
      conversations[cid].unread++;
    }

    if (activeConversationId === cid) {
      conversations[cid].unread = 0;
      m.read = true;
    }

    conversations[cid].lastActivity = m.createdAt;
    renderContactList(); updateBadge(); updateConversationCount();

    if (activeConversationId === cid) {
      renderMessages(conversations[cid]);
      scrollToBottom();
      setTimeout(function() { scrollToBottom(); }, 200);
      if (socket && socket.connected) {
        socket.emit('admin-mark-read', { conversationId: cid });
      }
    } else {
      Admin.showToast('New message from ' + (m.sender?.name || 'Visitor'), 'info');
    }
  }

  // ── Actions ──
  function toggleMenu() { DOM.conversationMenu.style.display = DOM.conversationMenu.style.display === 'none' ? 'block' : 'none'; }
  function markResolved() { if (!activeConversationId) return; conversations[activeConversationId].resolved = true; renderContactList(); updateBadge(); DOM.conversationMenu.style.display = 'none'; }
  function markUnread() { if (!activeConversationId) return; conversations[activeConversationId].unread = 1; renderContactList(); updateBadge(); DOM.conversationMenu.style.display = 'none'; }
  function deleteConversation() { if (!activeConversationId || !confirm('Delete?')) return; delete conversations[activeConversationId]; activeConversationId = null; DOM.chatActive.style.display = 'none'; DOM.chatEmpty.style.display = 'flex'; renderContactList(); updateBadge(); DOM.conversationMenu.style.display = 'none'; }

  function formatTime(d) { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }

  // ── Events ──
  function bindEvents() {
    DOM.chatSearch.addEventListener('input', function () { renderContactList(); });
    if (DOM.chatFilterBtn) DOM.chatFilterBtn.addEventListener('click', function () { DOM.chatSearch.value = ''; DOM.chatSearch.focus(); renderContactList(); });
    DOM.chatFilterTabs.addEventListener('click', function (e) { var t = e.target.closest('.filter-tab'); if (!t) return; DOM.chatFilterTabs.querySelectorAll('.filter-tab').forEach(function (x) { x.classList.remove('active'); }); t.classList.add('active'); currentFilter = t.dataset.filter; renderContactList(); });
    DOM.chatBackBtn.addEventListener('click', function () { DOM.chatSidebar.classList.remove('hidden'); DOM.chatMain.classList.remove('active'); activeConversationId = null; DOM.chatEmpty.style.display = 'flex'; DOM.chatActive.style.display = 'none'; });
    DOM.chatSendForm.addEventListener('submit', sendMessage);
    DOM.chatMessageInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }
      if (socket && socket.connected && activeConversationId) {
        socket.emit('admin-mark-read', { conversationId: activeConversationId });
      }
    });
    DOM.chatMessages.addEventListener('click', function () {
      if (socket && socket.connected && activeConversationId) {
        socket.emit('admin-mark-read', { conversationId: activeConversationId });
      }
    });
    DOM.conversationMenuBtn.addEventListener('click', function (e) { e.stopPropagation(); toggleMenu(); });
    DOM.markResolvedBtn.addEventListener('click', markResolved); DOM.markUnreadBtn.addEventListener('click', markUnread); DOM.deleteConversationBtn.addEventListener('click', deleteConversation);
    document.addEventListener('click', function () { DOM.conversationMenu.style.display = 'none'; });
    if (DOM.attachBtn) DOM.attachBtn.addEventListener('click', function () { DOM.fileInput.click(); });
    if (DOM.fileInput) DOM.fileInput.addEventListener('change', function () { handleFiles(this.files); });
    if (DOM.clearUploads) DOM.clearUploads.addEventListener('click', clearUploads);
    if (DOM.voiceBtn) DOM.voiceBtn.addEventListener('click', startRecording);
    if (DOM.voiceCancelBtn) DOM.voiceCancelBtn.addEventListener('click', cancelRecording);
    if (DOM.voiceSendBtn) DOM.voiceSendBtn.addEventListener('click', stopRecording);
    if (DOM.quickRepliesBar) DOM.quickRepliesBar.addEventListener('click', function (e) { var b = e.target.closest('.quick-reply-btn'); if (b) { DOM.chatMessageInput.value = b.dataset.reply; DOM.chatMessageInput.focus(); } });
    if (DOM.emojiBtn) DOM.emojiBtn.addEventListener('click', function () { var emojis = ['😊','👋','🎉','👍','❤️','🚀','💡','✅']; var p = document.createElement('div'); p.className = 'emoji-picker'; p.innerHTML = emojis.map(function(e) { return '<button>' + e + '</button>'; }).join(''); p.addEventListener('click', function(ev) { var b = ev.target.closest('button'); if (b) { DOM.chatMessageInput.value += b.textContent; DOM.chatMessageInput.focus(); } p.remove(); }); document.querySelector('.chat-input-bar').appendChild(p); setTimeout(function () { document.addEventListener('click', function close(ev) { if (!p.contains(ev.target)) { p.remove(); document.removeEventListener('click', close); } }); }, 100); });
  }

  async function startRecording() { try { var s = await navigator.mediaDevices.getUserMedia({ audio: true }); mediaRecorder = new MediaRecorder(s); audioChunks = []; mediaRecorder.ondataavailable = function (e) { audioChunks.push(e.data); }; mediaRecorder.onstop = async function () { var b = new Blob(audioChunks, { type: 'audio/webm' }); var u = await uploadFile(new File([b], 'voice-note.webm', { type: 'audio/webm' })); if (u) { uploadedFiles.push({ url: u, name: 'Voice Note', type: 'audio/webm' }); renderUploadPreviews(); } s.getTracks().forEach(function (t) { t.stop(); }); }; mediaRecorder.start(); DOM.voiceRecordingBar.style.display = 'flex'; DOM.chatSendForm.style.display = 'none'; recordingStart = Date.now(); recordingTimer = setInterval(function () { var e = Math.floor((Date.now() - recordingStart)/1000); DOM.voiceRecordingTime.textContent = String(Math.floor(e/60)).padStart(2,'0')+':'+String(e%60).padStart(2,'0'); }, 1000); } catch (err) { Admin.showToast('Mic denied', 'error'); } }
  function stopRecording() { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); DOM.voiceRecordingBar.style.display = 'none'; DOM.chatSendForm.style.display = 'flex'; clearInterval(recordingTimer); }
  function cancelRecording() { if (mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop(); audioChunks = []; DOM.voiceRecordingBar.style.display = 'none'; DOM.chatSendForm.style.display = 'flex'; clearInterval(recordingTimer); }

  loadConversations(); connectSocket(); bindEvents();
})();
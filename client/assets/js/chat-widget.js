// ===== UNIFIED CHAT WIDGET — Visitor Side (Complete) =====

// ── Shared voice-note renderer + wiring (identical to admin) ──
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

class ChatWidget {
  constructor() {
    this.widget = document.getElementById('chatWidget');
    this.conversationId = localStorage.getItem('chat_conversation_id') || this.generateId();
    this.isOpen = false;
    this.isMaximized = false;
    this.socket = null;
    this.unreadCount = 0;
    this.userName = localStorage.getItem('chat_user_name') || '';
    this.keepChat = localStorage.getItem('chat_keep') !== 'false';
    this.uploadedFiles = [];
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingStart = 0;
    this.recordingTimer = null;

    if (!this.widget) return;
    this.buildUI();
    this.init();
  }

  generateId() {
    var id = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chat_conversation_id', id);
    return id;
  }

  buildUI() {
    this.widget.innerHTML = '';
    var h = '';
    h += '<div class="chat-toggle" id="chatToggle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg><span class="chat-badge" id="chatBadge" style="display:none">0</span></div>';
    h += '<div class="chat-window" id="chatWindow">';
    h += '<div class="chat-header"><div class="chat-header-info"><div class="chat-avatar">G</div><div><h4>Ganiyu Usman</h4><span class="chat-status">Online</span></div></div>';
    h += '<div class="chat-header-actions">';
    h += '<label class="chat-keep-toggle" title="Remember this chat"><input type="checkbox" id="keepChatToggle" ' + (this.keepChat ? 'checked' : '') + ' /><span>Keep</span></label>';
    h += '<button class="chat-header-btn" id="maximizeBtn" title="Maximize"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></button>';
    h += '<button class="chat-header-btn" id="chatClose" title="Close">×</button>';
    h += '</div></div>';
    h += '<div class="chat-messages" id="chatMessages"><div class="chat-date-divider"><span>Loading...</span></div></div>';
    h += '<div class="chat-typing" id="chatTyping" style="display:none"><div class="chat-typing-dots"><span></span><span></span><span></span></div><span class="chat-typing-text">Ganiyu is typing...</span></div>';
    h += '<div class="chat-input-bar">';
    h += '<div class="chat-upload-preview" id="uploadPreviewBar" style="display:none"><div class="chat-upload-list" id="uploadPreviewList"></div><button class="chat-upload-clear" id="clearUploads">✕</button></div>';
    h += '<form class="chat-input-form" id="chatSendForm">';
    h += '<input type="file" id="chatFileInput" accept="image/*,.pdf,.doc,.docx,.txt" multiple style="display:none" />';
    h += '<button type="button" class="chat-input-action" id="attachBtn" title="Attach file"><span class="material-symbols-outlined">attach_file</span></button>';
    h += '<button type="button" class="chat-input-action" id="emojiBtn" title="Emoji"><span class="material-symbols-outlined">mood</span></button>';
    h += '<div class="chat-input-wrapper"><input type="text" id="chatInput" placeholder="Type your reply..." autocomplete="off" /></div>';
    h += '<button type="button" class="chat-input-action" id="voiceBtn" title="Voice note"><span class="material-symbols-outlined">mic</span></button>';
    h += '<button type="submit" class="chat-send-btn" id="chatSend"><span class="material-symbols-outlined">send</span></button>';
    h += '</form>';
    h += '<div class="chat-voice-bar" id="voiceRecordingBar" style="display:none"><button class="chat-voice-cancel" id="voiceCancelBtn">✕</button><div class="chat-voice-indicator"><span class="chat-voice-dot"></span><span class="chat-voice-time" id="voiceRecordingTime">00:00</span></div><button class="chat-voice-send" id="voiceSendBtn"><span class="material-symbols-outlined">send</span></button></div>';
    h += '</div></div>';
    this.widget.innerHTML = h;
  }

  init() {
    this.toggleBtn = document.getElementById('chatToggle');
    this.window = document.getElementById('chatWindow');
    this.messagesContainer = document.getElementById('chatMessages');
    this.input = document.getElementById('chatInput');
    this.badge = document.getElementById('chatBadge');

    this.toggleBtn.addEventListener('click', () => this.toggleChat());
    document.getElementById('chatClose').addEventListener('click', () => this.closeChat());
    document.getElementById('maximizeBtn').addEventListener('click', () => this.toggleMaximize());

    var keepToggle = document.getElementById('keepChatToggle');
    if (keepToggle) {
      keepToggle.addEventListener('change', (e) => {
        this.keepChat = e.target.checked;
        localStorage.setItem('chat_keep', this.keepChat);
      });
    }

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.sendMessage(); }
      if (this.isOpen && this.socket && this.socket.connected) {
        this.socket.emit('mark-read', { conversationId: this.conversationId });
      }
    });

    document.getElementById('chatSendForm').addEventListener('submit', (e) => { e.preventDefault(); this.sendMessage(); });
    document.getElementById('attachBtn').addEventListener('click', () => document.getElementById('chatFileInput').click());
    document.getElementById('chatFileInput').addEventListener('change', (e) => this.handleFiles(e.target.files));
    document.getElementById('clearUploads').addEventListener('click', () => this.clearUploads());
    document.getElementById('emojiBtn').addEventListener('click', () => this.showEmojiPicker());
    document.getElementById('voiceBtn').addEventListener('click', () => this.startRecording());
    document.getElementById('voiceCancelBtn').addEventListener('click', () => this.cancelRecording());
    document.getElementById('voiceSendBtn').addEventListener('click', () => this.stopRecording());

    this.messagesContainer.addEventListener('click', () => {
      if (this.isOpen && this.socket && this.socket.connected) {
        this.socket.emit('mark-read', { conversationId: this.conversationId });
      }
    });

    this.showWelcome();
    this.loadHistory();
    this.initSocket();
  }

  async loadHistory() {
    if (!this.keepChat) { this.messagesContainer.innerHTML = ''; this.showWelcome(); return; }
    try {
      var r = await fetch('http://localhost:5000/api/v1/public/messages/' + this.conversationId);
      var d = await r.json();
      if (d.success && d.messages && d.messages.length > 0) {
        this.messagesContainer.innerHTML = '';
        d.messages.forEach(m => this.renderMessage(m, m.type === 'admin' ? 'admin' : 'user'));
        this.scrollToBottom();
      } else {
        this.messagesContainer.innerHTML = '';
        this.showWelcome();
      }
    } catch (e) {
      this.messagesContainer.innerHTML = '';
      this.showWelcome();
    }
  }

  showWelcome() {
    if (this.userName) return;
    setTimeout(() => {
      this.renderMessage({ content: '👋 Welcome! What should I call you?', sender: { name: 'Ganiyu' }, type: 'admin', createdAt: new Date().toISOString() }, 'admin');
      this.input.placeholder = 'Type your name here...';
    }, 300);
  }

  initSocket() {
    if (typeof io === 'undefined') return;
    this.socket = io('http://localhost:5000', { transports: ['websocket', 'polling'], reconnection: true });
    this.socket.on('connect', () => { this.socket.emit('user-join', { conversationId: this.conversationId, name: this.userName || 'Visitor' }); });
    this.socket.on('new-message', (msg) => {
      if (msg.type === 'admin') {
        this.renderMessage(msg, 'admin');
        if (!this.isOpen) { this.unreadCount++; this.updateBadge(); }
        if (this.isOpen && this.socket && this.socket.connected) {
          this.socket.emit('mark-read', { conversationId: this.conversationId });
        }
      }
    });

    this.socket.on('admin-reply', (msg) => {
      this.renderMessage(msg, 'admin');
      if (!this.isOpen) { this.unreadCount++; this.updateBadge(); }
      if (this.isOpen && this.socket && this.socket.connected) {
        this.socket.emit('mark-read', { conversationId: this.conversationId });
      }
    });
    this.socket.on('message-status', (data) => {
      if (data.messageId) {
        var el = document.getElementById('msg-' + data.messageId);
        if (el) {
          var s = el.querySelector('.msg-status');
          if (s) {
            if (data.status === 'delivered') { s.textContent = '✓✓'; s.style.opacity = '1'; }
            if (data.status === 'sent') { s.textContent = '✓'; s.style.opacity = '0.6'; }
          }
        }
      }
      if (data.status === 'read-all') {
        var allStatus = document.querySelectorAll('.chat-message.user .msg-status');
        allStatus.forEach(function(s) { s.textContent = '✓✓'; s.style.color = '#3b82f6'; s.style.opacity = '1'; });
      }
    });
  }

  updateMessageStatus(msgId, status) {
    var el = document.getElementById('msg-' + msgId);
    if (el) {
      var s = el.querySelector('.msg-status');
      if (s) {
        if (status === 'delivered') s.innerHTML = '✓✓';
        if (status === 'read') { s.innerHTML = '✓✓'; s.style.color = '#3b82f6'; }
      }
    }
  }

  toggleChat() { this.isOpen ? this.closeChat() : this.openChat(); }
  openChat() {
    this.window.classList.add('open'); this.isOpen = true; this.unreadCount = 0; this.updateBadge();
    setTimeout(() => this.input.focus(), 300); this.scrollToBottom();
    if (this.socket && this.socket.connected) this.socket.emit('mark-read', { conversationId: this.conversationId });
  }
  closeChat() { this.window.classList.remove('open'); this.isOpen = false; if (this.isMaximized) this.toggleMaximize(); }
  toggleMaximize() { this.isMaximized = !this.isMaximized; this.window.classList.toggle('maximized', this.isMaximized); this.scrollToBottom(); }

  sendMessage() {
    var content = this.input.value.trim();
    if (!content && !this.uploadedFiles.length) return;

    if (!this.userName && content && content.length < 30 && content.indexOf('?') === -1) {
      this.userName = content; localStorage.setItem('chat_user_name', this.userName);
      this.input.value = ''; this.input.placeholder = 'Type your reply...';
      this.renderMessage({ content: content, sender: { name: this.userName }, type: 'user', createdAt: new Date().toISOString() }, 'user');
      this.renderMessage({ content: 'Nice to meet you, <strong>' + this.userName + '</strong>! How can I help?', sender: { name: 'Ganiyu' }, type: 'admin', createdAt: new Date().toISOString() }, 'admin');
      if (this.socket) this.socket.emit('user-join', { conversationId: this.conversationId, name: this.userName });
      return;
    }

    if (!this.userName && content) { this.userName = content.split(' ').slice(0, 2).join(' ') || 'Visitor'; localStorage.setItem('chat_user_name', this.userName); this.input.placeholder = 'Type your reply...'; }

    var msgs = [];
    if (this.uploadedFiles.length > 0) {
      this.uploadedFiles.forEach(f => msgs.push({ fileUrl: f.url, fileName: f.name, content: content || '📎 ' + f.name }));
    } else { msgs.push({ content: content }); }

    msgs.forEach(payload => {
      var tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      var msg = {
        _id: tempId, conversationId: this.conversationId,
        sender: { name: this.userName || 'Visitor', email: 'visitor@website.com' },
        content: payload.content, type: 'visitor', createdAt: new Date().toISOString(), pending: true
      };
      if (payload.fileUrl) { msg.fileUrl = payload.fileUrl; msg.fileName = payload.fileName; }

      this.renderMessage(msg, 'user');

      if (this.socket && this.socket.connected) {
        this.socket.emit('send-message', msg, (response) => {
          if (response && response.messageId) {
            var el = document.getElementById('msg-' + tempId);
            if (el) {
              el.id = 'msg-' + response.messageId;
              var s = el.querySelector('.msg-status');
              if (s) { s.textContent = '✓'; s.style.opacity = '0.6'; s.style.cursor = 'default'; s.onclick = null; }
            }
          }
        });
      } else {
        var self = this;
        setTimeout(() => {
          var el = document.getElementById('msg-' + tempId);
          if (el) {
            var s = el.querySelector('.msg-status');
            if (s && s.textContent === '🕐') {
              s.textContent = '❌'; s.style.opacity = '1'; s.style.cursor = 'pointer'; s.style.color = '#ef4444';
              s.title = 'Tap to retry'; s.onclick = function() { self.retryMessage(msg, tempId); };
            }
          }
        }, 5000);
      }
    });

    this.input.value = ''; this.clearUploads(); this.scrollToBottom();
  }

  async handleFiles(files) {
    var maxSize = 10 * 1024 * 1024;
    for (var i = 0; i < files.length; i++) {
      if (files[i].size > maxSize) {
        var sizeMB = (files[i].size / (1024 * 1024)).toFixed(1);
        this.showError('File "' + files[i].name + '" is ' + sizeMB + 'MB. Maximum size is 10MB.');
        continue;
      }
      var url = await this.uploadFile(files[i]);
      if (url) {
        this.uploadedFiles.push({ url, name: files[i].name, type: files[i].type });
      } else {
        this.showError('Failed to upload "' + files[i].name + '". Please try again.');
      }
    }
    this.renderUploadPreviews();
  }

  async uploadFile(file) { var fd = new FormData(); fd.append('file', file); try { var r = await fetch('http://localhost:5000/api/v1/upload/public', { method: 'POST', body: fd }); var d = await r.json(); return d.success ? d.url : null; } catch (e) { return null; } }

  renderUploadPreviews() {
    var bar = document.getElementById('uploadPreviewBar'), list = document.getElementById('uploadPreviewList');
    if (!this.uploadedFiles.length) { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    list.innerHTML = this.uploadedFiles.map((f, i) => {
      var isImg = f.type && f.type.startsWith('image/'), isAud = f.type && f.type.startsWith('audio/');
      if (isImg) return '<div class="chat-upload-item"><img src="' + f.url + '" /><button class="chat-upload-remove" data-idx="' + i + '">×</button></div>';
      if (isAud) return '<div class="chat-upload-item" style="width:auto;padding:6px 10px;"><audio src="' + f.url + '" controls style="height:28px;width:100px;"></audio><button class="chat-upload-remove" data-idx="' + i + '">×</button></div>';
      return '<div class="chat-upload-item"><div class="file-icon">' + (f.name||'').substring(0,10) + '</div><button class="chat-upload-remove" data-idx="' + i + '">×</button></div>';
    }).join('');
    list.querySelectorAll('.chat-upload-remove').forEach(b => b.addEventListener('click', function(e) { e.stopPropagation(); window.chatWidget.uploadedFiles.splice(parseInt(this.dataset.idx), 1); window.chatWidget.renderUploadPreviews(); }));
  }
  clearUploads() { this.uploadedFiles = []; this.renderUploadPreviews(); document.getElementById('chatFileInput').value = ''; }

  showEmojiPicker() {
    var existing = document.querySelector('.emoji-picker'); if (existing) { existing.remove(); return; }
    var emojis = ['😊','👋','🎉','👍','❤️','🚀','💡','✅','🙏','😄','🔥','⭐'];
    var picker = document.createElement('div'); picker.className = 'emoji-picker';
    picker.innerHTML = emojis.map(e => '<button>' + e + '</button>').join('');
    picker.addEventListener('click', (ev) => { var b = ev.target.closest('button'); if (b) { this.input.value += b.textContent; this.input.focus(); } picker.remove(); });
    document.addEventListener('click', function close(e) { if (!picker.contains(e.target)) { picker.remove(); document.removeEventListener('click', close); } });
    document.querySelector('.chat-input-bar').appendChild(picker);
  }

  async startRecording() {
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream); this.audioChunks = [];
      this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
      this.mediaRecorder.onstop = async () => {
        var blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        var url = await this.uploadFile(new File([blob], 'voice-note.webm', { type: 'audio/webm' }));
        if (url) { this.uploadedFiles.push({ url, name: 'Voice Note', type: 'audio/webm' }); this.renderUploadPreviews(); }
        stream.getTracks().forEach(t => t.stop());
      };
      this.mediaRecorder.start();
      document.getElementById('voiceRecordingBar').style.display = 'flex'; document.getElementById('chatSendForm').style.display = 'none';
      this.recordingStart = Date.now();
      this.recordingTimer = setInterval(() => { var e = Math.floor((Date.now() - this.recordingStart)/1000); document.getElementById('voiceRecordingTime').textContent = String(Math.floor(e/60)).padStart(2,'0')+':'+String(e%60).padStart(2,'0'); }, 1000);
    } catch (err) {}
  }
  stopRecording() { if (this.mediaRecorder && this.mediaRecorder.state === 'recording') this.mediaRecorder.stop(); document.getElementById('voiceRecordingBar').style.display = 'none'; document.getElementById('chatSendForm').style.display = 'flex'; clearInterval(this.recordingTimer); }
  cancelRecording() { if (this.mediaRecorder && this.mediaRecorder.state === 'recording') this.mediaRecorder.stop(); this.audioChunks = []; document.getElementById('voiceRecordingBar').style.display = 'none'; document.getElementById('chatSendForm').style.display = 'flex'; clearInterval(this.recordingTimer); }

  showError(message) {
    var el = document.createElement('div');
    el.className = 'chat-error-toast';
    el.textContent = message;
    el.style.cssText = 'position:absolute;bottom:70px;left:50%;transform:translateX(-50%);background:#ef4444;color:#fff;padding:8px 16px;border-radius:20px;font-size:0.78rem;font-weight:500;z-index:100;white-space:nowrap;animation:fadeInOut 3s ease forwards;';
    document.querySelector('.chat-window').appendChild(el);
    setTimeout(function() { el.remove(); }, 3000);
  }

  retryMessage(msg, tempId) {
    var el = document.getElementById('msg-' + tempId);
    if (el) {
      var s = el.querySelector('.msg-status');
      if (s) { s.textContent = '🕐'; s.style.opacity = '1'; s.style.color = ''; s.style.cursor = 'default'; s.onclick = null; }
    }
    if (this.socket && this.socket.connected) {
      this.socket.emit('send-message', msg, (response) => {
        if (response && response.messageId) {
          if (el) {
            el.id = 'msg-' + response.messageId;
            var st = el.querySelector('.msg-status');
            if (st) { st.textContent = '✓'; st.style.opacity = '0.6'; }
          }
        }
      });
    }
  }

  renderMessage(msg, type) {
    var el = document.createElement('div');
    el.className = 'chat-message ' + type;
    if (msg._id) el.id = 'msg-' + msg._id;
    var time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    var content = '';
    if (msg.fileUrl) {
      var ext = (msg.fileUrl || '').split('.').pop().toLowerCase();
      if (['jpg','jpeg','png','gif','webp'].indexOf(ext) !== -1) {
        content = '<img src="' + msg.fileUrl + '" onclick="window.open(this.src)" />';
      } else if (['mp3','wav','ogg','webm'].indexOf(ext) !== -1) {
        var isOwnBubble = (type === 'user');
        content = buildVoiceNoteHTML(msg.fileUrl, isOwnBubble);
      } else {
        content = '<a href="' + msg.fileUrl + '" target="_blank" style="text-decoration:underline;">📎 ' + (msg.fileName || 'Download') + '</a>';
      }
    } else {
      content = this.formatMsg(msg.content || '');
    }

    var statusHTML = '';
    if (type === 'user') {
      if (msg.pending) {
        statusHTML = ' <span class="msg-status pending" style="font-size:0.6rem;opacity:1;">🕐</span>';
      } else if (msg.failed) {
        statusHTML = ' <span class="msg-status failed" style="font-size:0.6rem;color:#ef4444;cursor:pointer;" title="Tap to retry">❌</span>';
      } else {
        statusHTML = ' <span class="msg-status sent" style="font-size:0.6rem;opacity:0.6;">✓</span>';
      }
    }

    el.innerHTML = '<div class="message-bubble"><div class="message-content">' + content + '</div></div><div class="message-time">' + time + statusHTML + '</div>';
    this.messagesContainer.appendChild(el);
    wireVoiceNotes(this.messagesContainer);
    this.scrollToBottom();
  }

  formatMsg(c) { return String(c).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/`(.*?)`/g, '<code>$1</code>').replace(/\n/g, '<br>'); }
  updateBadge() { if (this.unreadCount > 0) { this.badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount; this.badge.style.display = 'flex'; } else this.badge.style.display = 'none'; }
  scrollToBottom() { setTimeout(() => { this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight; }, 100); }
}

document.addEventListener('DOMContentLoaded', () => { window.chatWidget = new ChatWidget(); });
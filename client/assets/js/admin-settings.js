(function () {
  'use strict';

  if (!Admin.checkAuth()) return;

  let currentSettings = null;

  const DOM = {
    form: document.getElementById('settingsForm'),
    heroTitle: document.getElementById('heroTitle'),
    heroSubtitle: document.getElementById('heroSubtitle'),
    heroDescription: document.getElementById('heroDescription'),
    heroCtaText: document.getElementById('heroCtaText'),
    heroCtaLink: document.getElementById('heroCtaLink'),
    aboutContent: document.getElementById('aboutContent'),
    resumeUrl: document.getElementById('resumeUrl'),
    socialGithub: document.getElementById('socialGithub'),
    socialLinkedin: document.getElementById('socialLinkedin'),
    socialTwitter: document.getElementById('socialTwitter'),
    socialInstagram: document.getElementById('socialInstagram'),
    contactEmail: document.getElementById('contactEmail'),
    contactPhone: document.getElementById('contactPhone'),
    contactWhatsapp: document.getElementById('contactWhatsapp'),
    contactAddress: document.getElementById('contactAddress'),
    chatEnabled: document.getElementById('chatEnabled'),
    chatWelcome: document.getElementById('chatWelcome'),
    chatOffline: document.getElementById('chatOffline'),
    uploadProfileBtn: document.getElementById('uploadProfileBtn'),
    uploadResumeBtn: document.getElementById('uploadResumeBtn'),
    uploadGeneralBtn: document.getElementById('uploadGeneralBtn'),
    profilePreview: document.getElementById('profilePreview'),
    profileUploadProgress: document.getElementById('profileUploadProgress'),
    resumeProgress: document.getElementById('resumeProgress'),
    generalUploadProgress: document.getElementById('generalUploadProgress'),
    generalUploadResult: document.getElementById('generalUploadResult'),
  };

  // ── 1. LOAD SETTINGS ──
  async function loadSettings() {
    try {
      const data = await Admin.request(Admin.API_BASE + '/admin/settings');
      if (data.success && data.settings) {
        currentSettings = data.settings;
        populateForm(data.settings);
      }
    } catch (err) {
      Admin.showToast('Failed to load settings', 'error');
    }
  }

  function populateForm(s) {
    const hero = s.heroSection || {};
    const about = s.aboutSection || {};
    const social = s.socialLinks || {};
    const contact = s.contactInfo || {};
    const chat = s.chat || {};

    if (DOM.heroTitle) DOM.heroTitle.value = hero.title || '';
    if (DOM.heroSubtitle) DOM.heroSubtitle.value = hero.subtitle || '';
    if (DOM.heroDescription) DOM.heroDescription.value = hero.description || '';
    if (DOM.heroCtaText) DOM.heroCtaText.value = hero.ctaText || '';
    if (DOM.heroCtaLink) DOM.heroCtaLink.value = hero.ctaLink || '';
    if (DOM.aboutContent) DOM.aboutContent.value = about.content || '';
    if (DOM.resumeUrl) DOM.resumeUrl.value = about.resumeUrl || '';
    if (DOM.socialGithub) DOM.socialGithub.value = social.github || '';
    if (DOM.socialLinkedin) DOM.socialLinkedin.value = social.linkedin || '';
    if (DOM.socialTwitter) DOM.socialTwitter.value = social.twitter || '';
    if (DOM.socialInstagram) DOM.socialInstagram.value = social.instagram || '';
    if (DOM.contactEmail) DOM.contactEmail.value = contact.email || '';
    if (DOM.contactPhone) DOM.contactPhone.value = contact.phone || '';
    if (DOM.contactWhatsapp) DOM.contactWhatsapp.value = contact.whatsapp || '';
    if (DOM.contactAddress) DOM.contactAddress.value = contact.address || '';
    if (DOM.chatEnabled) DOM.chatEnabled.checked = chat.enabled !== false;
    if (DOM.chatWelcome) DOM.chatWelcome.value = chat.welcomeMessage || '';
    if (DOM.chatOffline) DOM.chatOffline.value = chat.offlineMessage || '';
  }

  // ── 2. SAVE SETTINGS ──
  async function saveSettings(e) {
    e.preventDefault();

    const payload = {
      heroSection: {
        title: DOM.heroTitle ? DOM.heroTitle.value.trim() : '',
        subtitle: DOM.heroSubtitle ? DOM.heroSubtitle.value.trim() : '',
        description: DOM.heroDescription ? DOM.heroDescription.value.trim() : '',
        ctaText: DOM.heroCtaText ? DOM.heroCtaText.value.trim() : '',
        ctaLink: DOM.heroCtaLink ? DOM.heroCtaLink.value.trim() : '',
      },
      aboutSection: {
        content: DOM.aboutContent ? DOM.aboutContent.value.trim() : '',
        resumeUrl: DOM.resumeUrl ? DOM.resumeUrl.value.trim() : '',
      },
      socialLinks: {
        github: DOM.socialGithub ? DOM.socialGithub.value.trim() : '',
        linkedin: DOM.socialLinkedin ? DOM.socialLinkedin.value.trim() : '',
        twitter: DOM.socialTwitter ? DOM.socialTwitter.value.trim() : '',
        instagram: DOM.socialInstagram ? DOM.socialInstagram.value.trim() : '',
      },
      contactInfo: {
        email: DOM.contactEmail ? DOM.contactEmail.value.trim() : '',
        phone: DOM.contactPhone ? DOM.contactPhone.value.trim() : '',
        whatsapp: DOM.contactWhatsapp ? DOM.contactWhatsapp.value.trim() : '',
        address: DOM.contactAddress ? DOM.contactAddress.value.trim() : '',
      },
      chat: {
        enabled: DOM.chatEnabled ? DOM.chatEnabled.checked : true,
        welcomeMessage: DOM.chatWelcome ? DOM.chatWelcome.value.trim() : '',
        offlineMessage: DOM.chatOffline ? DOM.chatOffline.value.trim() : '',
      },
    };

    try {
      const data = await Admin.request(Admin.API_BASE + '/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (data.success) {
        Admin.showToast('Settings saved!', 'success');
      }
    } catch (err) {
      Admin.showToast('Failed to save settings', 'error');
    }
  }

  // ── 3. UPLOAD FILE ──
  async function uploadFile(file, type, progressEl, resultEl) {
    if (!file) {
      Admin.showToast('Please select a file first', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    if (progressEl) {
      progressEl.style.display = 'block';
      progressEl.textContent = 'Uploading...';
    }

    try {
      const token = Admin.getToken();
      const res = await fetch(Admin.API_BASE + '/upload', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        Admin.showToast('File uploaded!', 'success');
        if (resultEl) {
          resultEl.innerHTML = '<span style="color:var(--admin-green);font-size:0.85rem;">✓ ' + Admin.escapeHTML(data.url || data.fileUrl || 'Uploaded') + '</span>';
        }
        if (type === 'profile' && data.url && DOM.profilePreview) {
          DOM.profilePreview.innerHTML = '<img src="' + data.url + '" alt="Profile" style="width:80px;height:80px;border-radius:12px;object-fit:cover;margin-top:8px;" />';
        }
        return data;
      }
    } catch (err) {
      Admin.showToast('Upload failed', 'error');
    } finally {
      if (progressEl) {
        progressEl.style.display = 'none';
      }
    }
  }

  // ── 4. ACCENT COLOR THEME LOGIC ──
  function initThemeColors() {
    const colorBtns = document.querySelectorAll('.theme-color-btn');
    if (!colorBtns.length) return;

    // Highlight current active color
    async function loadCurrentColor() {
      try {
        const res = await Admin.request(Admin.API_BASE + '/settings');
        if (res.success && res.settings) {
          const current = res.settings.accentColor || 'orange';
          document.querySelectorAll('.theme-color-btn').forEach(b => b.style.borderColor = 'transparent');
          const activeBtn = document.querySelector(`.theme-color-btn[data-color="${current}"]`);
          if (activeBtn) activeBtn.style.borderColor = 'var(--admin-text)';
        }
      } catch (e) { console.error(e); }
    }
    loadCurrentColor();

    // Handle color click
    colorBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const color = btn.dataset.color;
        
        // 1. Apply instantly for immediate visual feedback
        document.body.classList.remove('accent-orange', 'accent-blue', 'accent-emerald', 'accent-purple', 'accent-rose');
        if (color !== 'orange') document.body.classList.add(`accent-${color}`);
        
        // 2. Update button rings
        document.querySelectorAll('.theme-color-btn').forEach(b => b.style.borderColor = 'transparent');
        btn.style.borderColor = 'var(--admin-text)';

        // 3. Save to Database
        try {
          const res = await Admin.request(Admin.API_BASE + '/settings', {
            method: 'PUT',
            body: JSON.stringify({ accentColor: color })
          });
          if (res.success) {
            Admin.showToast('Global theme updated!', 'success');
          }
        } catch (err) {
          Admin.showToast('Failed to save theme', 'error');
        }
      });
    });
  }

  // ── 5. BIND EVENTS & INIT ──
  function init() {
    // Form submit
    if (DOM.form) DOM.form.addEventListener('submit', saveSettings);

    // Upload buttons
    if (DOM.uploadProfileBtn) {
      DOM.uploadProfileBtn.addEventListener('click', function () {
        const fileInput = document.getElementById('profileImageUpload');
        if (fileInput) uploadFile(fileInput.files[0], 'profile', DOM.profileUploadProgress, null);
      });
    }

    if (DOM.uploadResumeBtn) {
      DOM.uploadResumeBtn.addEventListener('click', function () {
        const fileInput = document.getElementById('resumeUpload');
        if (fileInput) uploadFile(fileInput.files[0], 'resume', DOM.resumeProgress, null);
      });
    }

    if (DOM.uploadGeneralBtn) {
      DOM.uploadGeneralBtn.addEventListener('click', function () {
        const fileInput = document.getElementById('generalUpload');
        if (fileInput) uploadFile(fileInput.files[0], 'general', DOM.generalUploadProgress, DOM.generalUploadResult);
      });
    }

    // Initialize colors
    initThemeColors();

    // Load initial settings
    loadSettings();
  }

  // Run when DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
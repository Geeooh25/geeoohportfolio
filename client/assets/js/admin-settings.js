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

    DOM.heroTitle.value = hero.title || '';
    DOM.heroSubtitle.value = hero.subtitle || '';
    DOM.heroDescription.value = hero.description || '';
    DOM.heroCtaText.value = hero.ctaText || '';
    DOM.heroCtaLink.value = hero.ctaLink || '';
    DOM.aboutContent.value = about.content || '';
    DOM.resumeUrl.value = about.resumeUrl || '';
    DOM.socialGithub.value = social.github || '';
    DOM.socialLinkedin.value = social.linkedin || '';
    DOM.socialTwitter.value = social.twitter || '';
    DOM.socialInstagram.value = social.instagram || '';
    DOM.contactEmail.value = contact.email || '';
    DOM.contactPhone.value = contact.phone || '';
    DOM.contactWhatsapp.value = contact.whatsapp || '';
    DOM.contactAddress.value = contact.address || '';
    DOM.chatEnabled.checked = chat.enabled !== false;
    DOM.chatWelcome.value = chat.welcomeMessage || '';
    DOM.chatOffline.value = chat.offlineMessage || '';
  }

  async function saveSettings(e) {
    e.preventDefault();

    const payload = {
      heroSection: {
        title: DOM.heroTitle.value.trim(),
        subtitle: DOM.heroSubtitle.value.trim(),
        description: DOM.heroDescription.value.trim(),
        ctaText: DOM.heroCtaText.value.trim(),
        ctaLink: DOM.heroCtaLink.value.trim(),
      },
      aboutSection: {
        content: DOM.aboutContent.value.trim(),
        resumeUrl: DOM.resumeUrl.value.trim(),
      },
      socialLinks: {
        github: DOM.socialGithub.value.trim(),
        linkedin: DOM.socialLinkedin.value.trim(),
        twitter: DOM.socialTwitter.value.trim(),
        instagram: DOM.socialInstagram.value.trim(),
      },
      contactInfo: {
        email: DOM.contactEmail.value.trim(),
        phone: DOM.contactPhone.value.trim(),
        whatsapp: DOM.contactWhatsapp.value.trim(),
        address: DOM.contactAddress.value.trim(),
      },
      chat: {
        enabled: DOM.chatEnabled.checked,
        welcomeMessage: DOM.chatWelcome.value.trim(),
        offlineMessage: DOM.chatOffline.value.trim(),
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

  async function uploadFile(file, type, progressEl, resultEl) {
    if (!file) return;

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
        if (type === 'profile' && data.url) {
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

  DOM.form.addEventListener('submit', saveSettings);

  DOM.uploadProfileBtn.addEventListener('click', function () {
    const file = document.getElementById('profileImageUpload').files[0];
    uploadFile(file, 'profile', DOM.profileUploadProgress, null);
  });

  DOM.uploadResumeBtn.addEventListener('click', function () {
    const file = document.getElementById('resumeUpload').files[0];
    uploadFile(file, 'resume', DOM.resumeProgress, null);
  });

  DOM.uploadGeneralBtn.addEventListener('click', function () {
    const file = document.getElementById('generalUpload').files[0];
    uploadFile(file, 'general', DOM.generalUploadProgress, DOM.generalUploadResult);
  });

  loadSettings();
})();
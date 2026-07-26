const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'GEEOOH Dev'
  },
  siteDescription: String,
  siteKeywords: [String],
  logo: {
    url: String,
    public_id: String
  },
  favicon: String,
  heroSection: {
    title: String,
    subtitle: String,
    description: String,
    ctaText: String,
    ctaLink: String,
    backgroundImage: String,
    showStats: { type: Boolean, default: true }
  },
  aboutSection: {
    title: String,
    content: String,
    image: String,
    resumeUrl: String
  },
  contactInfo: {
    email: String,
    phone: String,
    address: String,
    whatsapp: String
  },
  socialLinks: {
    github: String,
    linkedin: String,
    twitter: String,
    instagram: String,
    youtube: String
  },
  seo: {
    googleAnalyticsId: String,
    googleSiteVerification: String,
    defaultMetaTitle: String,
    defaultMetaDescription: String,
    ogImage: String
  },
  chat: {
    enabled: { type: Boolean, default: true },
    welcomeMessage: String,
    offlineMessage: String,
    workingHours: {
      start: String,
      end: String
    }
  },
  maintenance: {
    enabled: { type: Boolean, default: false },
    message: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', settingSchema);
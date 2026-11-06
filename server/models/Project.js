const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  description: { type: String, required: true },
  longDescription: { type: String, default: '' },
  personalNote: { type: String, default: '' },
  category: { type: String, default: 'fullstack' },
  technologies: [String],
  images: [{ url: String, caption: String, isHero: { type: Boolean, default: false } }],
  features: [{ title: String, description: String, icon: String }],
  challenges: [{ title: String, problem: String, solution: String }],
  links: { live: String, github: String, demo: String, documentation: String },
  credentials: {
    hasCredentials: { type: Boolean, default: false },
    adminUrl: String,
    username: String,
    password: String,
    note: String
  },
  timeline: {
    startDate: Date,
    endDate: Date,
    duration: String,
    status: { type: String, enum: ['planning', 'in-progress', 'completed', 'maintained'], default: 'completed' }
  },
  stats: { stars: { type: Number, default: 0 }, forks: { type: Number, default: 0 }, views: { type: Number, default: 0 } },
  impact: {
    summary: String,
    metrics: [{ label: String, value: String, icon: String }]
  },
  clientFeedback: {
    quote: String,
    name: String,
    role: String
  },
  featured: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
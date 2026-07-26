const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  role: String,
  company: String,
  industry: String,
  quote: {
    type: String,
    required: true
  },
  shortQuote: String,
  impact: {
    summary: String,
    metrics: [{
      label: String,
      value: String
    }]
  },
  projectName: String,
  projectLink: String,
  avatar: {
    url: String
  },
  featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  approved: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
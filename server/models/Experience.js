const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['work', 'education', 'certification', 'achievement'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  organization: {
    type: String,
    required: true
  },
  location: String,
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  current: {
    type: Boolean,
    default: false
  },
  description: String,
  responsibilities: [String],
  achievements: [String],
  skills: [String],
  notableProjects: [{
    name: String,
    description: String,
    link: String
  }],
  impact: {
    summary: String,
    metrics: [{
      label: String,
      value: String
    }]
  },
  awards: [{
    title: String,
    description: String,
    date: Date
  }],
  logo: {
    url: String
  },
  color: {
    type: String,
    default: '#FF6B00'
  },
  order: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Experience', experienceSchema);
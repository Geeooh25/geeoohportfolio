const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['frontend', 'backend', 'database', 'fullstack', 'devops', 'tools', 'other'],
    required: true
  },
  level: {
    type: Number,
    min: 0,
    max: 100,
    default: 80,
    required: true
  },
  icon: String,
  color: String,
  featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Skill', skillSchema);
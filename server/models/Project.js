const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  longDescription: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true,
    default: 'fullstack'
  },
  technologies: [{
    type: String,
    trim: true
  }],
  images: [{
    url: String,
    caption: String,
    isHero: { type: Boolean, default: false }
  }],
  videos: [{
    url: String,
    platform: { type: String, enum: ['youtube', 'vimeo', 'direct'] },
    caption: String
  }],
  features: [{
    title: String,
    description: String,
    icon: String
  }],
  challenges: [{
    title: String,
    problem: String,
    solution: String
  }],
  links: {
    live: String,
    github: String,
    demo: String,
    documentation: String
  },
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
    status: {
      type: String,
      enum: ['planning', 'in-progress', 'completed', 'maintained'],
      default: 'completed'
    }
  },
  stats: {
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
  },
  featured: {
    type: Boolean,
    default: false
  },
  published: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },research: {
  summary: String,
  points: [String],
  tools: [String]
},
designStrategy: {
  summary: String,
  approach: String,
  tools: [String]
},
processBreakdown: [{
  phase: String,
  description: String,
  duration: String,
  icon: String
}],
results: {
  summary: String,
  metrics: [{
    label: String,
    value: String,
    icon: String
  }]
},
clientFeedback: {
  quote: String,
  name: String,
  role: String,
  avatar: String
},
lessonsLearned: [{
  title: String,
  description: String
}],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
},

 {
  timestamps: true
});

// Generate slug
// FIXED pre-save hook
projectSchema.pre('save', function(next) {
  try {
    if (this.isModified('title')) {
      this.slug = this.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Project', projectSchema);
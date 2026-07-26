const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  content: { type: String, required: true },
  approved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['image', 'video'], 
    default: 'image' 
  },
  caption: String,
  isHero: { type: Boolean, default: false },
  fit: {
    type: String,
    enum: ['cover', 'contain', 'fill', 'none'],
    default: 'cover'
  },
  videoPlatform: {
    type: String,
    enum: ['youtube', 'vimeo', 'direct', 'none'],
    default: 'none'
  },
  videoId: String,
  order: { type: Number, default: 0 }
});

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    sparse: true
  },
  subtitle: {
    type: String,
    maxlength: [300, 'Subtitle cannot exceed 300 characters']
  },
  excerpt: {
    type: String,
    maxlength: [300, 'Excerpt cannot exceed 300 characters'],
    default: ''
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  media: [mediaSchema],
  category: {
    type: String,
    required: [true, 'Category is required'],
    default: 'Other',
    enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'JavaScript', 'Tutorial', 'Career', 'Other']
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  readTime: {
    type: Number,
    default: 5
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  comments: [commentSchema],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  publishedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Blog', blogSchema);
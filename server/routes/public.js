const express = require('express');
const router = express.Router();
const {
  getProjects,
  getFeaturedProjects,
  getSkills,
  getTestimonials,
  getExperiences,
  getSettings,
  submitContact,
  search
} = require('../controllers/publicController');
const { sendMessage } = require('../controllers/messageController');
const { validateMessage } = require('../middleware/validate');
const { getBlogBySlug } = require('../controllers/blogController');

// ===== PROJECTS =====
router.get('/projects', getProjects);
router.get('/projects/featured', getFeaturedProjects);

router.get('/projects/:slug', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findOne({ slug: req.params.slug, published: true }).lean();
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    await Project.updateOne({ _id: project._id }, { $inc: { 'stats.views': 1 } });

    const relatedProjects = await Project.find({
      _id: { $ne: project._id },
      published: true,
      $or: [{ category: project.category }, { technologies: { $in: project.technologies || [] } }]
    }).select('title slug images description category technologies').limit(4).lean();

    res.status(200).json({ success: true, project, relatedProjects });
  } catch (error) {
    console.error('Project detail error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== MESSAGES (Chat) =====
router.post('/messages', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const message = await Message.create({
      conversationId: req.body.conversationId || 'chat_' + Date.now(),
      sender: {
        name: req.body.sender?.name || 'Visitor',
        email: req.body.sender?.email || 'visitor@website.com'
      },
      content: req.body.content || '',
      type: 'text',
      fileUrl: req.body.fileUrl || undefined,
      fileName: req.body.fileName || undefined,
      source: 'website'
    });

    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('admin-notification', { type: 'new-message', message, timestamp: new Date() });
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Message save error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== BLOGS =====
router.get('/blogs', async (req, res) => {
  try {
    const Blog = require('../models/Blog');
    const { page = 1, limit = 6, category, tag } = req.query;
    const query = { status: 'published' };
    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag] };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [blogs, total] = await Promise.all([
      Blog.find(query).populate('author', 'name avatar').select('-content').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Blog.countDocuments(query)
    ]);
    const [categories, allTags] = await Promise.all([
      Blog.distinct('category', { status: 'published' }),
      Blog.distinct('tags', { status: 'published' })
    ]);

    res.status(200).json({ success: true, count: blogs.length, total, totalPages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), blogs, categories, tags: allTags.flat().filter((v, i, a) => a.indexOf(v) === i) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Public upload (for chat widget — no auth required)
const multer = require('multer');
const path = require('path');

const publicStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, 'chat_' + Date.now() + path.extname(file.originalname));
  }
});

const publicUpload = multer({
  storage: publicStorage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/', publicUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    res.status(200).json({
      success: true,
      url: '/uploads/' + req.file.filename,
      name: req.file.originalname
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/messages/:conversationId', async (req, res) => {
  try {
    const Message = require('../models/Message');
    const messages = await Message.find({ conversationId: req.params.conversationId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/blogs/:slug', getBlogBySlug);

// ===== SKILLS & EXPERIENCE =====
router.get('/skills', getSkills);
router.get('/experiences', getExperiences);

// ===== TESTIMONIALS =====
router.get('/testimonials', getTestimonials);

// ===== SETTINGS =====
router.get('/settings', getSettings);

// ===== CONTACT =====
router.post('/contact', validateMessage, sendMessage);
router.post('/contact-form', submitContact);

// ===== SEARCH =====
router.get('/search', search);

module.exports = router;
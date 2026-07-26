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

// Project detail by slug
router.get('/projects/:slug', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findOne({
      slug: req.params.slug,
      published: true
    }).lean();

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Update views without triggering hooks
    await Project.updateOne(
      { _id: project._id },
      { $inc: { 'stats.views': 1 } }
    );

    // Get related projects
    const relatedProjects = await Project.find({
      _id: { $ne: project._id },
      published: true,
      $or: [
        { category: project.category },
        { technologies: { $in: project.technologies || [] } }
      ]
    })
    .select('title slug images description category technologies')
    .limit(4)
    .lean();

    res.status(200).json({ success: true, project, relatedProjects });
  } catch (error) {
    console.error('Project detail error:', error.message);
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
      Blog.find(query)
        .populate('author', 'name avatar')
        .select('-content')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Blog.countDocuments(query)
    ]);

    const [categories, allTags] = await Promise.all([
      Blog.distinct('category', { status: 'published' }),
      Blog.distinct('tags', { status: 'published' })
    ]);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      blogs,
      categories,
      tags: allTags.flat().filter((v, i, a) => a.indexOf(v) === i)
    });
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
router.get('/experiences', async (req, res) => {
  try {
    const Experience = require('../models/Experience');
    const experiences = await Experience.find().sort({ startDate: -1, order: 1 });
    res.status(200).json({ success: true, experiences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/testimonials', async (req, res) => {
  const Testimonial = require('../models/Testimonial');
  const testimonials = await Testimonial.find({ approved: true }).sort({ featured: -1, order: 1 });
  res.status(200).json({ success: true, testimonials });
});
// ===== SEARCH =====
router.get('/search', search);

module.exports = router;
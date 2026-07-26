const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Skill = require('../models/Skill');
const Testimonial = require('../models/Testimonial');
const Experience = require('../models/Experience');
const Setting = require('../models/Setting');
const { getExperiences, createExperience, updateExperience, deleteExperience } = require('../controllers/experienceController');
const { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } = require('../controllers/testimonialController');

// Dashboard stats
router.get('/stats', protect, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const Blog = require('../models/Blog');
    const Message = require('../models/Message');

    const [
      totalProjects,
      publishedProjects,
      totalBlogs,
      publishedBlogs,
      totalMessages,
      unreadMessages,
      recentProjects,
      recentMessages
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ published: true }),
      Blog.countDocuments(),
      Blog.countDocuments({ status: 'published' }),
      Message.countDocuments(),
      Message.countDocuments({ read: false }),
      Project.find().sort({ createdAt: -1 }).limit(5).select('title createdAt'),
      Message.find().sort({ createdAt: -1 }).limit(5).select('sender content createdAt')
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        publishedProjects,
        totalBlogs,
        publishedBlogs,
        totalMessages,
        unreadMessages,
        recentProjects,
        recentMessages
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Skills CRUD
router.get('/skills', protect, async (req, res) => {
  const skills = await Skill.find().sort({ category: 1, order: 1 });
  res.json({ success: true, skills });
});

router.post('/skills', protect, authorize('admin', 'editor'), async (req, res) => {
  const skill = await Skill.create(req.body);
  res.status(201).json({ success: true, skill });
});

router.put('/skills/:id', protect, authorize('admin', 'editor'), async (req, res) => {
  const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, skill });
});

router.delete('/skills/:id', protect, authorize('admin'), async (req, res) => {
  await Skill.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Skill deleted' });
});

// Testimonials CRUD
router.get('/testimonials', protect, async (req, res) => {
  const testimonials = await Testimonial.find().sort({ order: 1 });
  res.json({ success: true, testimonials });
});

router.post('/testimonials', protect, authorize('admin', 'editor'), async (req, res) => {
  const testimonial = await Testimonial.create(req.body);
  res.status(201).json({ success: true, testimonial });
});

router.put('/testimonials/:id', protect, authorize('admin', 'editor'), async (req, res) => {
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, testimonial });
});

router.delete('/testimonials/:id', protect, authorize('admin'), async (req, res) => {
  await Testimonial.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Testimonial deleted' });
});

// Experiences CRUD
router.get('/experiences', protect, async (req, res) => {
  const experiences = await Experience.find().sort({ startDate: -1 });
  res.json({ success: true, experiences });
});

router.post('/experiences', protect, authorize('admin', 'editor'), async (req, res) => {
  const experience = await Experience.create(req.body);
  res.status(201).json({ success: true, experience });
});

router.put('/experiences/:id', protect, authorize('admin', 'editor'), async (req, res) => {
  const experience = await Experience.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, experience });
});

router.delete('/experiences/:id', protect, authorize('admin'), async (req, res) => {
  await Experience.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Experience deleted' });
});

// Settings
router.get('/settings', protect, async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({});
  }
  res.json({ success: true, settings });
});

router.put('/settings', protect, authorize('admin'), async (req, res) => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create(req.body);
  } else {
    settings = await Setting.findByIdAndUpdate(settings._id, req.body, { new: true });
  }
  res.json({ success: true, settings });
});

// Activity log
router.get('/activity', protect, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const Blog = require('../models/Blog');
    
    const recentActivity = await Promise.all([
      Project.find().sort({ updatedAt: -1 }).limit(10).select('title updatedAt timeline.status'),
      Blog.find().sort({ updatedAt: -1 }).limit(10).select('title updatedAt status')
    ]);

    res.json({
      success: true,
      activity: {
        projects: recentActivity[0],
        blogs: recentActivity[1]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/experiences', protect, getExperiences);
router.post('/experiences', protect, createExperience);
router.put('/experiences/:id', protect, updateExperience);
router.delete('/experiences/:id', protect, deleteExperience);

router.get('/testimonials', protect, getTestimonials);
router.post('/testimonials', protect, createTestimonial);
router.put('/testimonials/:id', protect, updateTestimonial);
router.delete('/testimonials/:id', protect, deleteTestimonial);
module.exports = router;
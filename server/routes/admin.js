const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Skill = require('../models/Skill');
const Testimonial = require('../models/Testimonial');
const Experience = require('../models/Experience');
const Setting = require('../models/Setting');

// ===== DASHBOARD =====
router.get('/stats', protect, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const Blog = require('../models/Blog');
    const Message = require('../models/Message');

    const [totalProjects, publishedProjects, totalBlogs, publishedBlogs, totalMessages, unreadMessages, recentProjects, recentMessages] = await Promise.all([
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
      stats: { totalProjects, publishedProjects, totalBlogs, publishedBlogs, totalMessages, unreadMessages, recentProjects, recentMessages }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SKILLS =====
router.get('/skills', protect, async (req, res) => {
  try {
    const skills = await Skill.find().sort({ category: 1, order: 1 });
    res.json({ success: true, skills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/skills', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json({ success: true, skill });
  } catch (error) {
    console.error('Create skill error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/skills/:id', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, skill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/skills/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Skill deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== TESTIMONIALS (NO DUPLICATES) =====
router.get('/testimonials', protect, async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ order: 1 });
    res.json({ success: true, testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/testimonials', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const testimonial = await Testimonial.create(req.body);
    res.status(201).json({ success: true, testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/testimonials/:id', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/testimonials/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== EXPERIENCES (NO DUPLICATES) =====
router.get('/experiences', protect, async (req, res) => {
  try {
    const experiences = await Experience.find().sort({ startDate: -1 });
    res.json({ success: true, experiences });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/experiences', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const experience = await Experience.create(req.body);
    res.status(201).json({ success: true, experience });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/experiences/:id', protect, authorize('admin', 'editor'), async (req, res) => {
  try {
    const experience = await Experience.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, experience });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/experiences/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Experience.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Experience deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SETTINGS =====
router.get('/settings', protect, async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create({});
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/settings', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) settings = await Setting.create(req.body);
    else settings = await Setting.findByIdAndUpdate(settings._id, req.body, { new: true });
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== ACTIVITY =====
router.get('/activity', protect, async (req, res) => {
  try {
    const Project = require('../models/Project');
    const Blog = require('../models/Blog');
    const recentActivity = await Promise.all([
      Project.find().sort({ updatedAt: -1 }).limit(10).select('title updatedAt timeline.status'),
      Blog.find().sort({ updatedAt: -1 }).limit(10).select('title updatedAt status')
    ]);
    res.json({ success: true, activity: { projects: recentActivity[0], blogs: recentActivity[1] } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
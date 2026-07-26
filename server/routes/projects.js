const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

// In public routes
router.get('/projects/:slug', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const project = await Project.findOne({
      slug: req.params.slug,
      published: true
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }

    project.stats.views += 1;
    await project.save({ validateBeforeSave: false });

    const relatedProjects = await Project.find({
      _id: { $ne: project._id },
      published: true,
      $or: [
        { category: project.category },
        { technologies: { $in: project.technologies } }
      ]
    })
    .select('title slug images description category technologies')
    .limit(4);

    res.status(200).json({ success: true, project, relatedProjects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// All routes require authentication
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

module.exports = router;
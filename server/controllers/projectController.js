const Project = require('../models/Project');

// Get all projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: projects.length, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Create project
exports.createProject = async (req, res) => {
  try {
    // Generate slug from title
    const slug = req.body.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    const projectData = {
      ...req.body,
      slug: slug,
      createdBy: req.user._id
    };
    
    const project = await Project.create(projectData);
    
    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error('Create project error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    // Update slug if title changed
    if (req.body.title) {
      req.body.slug = req.body.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get project by slug (public)
exports.getProjectBySlug = async (req, res) => {
  try {
    const project = await Project.findOne({
      slug: req.params.slug,
      published: true
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Increment views
    project.stats.views += 1;
    await project.save({ validateBeforeSave: false });

    // Get related projects
    const relatedProjects = await Project.find({
      _id: { $ne: project._id },
      published: true,
      $or: [
        { category: project.category },
        { technologies: { $in: project.technologies } }
      ]
    })
    .select('title slug images description category technologies links')
    .limit(4);

    res.status(200).json({
      success: true,
      project,
      relatedProjects
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
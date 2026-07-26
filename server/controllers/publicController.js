const Project = require('../models/Project');
const Blog = require('../models/Blog');
const Skill = require('../models/Skill');
const Testimonial = require('../models/Testimonial');
const Experience = require('../models/Experience');
const Setting = require('../models/Setting');

// @desc    Get all public projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      published: true
    })
    .select('-createdBy -__v')
    .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single public project
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findOne({
      slug: req.params.slug,
      published: true
    }).select('-createdBy -__v');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Increment views
    project.stats.views += 1;
    await project.save();

    // Get related projects
    const relatedProjects = await Project.find({
      _id: { $ne: project._id },
      category: project.category,
      published: true
    })
    .limit(3)
    .select('title slug images description technologies');

    res.status(200).json({
      success: true,
      project,
      relatedProjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get featured projects
exports.getFeaturedProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      featured: true,
      published: true
    })
    .select('title slug images description technologies stats')
    .sort({ order: 1 });

    res.status(200).json({
      success: true,
      projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get published blogs
exports.getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { status: 'published' };
    
    if (req.query.category) query.category = req.query.category;
    if (req.query.tag) query.tags = { $in: [req.query.tag] };

    const blogs = await Blog.find(query)
      .populate('author', 'name avatar')
      .select('-content -__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single blog post
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published'
    }).populate('author', 'name avatar bio social');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    blog.views += 1;
    await blog.save();

    // Get related posts
    const relatedPosts = await Blog.find({
      _id: { $ne: blog._id },
      status: 'published',
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } }
      ]
    })
    .limit(3)
    .select('title slug excerpt coverImage createdAt');

    res.status(200).json({
      success: true,
      blog,
      relatedPosts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get skills
exports.getSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ category: 1, order: 1 });

    // Group by category
    const groupedSkills = skills.reduce((acc, skill) => {
      if (!acc[skill.category]) acc[skill.category] = [];
      acc[skill.category].push(skill);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      skills,
      groupedSkills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get testimonials
exports.getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({
      approved: true
    }).sort({ order: 1 });

    res.status(200).json({
      success: true,
      testimonials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get experiences
exports.getExperiences = async (req, res) => {
  try {
    const experiences = await Experience.find()
      .sort({ startDate: -1, order: 1 });

    // Group by type
    const workExperience = experiences.filter(e => e.type === 'work');
    const education = experiences.filter(e => e.type === 'education');
    const certifications = experiences.filter(e => e.type === 'certification');

    res.status(200).json({
      success: true,
      experiences,
      workExperience,
      education,
      certifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get site settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.findOne();

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Submit contact form
exports.submitContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Here you can add email notification logic
    // For now, just return success

    res.status(200).json({
      success: true,
      message: 'Thank you for your message! I will get back to you soon.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search site
exports.search = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const [projects, blogs] = await Promise.all([
      Project.find({
        published: true,
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { technologies: { $regex: q, $options: 'i' } }
        ]
      }).select('title slug description technologies').limit(5),
      
      Blog.find({
        status: 'published',
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { excerpt: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ]
      }).select('title slug excerpt category').limit(5)
    ]);

    res.status(200).json({
      success: true,
      results: {
        projects,
        blogs
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
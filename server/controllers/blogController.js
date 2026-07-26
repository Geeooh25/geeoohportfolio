const Blog = require('../models/Blog');

// @desc    Get all blogs (admin)
exports.getBlogs = async (req, res) => {
  try {
    const { status, category, tag, search, featured, sort, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag] };
    if (featured) query.featured = featured === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'title') sortOption = { title: 1 };
    if (sort === 'views') sortOption = { views: -1 };

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .populate('author', 'name email avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      Blog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      blogs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single blog
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name email avatar bio social');

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Increment views
    blog.views += 1;
    await blog.save({ validateBeforeSave: false });

    // Get related posts
    const relatedPosts = await Blog.find({
      _id: { $ne: blog._id },
      status: 'published',
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } }
      ]
    })
    .select('title slug excerpt coverImage category createdAt readTime')
    .limit(3);

    res.status(200).json({
      success: true,
      blog,
      relatedPosts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get blog by slug (public)
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ 
      slug: req.params.slug,
      status: 'published'
    }).populate('author', 'name email avatar bio social');

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    blog.views += 1;
    await blog.save({ validateBeforeSave: false });

    const relatedPosts = await Blog.find({
      _id: { $ne: blog._id },
      status: 'published',
      $or: [{ category: blog.category }, { tags: { $in: blog.tags } }]
    })
    .select('title slug excerpt coverImage category createdAt readTime')
    .limit(3);

    res.status(200).json({ success: true, blog, relatedPosts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create blog

// Create blog
exports.createBlog = async (req, res) => {
  try {
    console.log('Creating blog:', req.body.title);
    
    // Generate slug
    const slug = req.body.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Calculate read time
    const text = (req.body.content || '').replace(/<[^>]*>/g, '');
    const wordCount = text.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));
    
    // Process media
    const media = (req.body.media || []).map((item, index) => ({
      url: item.url,
      type: item.type || 'image',
      caption: item.caption || '',
      isHero: item.isHero || (index === 0),
      fit: item.fit || 'cover',
      videoPlatform: item.videoPlatform || 'none',
      videoId: item.videoId || '',
      order: item.order || index
    }));
    
    const blogData = {
      title: req.body.title,
      slug: slug,
      subtitle: req.body.subtitle || '',
      excerpt: req.body.excerpt || '',
      content: req.body.content,
      media: media,
      category: req.body.category || 'Other',
      tags: req.body.tags || [],
      status: req.body.status || 'draft',
      featured: req.body.featured || false,
      readTime: readTime,
      author: req.user._id,
      publishedAt: req.body.status === 'published' ? new Date() : null
    };
    
    const blog = await Blog.create(blogData);
    console.log('Blog created:', blog._id);
    
    res.status(201).json({ success: true, blog });
  } catch (error) {
    console.error('Create blog error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update blog
// @desc    Update blog
exports.updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Update fields manually to handle slug and readTime
    if (req.body.title) {
      blog.title = req.body.title;
      blog.slug = req.body.title
        .toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-')
        .replace(/-+/g, '-').replace(/^-|-$/g, '');
    }
    if (req.body.subtitle !== undefined) blog.subtitle = req.body.subtitle;
    if (req.body.excerpt !== undefined) blog.excerpt = req.body.excerpt;
    if (req.body.content) {
      blog.content = req.body.content;
      var text = req.body.content.replace(/<[^>]*>/g, '');
      blog.readTime = Math.max(1, Math.ceil(text.split(/\s+/).length / 200));
    }
    if (req.body.category) blog.category = req.body.category;
    if (req.body.tags) blog.tags = req.body.tags;
    if (req.body.status) {
      blog.status = req.body.status;
      if (req.body.status === 'published' && !blog.publishedAt) blog.publishedAt = new Date();
    }
    if (req.body.featured !== undefined) blog.featured = req.body.featured;
    if (req.body.media) blog.media = req.body.media;

    await blog.save();
    
    blog = await Blog.findById(blog._id).populate('author', 'name email avatar');
    
    res.status(200).json({ success: true, blog });
  } catch (error) {
    console.error('Update blog error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    await blog.deleteOne();
    res.status(200).json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle blog status
exports.toggleStatus = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    blog.status = blog.status === 'published' ? 'draft' : 'published';
    if (blog.status === 'published') blog.publishedAt = new Date();
    await blog.save();

    res.status(200).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get blog stats
exports.getBlogStats = async (req, res) => {
  try {
    const stats = await Blog.aggregate([
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          publishedPosts: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          draftPosts: {
            $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
          },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          categories: { $addToSet: '$category' },
          tags: { $addToSet: '$tags' }
        }
      }
    ]);

    const recentPosts = await Blog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title status views createdAt');

    res.status(200).json({
      success: true,
      stats: stats[0] || { totalPosts: 0, publishedPosts: 0, draftPosts: 0, totalViews: 0 },
      recentPosts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Add comment to blog
exports.addComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    
    blog.comments.push({
      name: req.body.name,
      email: req.body.email,
      content: req.body.content
    });
    
    await blog.save();
    
    res.status(200).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get comments
exports.getComments = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).select('comments');
    if (!blog) return res.status(404).json({ success: false, message: 'Not found' });
    
    const approvedComments = blog.comments.filter(c => c.approved);
    res.status(200).json({ success: true, comments: approvedComments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
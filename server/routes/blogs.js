const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleStatus,
  getBlogStats,
  addComment,
  getComments
} = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/auth');

// Public comment routes (no auth needed)
router.post('/:id/comments', addComment);
router.get('/:id/comments', getComments);

// All routes below require authentication
router.use(protect);

// Stats
router.get('/stats', getBlogStats);

// CRUD
router.route('/')
  .get(getBlogs)
  .post(authorize('admin', 'editor'), createBlog);

router.route('/:id')
  .get(getBlog)
  .put(authorize('admin', 'editor'), updateBlog)
  .delete(authorize('admin'), deleteBlog);

// Toggle status
router.put('/:id/toggle-status', authorize('admin', 'editor'), toggleStatus);

module.exports = router;
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { uploadAvatar, uploadProjectImage, uploadBlogImage, uploadResume, uploadToCloudinary } = require('../middleware/upload');

// ===========================================
// PUBLIC UPLOAD — No auth (chat widget)
// ===========================================
const publicStorage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, path.join(__dirname, '../uploads')); },
  filename: function (req, file, cb) { cb(null, 'chat_' + Date.now() + path.extname(file.originalname)); }
});
const publicUpload = multer({ storage: publicStorage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/public', function (req, res, next) {
  publicUpload.single('file')(req, res, function (err) {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
      }
      return res.status(500).json({ success: false, message: err.message });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    res.status(200).json({ success: true, url: '/uploads/' + req.file.filename, name: req.file.originalname });
  });
});

// ===========================================
// PROTECTED ROUTES — Auth required
// ===========================================
router.use(protect);

// Root endpoint for single image upload (used by admin)
router.post('/', uploadProjectImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }
    const result = await uploadToCloudinary(req.file);
    res.status(200).json({ 
      success: true, 
      url: 'http://localhost:5000' + result.url,
      file: result 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// NEW: Multiple images endpoint
router.post('/multiple', uploadProjectImage, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'Please upload files' });
    const files = await Promise.all(req.files.map(file => uploadToCloudinary(file)));
    res.status(200).json({ success: true, files, urls: files.map(f => f.url) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Existing routes
router.post('/avatar', uploadAvatar, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a file' });
    const result = await uploadToCloudinary(req.file);
    res.status(200).json({ success: true, file: result });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/project-images', uploadProjectImage, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'Please upload files' });
    const files = await Promise.all(req.files.map(file => uploadToCloudinary(file)));
    res.status(200).json({ success: true, files });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/blog-image', uploadBlogImage, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a file' });
    const result = await uploadToCloudinary(req.file);
    res.status(200).json({ success: true, file: result });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/resume', uploadResume, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a file' });
    res.status(200).json({ success: true, file: { url: '/' + req.file.path, name: req.file.originalname } });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
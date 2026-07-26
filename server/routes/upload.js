const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  uploadAvatar,
  uploadProjectImage,
  uploadBlogImage,
  uploadResume,
  uploadToCloudinary
} = require('../middleware/upload');

router.use(protect);

// Upload avatar
router.post('/avatar', uploadAvatar, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const result = await uploadToCloudinary(req.file);

    res.status(200).json({
      success: true,
      file: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload project images
router.post('/project-images', uploadProjectImage, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload files'
      });
    }

    const files = await Promise.all(
      req.files.map(file => uploadToCloudinary(file))
    );

    res.status(200).json({
      success: true,
      files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload blog image
router.post('/blog-image', uploadBlogImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const result = await uploadToCloudinary(req.file);

    res.status(200).json({
      success: true,
      file: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Upload resume
router.post('/resume', uploadResume, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    res.status(200).json({
      success: true,
      file: {
        url: `/${req.file.path}`,
        name: req.file.originalname
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
// routes/settings.js
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const { protect } = require('../middleware/auth');

// Handle both /api/v1/settings and /api/v1/admin/settings
router.route('/')
  .get(getSettings)
  .put(protect, updateSettings);

router.route('/admin')
  .get(getSettings)
  .put(protect, updateSettings);

module.exports = router;
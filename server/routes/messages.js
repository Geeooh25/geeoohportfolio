const express = require('express');
const router = express.Router();
const {
  getMessages,
  replyMessage,
  markAsRead,
  markAllAsRead,
  deleteMessage,
  getMessageStats
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getMessages);
router.get('/stats', getMessageStats);
router.put('/:id/reply', replyMessage);
router.put('/:id/read', markAsRead);
router.put('/conversation/:conversationId/read-all', markAllAsRead);
router.delete('/:id', deleteMessage);

module.exports = router;
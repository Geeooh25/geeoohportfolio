const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  replyMessage,
  markAsRead,
  markAllAsRead,
  deleteMessage,
  getMessageStats
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getMessages);
router.post('/', sendMessage);
router.get('/stats', getMessageStats);
router.put('/read-all', markAllAsRead);
router.put('/:id/reply', replyMessage);
router.put('/:id/read', markAsRead);
router.put('/conversation/:conversationId/read-all', markAllAsRead);
router.delete('/:id', deleteMessage);

module.exports = router;
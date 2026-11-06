const Message = require('../models/Message');
const { sendWhatsAppNotification } = require('../utils/whatsapp');

// @desc    Get all messages (admin)
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });

    // Build conversations manually (more compatible)
    const conversationMap = {};
    messages.forEach(function (m) {
      var cid = m.conversationId || 'unknown';
      if (!conversationMap[cid]) {
        conversationMap[cid] = {
          _id: cid,
          lastMessage: m,
          unreadCount: 0,
          totalMessages: 0
        };
      }
      conversationMap[cid].totalMessages++;
      if (!m.read) conversationMap[cid].unreadCount++;
      if (new Date(m.createdAt) > new Date(conversationMap[cid].lastMessage.createdAt)) {
        conversationMap[cid].lastMessage = m;
      }
    });

    var conversations = Object.values(conversationMap);
    conversations.sort(function (a, b) {
      return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      conversations: conversations,
      messages: messages
    });
  } catch (error) {
    console.error('Get messages error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send message (public)
exports.sendMessage = async (req, res) => {
  try {
    const message = await Message.create({
      conversationId: req.body.conversationId || `conv_${Date.now()}`,
      sender: {
        name: req.body.sender?.name || req.body.name || 'Visitor',
        email: req.body.sender?.email || req.body.email || 'visitor@website.com'
      },
      content: req.body.content,
      type: req.body.type || 'visitor',
      read: req.body.read !== undefined ? req.body.read : false,
      replied: req.body.replied || false,
      fileUrl: req.body.fileUrl || undefined,
      fileName: req.body.fileName || undefined,
      source: req.body.source || 'website'
    });

    const io = req.app.get('io');
    if (io) {
      if (message.type === 'admin') {
        // Only emit to visitor
        io.to(message.conversationId).emit('admin-reply', message);
      } else {
        // Visitor message — emit to admin
        io.to('admin-room').emit('admin-notification', { type: 'new-message', message, timestamp: new Date() });
      }
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reply to message (admin)
exports.replyMessage = async (req, res) => {
  try {
    const { replyContent } = req.body;

    const message = await Message.findByIdAndUpdate(
      req.params.id,
      {
        replied: true,
        repliedAt: new Date(),
        replyContent
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(message.conversationId).emit('admin-reply', {
        message,
        replyContent
      });
    }

    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      {
        read: true,
        readAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark all as read in conversation
exports.markAllAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      { conversationId: req.params.conversationId, read: false },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.status(200).json({
      success: true,
      message: 'All messages marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get message statistics
exports.getMessageStats = async (req, res) => {
  try {
    const stats = await Message.aggregate([
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          unreadMessages: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          },
          repliedMessages: {
            $sum: { $cond: [{ $eq: ['$replied', true] }, 1, 0] }
          },
          totalConversations: { $addToSet: '$conversationId' }
        }
      },
      {
        $project: {
          _id: 0,
          totalMessages: 1,
          unreadMessages: 1,
          repliedMessages: 1,
          totalConversations: { $size: '$totalConversations' }
        }
      }
    ]);

    // Messages per day (last 7 days)
    const last7Days = await Message.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      stats: stats[0] || {
        totalMessages: 0,
        unreadMessages: 0,
        repliedMessages: 0,
        totalConversations: 0
      },
      last7Days
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
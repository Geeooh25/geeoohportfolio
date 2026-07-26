const Message = require('../models/Message');
const { sendWhatsAppNotification } = require('../utils/whatsapp');

// @desc    Get all messages (admin)
exports.getMessages = async (req, res) => {
  try {
    const { status, search, sort, conversationId } = req.query;
    
    const query = {};
    
    if (status === 'unread') query.read = false;
    if (status === 'read') query.read = true;
    if (status === 'replied') query.replied = true;
    if (conversationId) query.conversationId = conversationId;
    if (search) {
      query.$or = [
        { 'sender.name': { $regex: search, $options: 'i' } },
        { 'sender.email': { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const messages = await Message.find(query).sort(sortOption);

    // Get unique conversations
    const conversations = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          },
          totalMessages: { $sum: 1 }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    res.status(200).json({
      success: true,
      count: messages.length,
      conversations,
      messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send message (public)
exports.sendMessage = async (req, res) => {
  try {
    const { name, email, content, conversationId } = req.body;

    const message = await Message.create({
      conversationId: conversationId || `conv_${Date.now()}`,
      sender: {
        name,
        email,
        ip: req.ip
      },
      content,
      metadata: {
        userAgent: req.headers['user-agent'],
        platform: req.headers['sec-ch-ua-platform'] || 'Unknown'
      }
    });

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('new-message', {
        message,
        notification: `New message from ${name}`
      });
    }

    // Send WhatsApp notification
    try {
      await sendWhatsAppNotification({
        name,
        email,
        content,
        timestamp: new Date()
      });
    } catch (err) {
      console.log('WhatsApp notification failed:', err.message);
    }

    res.status(201).json({
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
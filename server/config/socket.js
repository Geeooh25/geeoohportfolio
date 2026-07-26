const Message = require('../models/Message');

const setupSocket = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: ['http://127.0.0.1:3000', 'http://localhost:3000', 'http://127.0.0.1:5500'],
      methods: ['GET', 'POST']
    }
  });

  // Track online users
  const onlineUsers = new Map();
  const adminSockets = new Set();

  io.on('connection', (socket) => {
    console.log(`✅ New connection: ${socket.id}`);

    // User joins
    socket.on('user-join', (userData) => {
      if (userData.role === 'admin') {
        adminSockets.add(socket.id);
        socket.join('admin-room');
        console.log('👑 Admin joined');
      } else {
        onlineUsers.set(socket.id, {
          ...userData,
          socketId: socket.id,
          joinedAt: new Date()
        });
        
        // Join their conversation room
        if (userData.conversationId) {
          socket.join(userData.conversationId);
        }
      }
    });

    // Handle new message
    socket.on('send-message', async (data) => {
      try {
        const message = await Message.create({
          conversationId: data.conversationId,
          sender: {
            name: data.sender.name,
            email: data.sender.email
          },
          content: data.content,
          type: data.type || 'text'
        });

        // Send to conversation room
        io.to(data.conversationId).emit('new-message', message);

        // Notify  admins
        io.to('admin-room').emit('admin-notification', {
          type: 'new-message',
          message,
          timestamp: new Date()
        });

        // Auto-reply if enabled
        const Setting = require('../models/Setting');
        const settings = await Setting.findOne();
        if (settings?.chat?.welcomeMessage) {
          setTimeout(() => {
            const autoReply = {
              conversationId: data.conversationId,
              sender: { name: 'Ganiyu Usman', email: 'admin' },
              content: settings.chat.welcomeMessage,
              type: 'text',
              read: true
            };
            io.to(data.conversationId).emit('admin-reply', autoReply);
          }, 2000);
        }
      } catch (error) {
        console.error('Message error:', error);
        socket.emit('message-error', { error: error.message });
      }
    });

    // Admin reply
    socket.on('admin-reply', async (data) => {
      try {
        const message = await Message.findByIdAndUpdate(
          data.messageId,
          {
            replied: true,
            repliedAt: new Date(),
            replyContent: data.content
          },
          { new: true }
        );

        io.to(data.conversationId).emit('admin-reply', {
          message,
          replyContent: data.content
        });

        // Notify other admins
        socket.to('admin-room').emit('admin-replied', message);
      } catch (error) {
        console.error('Reply error:', error);
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(data.conversationId).emit('user-typing', {
        name: data.name,
        isTyping: data.isTyping
      });
    });

    // Mark as read
    socket.on('mark-read', async (data) => {
      try {
        await Message.updateMany(
          { conversationId: data.conversationId, read: false },
          { read: true, readAt: new Date() }
        );
        
        io.to('admin-room').emit('messages-read', {
          conversationId: data.conversationId
        });
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    // Get online users count (admin only)
    socket.on('get-online-users', () => {
      if (adminSockets.has(socket.id)) {
        socket.emit('online-users', {
          count: onlineUsers.size,
          users: Array.from(onlineUsers.values())
        });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Disconnected: ${socket.id}`);
      
      onlineUsers.delete(socket.id);
      adminSockets.delete(socket.id);
      
      // Update online count for admins
      io.to('admin-room').emit('online-users-update', {
        count: onlineUsers.size
      });
    });
  });

  return io;
};

module.exports = setupSocket;
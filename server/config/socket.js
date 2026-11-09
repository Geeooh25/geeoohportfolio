const Message = require('../models/Message');

const setupSocket = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: [
        'http://localhost:3000', 'http://127.0.0.1:3000',
        'http://localhost:5000', 'http://127.0.0.1:5000',
        'http://127.0.0.1:5500'
      ],
      methods: ['GET', 'POST']
    }
  });

  const onlineVisitors = new Map(); // conversationId -> socketId
  const adminOnline = new Set();

  io.on('connection', (socket) => {
    console.log('✅ Connected: ' + socket.id);

    // ── Visitor / Admin join ─────────────────────────────────────────
    socket.on('user-join', (userData) => {
      if (userData.role === 'admin') {
        adminOnline.add(socket.id);
        socket.join('admin-room');
      } else {
        var cid = userData.conversationId;
        onlineVisitors.set(cid, socket.id);
        socket.join(cid);
        io.to('admin-room').emit('user-online', { conversationId: cid, name: userData.name });

        // Visitor came online — mark admin messages as delivered.
        Message.updateMany(
          { conversationId: cid, type: 'admin', delivered: false },
          { delivered: true }
        )
          .then(() => io.to('admin-room').emit('messages-delivered', { conversationId: cid }))
          .catch(() => {});
      }
    });

    // ── Visitor sends message ────────────────────────────────────────
    socket.on('send-message', async (data, callback) => {
      const ack = (typeof callback === 'function') ? callback : function(){};
      try {
        var adminIsOnline = adminOnline.size > 0;
        
        // 1. Persist to DB FIRST
        var message = await Message.create({
          conversationId: data.conversationId,
          sender: { 
            name: data.sender?.name || 'Visitor', 
            email: data.sender?.email || 'visitor@website.com' 
          },
          content: data.content, 
          type: 'visitor',
          fileUrl: data.fileUrl || undefined, 
          fileName: data.fileName || undefined,
          source: 'website', 
          delivered: adminIsOnline
        });

        // 2. Send to the visitor (echo)
        socket.emit('new-message', message);
        
        // 3. Send to admin-room EXACTLY ONCE (using the real saved message ID)
        io.to('admin-room').emit('admin-notification', { 
          type: 'new-message', 
          message: message, 
          timestamp: new Date() 
        });

        // 4. Ack the client so the 🕐 flips to ✓ immediately
        ack({ ok: true, messageId: String(message._id) });
        
        // 5. Update status
        socket.emit('message-status', { 
          messageId: String(message._id), 
          status: adminIsOnline ? 'delivered' : 'sent' 
        });

      } catch (error) {
        console.error('Message error:', error.message);
        // Ack with failure so the client's pending bubble flips to ❌
        ack({ ok: false, error: error.message });
      }
    });

    // ── Admin sends reply ────────────────────────────────────────────
    socket.on('admin-reply', async (data, callback) => {
      const ack = (typeof callback === 'function') ? callback : function(){};
      try {
        var visitorOnline = onlineVisitors.has(data.conversationId);
        var message = await Message.create({
          conversationId: data.conversationId,
          sender: { name: 'Ganiyu Usman', email: 'admin@geeooh.dev' },
          content: data.content,
          type: 'admin',
          read: false,
          replied: true,
          delivered: visitorOnline,
          fileUrl: data.fileUrl || undefined,
          fileName: data.fileName || undefined,
          source: 'website'
        });
        io.to(data.conversationId).emit('admin-reply', message);
        io.to('admin-room').emit('admin-notification', {
          type: 'new-message',
          message,
          timestamp: new Date()
        });
        ack({ ok: true, messageId: String(message._id) });
      } catch (error) {
        console.error('Admin reply error:', error.message);
        ack({ ok: false, error: error.message });
      }
    });

    // ── Admin opens chat → marks visitor messages as READ ────────────
    socket.on('admin-mark-read', async (data) => {
      try {
        var result = await Message.updateMany(
          { conversationId: data.conversationId, type: 'visitor', read: false },
          { read: true, readAt: new Date() }
        );
        if (result.modifiedCount > 0) {
          io.to(data.conversationId).emit('message-status', { status: 'read-all' });
          io.to('admin-room').emit('messages-read', { conversationId: data.conversationId });
        }
      } catch (e) {
        console.error('Admin mark read error:', e);
      }
    });

    // ── Visitor opens chat → marks admin messages as READ ────────────
    socket.on('mark-read', async (data) => {
      try {
        await Message.updateMany(
          { conversationId: data.conversationId, type: 'admin', read: false },
          { read: true, readAt: new Date() }
        );
        io.to('admin-room').emit('messages-read', { conversationId: data.conversationId });
      } catch (e) {
        console.error('Mark read error:', e);
      }
    });

    // ── Typing relay ─────────────────────────────────────────────────
    socket.on('typing', (data) => {
      if (data.conversationId) {
        io.to('admin-room').emit('typing', {
          conversationId: data.conversationId,
          name: data.name
        });
      }
    });

    // ── Disconnect ───────────────────────────────────────────────────
    socket.on('disconnect', () => {
      for (let [cid, sid] of onlineVisitors) {
        if (sid === socket.id) {
          onlineVisitors.delete(cid);
          io.to('admin-room').emit('user-offline', { conversationId: cid });
          break;
        }
      }
      adminOnline.delete(socket.id);
    });
  });

  return io;
};

module.exports = setupSocket;
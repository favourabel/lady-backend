// ============================================
// sockets/socketManager.js
// Socket.io real-time chat & notifications
// ============================================
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { setSocketIO, sendChatNotification } = require('../services/notificationService');
const logger = require('../utils/logger');

// Track online users: Map<userId, socketId>
const onlineUsers = new Map();
const onlineAdmins = new Map();

// Track typing: Map<conversationId, Set<userId>>
const typingUsers = new Map();

let io;

// ============================================
// Initialize Socket.io
// ============================================
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:3000',
      ],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling'],
  });

  // Pass io to notification service
  setSocketIO(io);

  // ============================================
  // AUTH MIDDLEWARE
  // ============================================
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if admin or user
      if (decoded.role === 'admin') {
        const admin = await Admin.findById(decoded.id).select('-password');
        if (!admin) return next(new Error('Admin not found'));
        socket.userType = 'admin';
        socket.user = admin;
      } else {
        const user = await User.findById(decoded.id).select('-password');
        if (!user || !user.isActive) return next(new Error('User not found or inactive'));
        socket.userType = 'user';
        socket.user = user;
      }

      next();
    } catch (err) {
      logger.error(`Socket auth error: ${err.message}`);
      next(new Error('Invalid or expired token'));
    }
  });

  // ============================================
  // CONNECTION HANDLER
  // ============================================
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const userType = socket.userType;

    logger.info(`Socket connected: ${userType} ${userId}`);

    // Join personal room
    socket.join(`${userType}:${userId}`);

    // Also join generic user: room (for notifications)
    if (userType === 'user') {
      socket.join(`user:${userId}`);
      onlineUsers.set(userId, socket.id);
    } else {
      socket.join('admins');
      onlineAdmins.set(userId, socket.id);
    }

    // Notify others
    socket.broadcast.emit('user:online', { userId, userType });

    // Send list of online users to newly connected
    socket.emit('users:online', {
      users: Array.from(onlineUsers.keys()),
      admins: Array.from(onlineAdmins.keys()),
    });

    // ============================================
    // CHAT: Join conversation room
    // ============================================
    socket.on('conversation:join', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Access check: user must own conversation OR be admin
        const isOwner = conversation.userId.toString() === userId;
        const isAdmin = userType === 'admin';

        if (!isOwner && !isAdmin) {
          return socket.emit('error', { message: 'Access denied' });
        }

        socket.join(`conversation:${conversationId}`);
        logger.debug(`${userType} ${userId} joined conversation ${conversationId}`);
      } catch (err) {
        logger.error(`Join conversation failed: ${err.message}`);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // ============================================
    // CHAT: Send message
    // ============================================
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, attachments } = data;

        if (!content || !content.trim()) {
          return socket.emit('error', { message: 'Message cannot be empty' });
        }

        let conversation = await Conversation.findById(conversationId);

        // Auto-create conversation for user if it doesn't exist
        if (!conversation && userType === 'user') {
          conversation = await Conversation.create({
            userId,
            lastMessage: content,
            lastMessageAt: new Date(),
            lastMessageSender: userType,
          });
        }

        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Create message
        const message = await Message.create({
          conversationId: conversation._id,
          senderType: userType,
          senderId: userId,
          userId: conversation.userId,
          content: content.trim(),
          attachments: attachments || [],
        });

        // Update conversation
        conversation.lastMessage = content.trim();
        conversation.lastMessageAt = new Date();
        conversation.lastMessageSender = userType;

        if (userType === 'user') {
          conversation.unreadByAdmin += 1;
        } else {
          conversation.unreadByUser += 1;
        }
        await conversation.save();

        // Emit to conversation room
        io.to(`conversation:${conversation._id}`).emit('message:received', {
          message: message.toObject(),
          conversation: conversation.toObject(),
        });

        // Notify recipient's personal room if not in conversation room
        if (userType === 'user') {
          // Notify all admins
          io.to('admins').emit('chat:new_message', {
            conversationId: conversation._id,
            userId: conversation.userId,
            preview: content.trim().substring(0, 100),
            senderName: socket.user.firstName || 'User',
          });
        } else {
          // Notify the specific user
          io.to(`user:${conversation.userId}`).emit('chat:new_message', {
            conversationId: conversation._id,
            preview: content.trim().substring(0, 100),
            senderName: socket.user.name || 'Admin',
          });

          // Also send notification if user is offline
          if (!onlineUsers.has(conversation.userId.toString())) {
            await sendChatNotification(
              conversation.userId,
              socket.user.name || 'Admin',
              content.trim()
            );
          }
        }

        logger.debug(`Message sent in conv ${conversation._id} by ${userType} ${userId}`);
      } catch (err) {
        logger.error(`Send message failed: ${err.message}`);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ============================================
    // CHAT: Typing indicators
    // ============================================
    socket.on('typing:start', ({ conversationId }) => {
      if (!typingUsers.has(conversationId)) {
        typingUsers.set(conversationId, new Set());
      }
      typingUsers.get(conversationId).add(userId);

      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        userType,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      if (typingUsers.has(conversationId)) {
        typingUsers.get(conversationId).delete(userId);
      }

      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        userType,
        isTyping: false,
      });
    });

    // ============================================
    // CHAT: Mark as read
    // ============================================
    socket.on('messages:read', async ({ conversationId }) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // Mark unread messages from OTHER party as read
        await Message.updateMany(
          {
            conversationId,
            senderType: userType === 'user' ? 'admin' : 'user',
            isRead: false,
          },
          { isRead: true, readAt: new Date() }
        );

        // Reset unread counter
        if (userType === 'user') {
          conversation.unreadByUser = 0;
        } else {
          conversation.unreadByAdmin = 0;
        }
        await conversation.save();

        // Notify sender that messages were read
        socket.to(`conversation:${conversationId}`).emit('messages:read', {
          conversationId,
          readBy: userId,
          readAt: new Date(),
        });
      } catch (err) {
        logger.error(`Mark read failed: ${err.message}`);
      }
    });

    // ============================================
    // NOTIFICATIONS
    // ============================================
    socket.on('notification:getCount', async () => {
      try {
        const Notification = require('../models/Notification');
        const count = await Notification.countDocuments({
          userId,
          isRead: false,
        });
        socket.emit('notification:count', { count });
      } catch (err) {
        logger.error(`Get notif count failed: ${err.message}`);
      }
    });

    // ============================================
    // DISCONNECTION
    // ============================================
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${userType} ${userId} - ${reason}`);

      if (userType === 'user') {
        onlineUsers.delete(userId);
      } else {
        onlineAdmins.delete(userId);
      }

      // Clear typing indicators
      typingUsers.forEach((users, convId) => {
        if (users.has(userId)) {
          users.delete(userId);
          socket.to(`conversation:${convId}`).emit('typing:update', {
            conversationId: convId,
            userId,
            userType,
            isTyping: false,
          });
        }
      });

      // Notify offline
      io.emit('user:offline', { userId, userType });
    });

    socket.on('error', (err) => {
      logger.error(`Socket error (${userType} ${userId}): ${err.message}`);
    });
  });

  logger.info('✅ Socket.io initialized successfully');
  return io;
};

// ============================================
// Helpers
// ============================================
const getOnlineUsers = () => Array.from(onlineUsers.keys());
const getOnlineAdmins = () => Array.from(onlineAdmins.keys());
const isUserOnline = (userId) => onlineUsers.has(userId.toString());
const isAdminOnline = (adminId) => onlineAdmins.has(adminId.toString());
const getIO = () => io;

module.exports = {
  initializeSocket,
  getOnlineUsers,
  getOnlineAdmins,
  isUserOnline,
  isAdminOnline,
  getIO,
};
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
const { getAIResponse, isAIAvailable } = require('../services/aiService'); // ✅ AI Integration
const logger = require('../utils/logger');

// Track online users: Map<userId, socketId>
const onlineUsers = new Map();
const onlineAdmins = new Map();

// Track typing: Map<conversationId, Set<userId>>
const typingUsers = new Map();

let io;

// ============================================
// Helper: check if any admin is online
// ============================================
const isAnyAdminOnline = () => onlineAdmins.size > 0;

// ============================================
// Handle AI response (separated for clarity)
// ============================================
const handleAIResponse = async (conversation, userMessage, userSocket) => {
  try {
    logger.info(`🤖 AI processing message for user ${conversation.userId}`);

    // Show "AI is typing..." indicator to user
    io.to(`conversation:${conversation._id}`).emit('typing:update', {
      conversationId: conversation._id.toString(),
      userId: 'ai-assistant',
      userType: 'ai',
      isTyping: true,
    });

    // Get recent chat history for context
    const chatHistory = await Message.find({
      conversationId: conversation._id,
      isDeleted: { $ne: true },
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    // Get AI response
    const aiResponse = await getAIResponse(
      userMessage,
      chatHistory.reverse()
    );

    // Stop typing indicator
    io.to(`conversation:${conversation._id}`).emit('typing:update', {
      conversationId: conversation._id.toString(),
      userId: 'ai-assistant',
      userType: 'ai',
      isTyping: false,
    });

    // Save AI message using existing Message model
    const aiMessage = await Message.create({
      conversationId: conversation._id,
      senderType: 'ai',
      // senderId is not required for AI (per updated model)
      userId: conversation.userId,
      content: aiResponse,
      isAIResponse: true,
    });

    // Update conversation
    conversation.lastMessage = aiResponse;
    conversation.lastMessageAt = new Date();
    conversation.lastMessageSender = 'ai';
    conversation.unreadByAdmin = (conversation.unreadByAdmin || 0) + 1; // Admin should still see AI convos

    // Use helper method if available; otherwise, save directly
    if (typeof conversation.incrementAICount === 'function') {
      await conversation.incrementAICount();
    } else {
      await conversation.save();
    }

    // Emit AI message to conversation room
    io.to(`conversation:${conversation._id}`).emit('message:received', {
      message: aiMessage.toObject(),
      conversation: conversation.toObject(),
      isAI: true,
    });

    // Notify all admins that AI handled a message (for their awareness)
    io.to('admins').emit('chat:ai_response', {
      conversationId: conversation._id,
      userId: conversation.userId,
      preview: typeof aiResponse === 'string' ? aiResponse.substring(0, 100) : '',
      handledByAI: true,
    });

    logger.info(`✅ AI response sent for conv ${conversation._id}`);
  } catch (err) {
    logger.error(`AI response failed: ${err.message}`);

    // Stop typing indicator on failure
    io.to(`conversation:${conversation._id}`).emit('typing:update', {
      conversationId: conversation._id.toString(),
      userId: 'ai-assistant',
      userType: 'ai',
      isTyping: false,
    });

    // Send fallback message to user
    userSocket.emit('message:ai_failed', {
      message: 'AI is unavailable. An admin will reply to you shortly. 💕',
    });
  }
};

// ============================================
// Initialize Socket.io
// ============================================
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'https://my-lady-seven.vercel.app',
        process.env.CLIENT_URL || 'http://localhost:5173',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174',
      ].filter(Boolean),
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

      // Notify all users that admin came online
      io.emit('admin:status_changed', {
        adminOnline: true,
        totalAdmins: onlineAdmins.size,
      });
      logger.info(`✅ Admin ${userId} online. Total admins: ${onlineAdmins.size}`);
    }

    // Notify others
    socket.broadcast.emit('user:online', { userId, userType });

    // Send list of online users to newly connected
    socket.emit('users:online', {
      users: Array.from(onlineUsers.keys()),
      admins: Array.from(onlineAdmins.keys()),
    });

    // Tell client if AI is available and if admin is online
    socket.emit('chat:status', {
      aiAvailable: typeof isAIAvailable === 'function' ? isAIAvailable() : true,
      adminOnline: isAnyAdminOnline(),
      respondingAs: isAnyAdminOnline() ? 'admin' : 'ai',
    });

    // ============================================
    // CHAT: Join conversation room
    // ============================================
    socket.on('conversation:join', async ({ conversationId }) => {
      try {
        if (!conversationId) return;
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
    // CHAT: Send message (SINGLE UNIFIED HANDLER)
    // Merged from previous duplicate handlers with:
    //  - Race condition safe conversation creation
    //  - AI takeover when no admin online
    //  - Auto-join sender to conversation room
    //  - Emit to sender + others separately
    // ============================================
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, attachments } = data || {};

        console.log(`📨 Message received from ${userType} ${userId}:`, {
          conversationId,
          contentPreview: content?.substring(0, 50),
        });

        if (!content || !content.trim()) {
          return socket.emit('error', { message: 'Message cannot be empty' });
        }

        let conversation = null;

        // For users, ALWAYS find their existing conversation first
        if (userType === 'user') {
          conversation = await Conversation.findOne({ userId });

          // ONLY create if truly doesn't exist
          if (!conversation) {
            console.log(`🆕 Creating new conversation for user ${userId}`);
            try {
              conversation = await Conversation.create({
                userId,
                lastMessage: content.trim(),
                lastMessageAt: new Date(),
                lastMessageSender: userType,
              });
            } catch (createErr) {
              // If creation fails (race condition), try to find again
              if (createErr.code === 11000) {
                console.log('⚠️ Conversation created by another process, finding it...');
                conversation = await Conversation.findOne({ userId });
              } else {
                throw createErr;
              }
            }
          }
        } else {
          // For admins, use the conversationId provided
          if (conversationId) {
            try {
              conversation = await Conversation.findById(conversationId);
            } catch (findErr) {
              console.log('⚠️ Invalid conversationId');
            }
          }
        }

        if (!conversation) {
          console.error('❌ No conversation found or created');
          return socket.emit('error', { message: 'Conversation not found' });
        }

        console.log(`💬 Using conversation: ${conversation._id}`);

        // Create message
        const message = await Message.create({
          conversationId: conversation._id,
          senderType: userType,
          senderId: userId,
          userId: conversation.userId,
          content: content.trim(),
          attachments: attachments || [],
        });

        console.log(`✅ Message saved: ${message._id}`);

        // Update conversation
        conversation.lastMessage = content.trim();
        conversation.lastMessageAt = new Date();
        conversation.lastMessageSender = userType;

        if (userType === 'user') {
          conversation.unreadByAdmin = (conversation.unreadByAdmin || 0) + 1;
        } else {
          conversation.unreadByUser = (conversation.unreadByUser || 0) + 1;
        }
        await conversation.save();

        // Emit user's message back to the sender
        socket.emit('message:received', {
          message: message.toObject(),
          conversation: conversation.toObject(),
        });

        // Also emit to conversation room (others)
        socket.to(`conversation:${conversation._id}`).emit('message:received', {
          message: message.toObject(),
          conversation: conversation.toObject(),
        });

        // Auto-join sender to their conversation room
        socket.join(`conversation:${conversation._id}`);

        // Notify recipients
        if (userType === 'user') {
          // Notify all admins
          io.to('admins').emit('chat:new_message', {
            conversationId: conversation._id,
            userId: conversation.userId,
            preview: content.trim().substring(0, 100),
            senderName:
              socket.user.firstName ||
              socket.user.username ||
              socket.user.name ||
              'User',
          });

          // AI TAKES OVER IF NO ADMIN IS ONLINE
          const aiReady =
            typeof isAIAvailable === 'function' ? isAIAvailable() : true;

          if (!isAnyAdminOnline() && aiReady) {
            console.log('👤 No admin online → 🤖 AI will respond');
            // Handle AI response asynchronously (don't block)
            handleAIResponse(conversation, content.trim(), socket);
          } else if (isAnyAdminOnline()) {
            console.log('👨‍⚕️ Admin online → Waiting for admin reply');
          }
        } else {
          // Admin sent the message
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

        console.log(`✅ Message flow completed for conv ${conversation._id}`);
      } catch (err) {
        console.error(`❌ Send message failed:`, err.message);
        console.error(`❌ Error stack:`, err.stack);
        socket.emit('error', {
          message: 'Failed to send message',
          detail: err.message,
        });
      }
    });

    // ============================================
    // CHAT: Typing indicators
    // ============================================
    socket.on('typing:start', ({ conversationId }) => {
      if (!conversationId) return;
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
      if (!conversationId) return;
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
    // Admin manually takes over from AI
    // ============================================
    socket.on('admin:takeover', async ({ conversationId }) => {
      if (userType !== 'admin') {
        return socket.emit('error', { message: 'Only admins can take over' });
      }

      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // Notify user that admin has joined
        io.to(`conversation:${conversationId}`).emit('admin:joined_chat', {
          conversationId,
          adminName: socket.user.name || 'Admin',
          message:
            'An admin has joined the conversation and will respond to your messages.',
        });

        logger.info(`Admin ${userId} took over conversation ${conversationId}`);
      } catch (err) {
        logger.error(`Admin takeover failed: ${err.message}`);
      }
    });

    // ============================================
    // DISCONNECTION (WITH ADMIN TRACKING)
    // ============================================
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${userType} ${userId} - ${reason}`);

      if (userType === 'user') {
        onlineUsers.delete(userId);
      } else {
        onlineAdmins.delete(userId);

        // Notify users if last admin went offline
        if (onlineAdmins.size === 0) {
          io.emit('admin:status_changed', {
            adminOnline: false,
            totalAdmins: 0,
          });
          logger.info('❌ All admins offline → AI will handle messages');
        }
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
  isAnyAdminOnline,
  getIO,
};
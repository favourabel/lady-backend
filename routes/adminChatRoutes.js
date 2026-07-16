// routes/adminChatRoutes.js
const express = require('express');
const asyncHandler = require('../utils/asyncHandlers');
const { adminProtect } = require('../middleware/Auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const router = express.Router();
router.use(adminProtect);

// GET /api/admin/conversations
router.get('/', asyncHandler(async (req, res) => {
  const conversations = await Conversation.find()
    .populate('userId', 'firstName lastName email')
    .sort({ lastMessageAt: -1 });

  const formatted = conversations.map(c => ({
    _id: c._id,
    userId: c.userId._id,
    userName: `${c.userId.firstName} ${c.userId.lastName}`,
    lastMessage: c.lastMessage,
    lastMessageAt: c.lastMessageAt,
    unread: c.unreadByAdmin,
    online: false, // will be updated via socket
    messages: []
  }));

  res.json({ success: true, data: { conversations: formatted } });
}));

// GET /api/admin/conversations/:id/messages
router.get('/:id/messages', asyncHandler(async (req, res) => {
  const messages = await Message.find({ conversationId: req.params.id })
    .sort({ createdAt: 1 });
  res.json({ success: true, data: { messages } });
}));

module.exports = router;
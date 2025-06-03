const express = require('express');
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');
const router = express.Router();

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { chat, sender, content } = req.body;
    
    // Create message
    const message = new Message({
      chat,
      sender,
      content,
      readBy: [sender]
    });
    await message.save();

    // Update chat's last message and unread count
    const chatDoc = await Chat.findById(chat);
    if (chatDoc) {
      // Increment unread count for all participants except sender
      const unreadCount = { ...chatDoc.unreadCount };
      chatDoc.participants.forEach(participantId => {
        if (participantId.toString() !== sender.toString()) {
          unreadCount[participantId.toString()] = (unreadCount[participantId.toString()] || 0) + 1;
        }
      });

      chatDoc.lastMessage = message._id;
      chatDoc.unreadCount = unreadCount;
      await chatDoc.save();
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a chat
router.get('/chat/:chatId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 
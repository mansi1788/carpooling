const express = require('express');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Create router instance
const router = express.Router();

// Get user's chats
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.user.id
    })
    .populate('participants', 'name email')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get chat by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate('participants', 'name email')
      .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Check if user is a participant
    if (!chat.participants.some(p => p._id.toString() === req.user.user.id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or get existing chat
router.post('/start', auth, async (req, res) => {
  try {
    const { participants } = req.body;
    
    if (!participants || !Array.isArray(participants)) {
      return res.status(400).json({ error: 'Participants array is required' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: participants }
    });

    if (!chat) {
      // Create new chat with string IDs as Map keys
      const unreadCountMap = new Map();
      participants.forEach(id => {
        unreadCountMap.set(id.toString(), 0);
      });

      chat = new Chat({
        participants,
        unreadCount: Object.fromEntries(unreadCountMap)
      });
      await chat.save();
    }

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the router
module.exports = router; 
const express = require('express');
const User = require('../models/User');
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.patch('/:id', auth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is updating their own profile
    if (user._id.toString() !== req.user.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's ride history
router.get('/:id/rides', auth, async (req, res) => {
  try {
    const rides = await Ride.find({
      $or: [
        { driver: req.params.id },
        { passengers: req.params.id }
      ]
    })
    .populate('driver', 'name email')
    .populate('passengers', 'name email')
    .sort({ date: -1 });

    res.json(rides);
  } catch (error) {
    console.error('Error fetching user rides:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 
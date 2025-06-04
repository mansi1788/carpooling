const express = require('express');
const Ride = require('../models/Ride');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all rides
router.get('/', async (req, res) => {
  try {
    const rides = await Ride.find()
      .populate('driver', 'name email')
      .populate('passengers', 'name email')
      .sort({ date: 1 });
    res.json(rides);
  } catch (error) {
    console.error('Error fetching rides:', error);
    res.status(500).json({ error: 'Failed to fetch rides' });
  }
});

// Get featured rides (most recent with available seats)
router.get('/featured', async (req, res) => {
  try {
    const featuredRides = await Ride.find({
      date: { $gte: new Date() },
      $expr: { $lt: [{ $size: '$passengers' }, '$seats'] }
    })
      .populate('driver', 'name email')
      .sort({ date: 1 })
      .limit(6);
    res.json(featuredRides);
  } catch (error) {
    console.error('Error fetching featured rides:', error);
    res.status(500).json({ error: 'Failed to fetch featured rides' });
  }
});

// Get ride statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const totalRides = await Ride.countDocuments();
    const activeRides = await Ride.countDocuments({ status: 'scheduled' });
    const completedRides = await Ride.countDocuments({ status: 'completed' });
    const totalPassengers = await Ride.aggregate([
      { $unwind: '$passengers' },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);

    // Calculate total revenue from completed rides
    const revenueResult = await Ride.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);

    res.json({
      totalRides,
      activeRides,
      completedRides,
      totalPassengers: totalPassengers[0]?.count || 0,
      totalRevenue: revenueResult[0]?.total || 0
    });
  } catch (err) {
    console.error('Error fetching ride stats:', err);
    res.status(500).json({ error: 'Error fetching ride statistics' });
  }
});

// Get user's rides (both driving and joined)
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const rides = await Ride.find({
      $or: [
        { driver: userId },
        { passengers: userId }
      ]
    })
    .populate('driver', 'name email')
    .populate('passengers', 'name email')
    .sort({ date: -1 });

    res.json(rides);
  } catch (error) {
    console.error('Error fetching user rides:', error);
    res.status(500).json({ error: 'Failed to fetch user rides' });
  }
});

// Get a single ride by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('Fetching ride with ID:', req.params.id);
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name email rating')
      .populate('passengers', 'name email');
    
    if (!ride) {
      console.log('Ride not found');
      return res.status(404).json({ error: 'Ride not found' });
    }
    
    console.log('Ride found:', ride);
    res.json(ride);
  } catch (error) {
    console.error('Error fetching ride:', error);
    res.status(500).json({ error: 'Failed to fetch ride details' });
  }
});

// Create a new ride
router.post('/', auth, async (req, res) => {
  try {
    const { origin, destination, date, time, seats, price, description, driver } = req.body;

    // Create new ride
    const ride = new Ride({
      driver,
      origin,
      destination,
      date: new Date(`${date}T${time}`),
      seats: parseInt(seats),
      price: parseFloat(price) || 0,
      description,
      passengers: []
    });

    await ride.save();
    res.status(201).json(ride);
  } catch (error) {
    console.error('Error creating ride:', error);
    res.status(500).json({ error: 'Failed to create ride' });
  }
});

// Join a ride
router.post('/:id/join', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    // Check if user is already a passenger
    if (ride.passengers.includes(req.user.id)) {
      return res.status(400).json({ error: 'You have already joined this ride' });
    }

    // Check if there are available seats
    if (ride.passengers.length >= ride.seats) {
      return res.status(400).json({ error: 'No seats available' });
    }

    // Add user to passengers
    ride.passengers.push(req.user.id);
    await ride.save();

    res.json(ride);
  } catch (error) {
    console.error('Error joining ride:', error);
    res.status(500).json({ error: 'Failed to join ride' });
  }
});

module.exports = router; 
const express = require('express');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Contact = require('../models/Contact');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Dashboard stats
router.get('/dashboard', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalRooms = await Room.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const recentBookings = await Booking.find()
      .populate('room', 'name roomNumber')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const roomStats = await Room.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } }
    ]);
    
    // Monthly revenue data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      stats: {
        totalUsers,
        totalRooms,
        totalBookings,
        pendingBookings,
        totalRevenue: totalRevenue[0]?.total || 0
      },
      recentBookings,
      roomStats,
      monthlyRevenue
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.json({ users, count: users.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all contact messages
router.get('/contacts', protect, adminOnly, async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark contact as read
router.put('/contacts/:id/read', protect, adminOnly, async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    res.json({ contact });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

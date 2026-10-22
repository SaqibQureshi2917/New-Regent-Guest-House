const express = require('express');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

// Create payment (mock Stripe)
router.post('/create', protect, async (req, res) => {
  try {
    const { bookingId, paymentMethod } = req.body;
    
    const booking = await Booking.findById(bookingId).populate('room');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Mock Stripe payment intent
    const mockPaymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    const payment = await Payment.create({
      booking: bookingId,
      user: req.user._id,
      amount: booking.totalPrice,
      paymentMethod: paymentMethod || 'card',
      stripePaymentIntentId: mockPaymentIntentId,
      status: 'completed',
      paidAt: new Date()
    });
    
    // Update booking payment status
    booking.paymentStatus = 'paid';
    booking.status = 'confirmed';
    await booking.save();
    
    res.json({
      payment,
      booking,
      message: 'Payment successful'
    });
  } catch (err) {
    console.error('Payment creation failed:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get user's payments
router.get('/my-payments', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('booking', 'bookingId checkIn checkOut totalPrice')
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get all payments
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('booking', 'bookingId room')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

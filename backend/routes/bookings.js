const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const { protect, adminOnly } = require('../middleware/auth');
const router = express.Router();

const parseDateOnly = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
};

// Generate unique booking ID
const generateBookingId = () => {
  const prefix = 'GH';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// Create booking
router.post('/', protect, async (req, res) => {
  try {
    const { roomId, checkIn, checkOut, guests, specialRequests } = req.body;
    
    if (!roomId || !mongoose.isValidObjectId(roomId)) {
      return res.status(400).json({ message: 'Please select a valid room.' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (!room.isAvailable) {
      return res.status(400).json({ message: 'Room is not available' });
    }
    
    // Check date conflicts
    const checkInDate = parseDateOnly(checkIn);
    const checkOutDate = parseDateOnly(checkOut);
    if (!checkInDate || !checkOutDate) {
      return res.status(400).json({ message: 'Enter valid check-in and check-out dates.' });
    }

    const nights = (checkOutDate.getTime() - checkInDate.getTime()) / (24 * 60 * 60 * 1000);
    
    if (nights <= 0) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    if (checkInDate < todayStart) {
      return res.status(400).json({ message: 'Check-in cannot be in the past.' });
    }

    const adults = Number(guests?.adults ?? 1);
    const children = Number(guests?.children ?? 0);
    if (!Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0) {
      return res.status(400).json({ message: 'Enter a valid number of guests.' });
    }
    if (adults + children > room.capacity) {
      return res.status(400).json({ message: `This room can host up to ${room.capacity} guests.` });
    }

    const pricePerNight = Number(room.price);
    if (!Number.isFinite(pricePerNight) || pricePerNight < 0) {
      return res.status(400).json({ message: 'This room does not have a valid nightly rate. Please contact the guest house.' });
    }
    
    const existingBooking = await Booking.findOne({
      room: roomId,
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate }
    });
    
    if (existingBooking) {
      return res.status(409).json({ message: 'This room is already booked for the selected dates. Please choose different dates.' });
    }
    
    const totalPrice = pricePerNight * nights;
    if (!Number.isFinite(totalPrice)) {
      return res.status(400).json({ message: 'Unable to calculate the booking total. Please contact the guest house.' });
    }
    const bookingId = generateBookingId();
    
    const booking = await Booking.create({
      bookingId,
      user: req.user._id,
      room: roomId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: { adults, children },
      totalPrice,
      nights,
      specialRequests: specialRequests || ''
    });
    
    const populatedBooking = await Booking.findById(booking._id)
      .populate('room')
      .populate('user', 'name email phone');
    
    res.status(201).json({ booking: populatedBooking });
  } catch (err) {
    console.error('Booking creation failed:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get user's bookings
router.get('/my-bookings', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('room', 'name roomNumber type price images')
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single booking
router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('room')
      .populate('user', 'name email phone');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Cancel booking
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }
    
    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason || 'User cancelled';
    await booking.save();
    
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get all bookings
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    
    const bookings = await Booking.find(filter)
      .populate('room', 'name roomNumber type price')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    
    res.json({ bookings, count: bookings.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Update booking status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('room').populate('user', 'name email');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

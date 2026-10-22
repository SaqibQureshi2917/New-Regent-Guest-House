const express = require('express');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const crypto = require('crypto');
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return callback(new Error('Please choose an image file.'));
    }
    callback(null, true);
  }
});

// Upload room photos directly to Cloudinary. Credentials remain on the server.
router.post('/images/upload', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return res.status(503).json({ message: 'Cloudinary is not configured. Add its credentials to backend/.env.' });
    }
    if (!req.file) return res.status(400).json({ message: 'Choose an image to upload.' });

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = 'new-regent/rooms';
    const signature = crypto.createHash('sha1')
      .update(`folder=${folder}&timestamp=${timestamp}${CLOUDINARY_API_SECRET}`)
      .digest('hex');
    const form = new FormData();
    form.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);
    form.append('api_key', CLOUDINARY_API_KEY);
    form.append('timestamp', String(timestamp));
    form.append('folder', folder);
    form.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/image/upload`, {
      method: 'POST', body: form
    });
    const result = await response.json();
    if (!response.ok) {
      console.error('Cloudinary upload failed:', result.error?.message || response.statusText);
      return res.status(502).json({ message: 'Image upload failed. Check Cloudinary settings and try again.' });
    }
    res.status(201).json({ url: result.secure_url });
  } catch (err) {
    console.error('Room image upload failed:', err.message);
    res.status(500).json({ message: 'Image upload failed.' });
  }
});

const getTodayBounds = () => {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return { todayStart, tomorrowStart: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) };
};

// Get all rooms
router.get('/', async (req, res) => {
  try {
    const { type, minPrice, maxPrice, sort, featured } = req.query;
    const filter = {};
    
    if (type) filter.type = type;
    if (featured === 'true') filter.featured = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    let query = Room.find(filter);
    
    if (sort === 'price-asc') query = query.sort({ price: 1 });
    else if (sort === 'price-desc') query = query.sort({ price: -1 });
    else if (sort === 'rating') query = query.sort({ rating: -1 });
    else query = query.sort({ createdAt: -1 });
    
    const rooms = await query;
    const roomIds = rooms.map((room) => room._id);
    const { todayStart, tomorrowStart } = getTodayBounds();
    const currentBookings = roomIds.length
      ? await Booking.find({
          room: { $in: roomIds },
          status: { $in: ['pending', 'confirmed'] },
          checkIn: { $lt: tomorrowStart },
          checkOut: { $gt: todayStart }
        }).select('room')
      : [];
    const occupiedRoomIds = new Set(currentBookings.map((booking) => booking.room.toString()));
    const roomsWithOccupancy = rooms.map((room) => ({
      ...room.toObject(),
      isCurrentlyBooked: occupiedRoomIds.has(room._id.toString())
    }));
    res.json({ rooms: roomsWithOccupancy, count: roomsWithOccupancy.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single room
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    const { todayStart, tomorrowStart } = getTodayBounds();
    const currentBooking = await Booking.findOne({
      room: room._id,
      status: { $in: ['pending', 'confirmed'] },
      checkIn: { $lt: tomorrowStart },
      checkOut: { $gt: todayStart }
    }).select('_id');
    res.json({ room: { ...room.toObject(), isCurrentlyBooked: Boolean(currentBooking) } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Public date list for the room details view. Guest details are never exposed.
router.get('/:id/upcoming-bookings', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).select('_id');
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const { todayStart, tomorrowStart } = getTodayBounds();
    const bookings = await Booking.find({
      room: room._id,
      status: { $in: ['pending', 'confirmed'] },
      checkOut: { $gt: todayStart }
    }).select('checkIn checkOut status').sort({ checkIn: 1 });
    const bookedNow = bookings.some((booking) => booking.checkIn < tomorrowStart && booking.checkOut > todayStart);

    res.json({ bookings, bookedNow });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create room (admin only)
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.status(201).json({ room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update room (admin only)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete room (admin only)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true
  },
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    unique: true,
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Room type is required'],
    enum: ['standard', 'deluxe', 'suite', 'presidential'],
    default: 'standard'
  },
  // Nightly rate, stored as a numeric amount in Pakistani rupees (PKR).
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  amenities: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  images: [{
    type: String,
    required: true
  }],
  bathroomImage: {
    type: String,
    default: ''
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: '25 m²'
  },
  bedType: {
    type: String,
    default: 'Queen'
  },
  rating: {
    type: Number,
    default: 4.5,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Room', roomSchema);

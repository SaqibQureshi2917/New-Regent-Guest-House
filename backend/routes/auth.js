const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');
const router = express.Router();

// Register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').trim().notEmpty().withMessage('Phone is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password, phone } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists. Please sign in.' });
    }
    
    const user = await User.create({ name, email: normalizedEmail, password, phone });
    const token = generateToken(user._id);
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(404).json({
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No account was found for this email. Please register first.'
      });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = generateToken(user._id);
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
        avatar: req.user.avatar
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put('/profile', protect, [
  body('name').optional().trim().notEmpty(),
  body('phone').optional().trim().notEmpty()
], async (req, res) => {
  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.phone) updates.phone = req.body.phone;
    if (req.body.avatar) updates.avatar = req.body.avatar;
    
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

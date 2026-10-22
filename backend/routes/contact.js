const express = require('express');
const Contact = require('../models/Contact');
const router = express.Router();

// Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message
    });
    
    res.status(201).json({
      message: 'Message sent successfully',
      contact
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

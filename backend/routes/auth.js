const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'katha_book_secret_key';

// Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Explicitly select password since schema has "select: false"
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // sign token with jsonwebtoken
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        phone: user.phone,
        address: user.address,
        defaultPenaltyPerDay: user.defaultPenaltyPerDay
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Server error during authentication' });
  }
});

// Get Admin Profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ user });
  } catch (err) {
    console.error('❌ Profile fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update Admin Profile & Settings
router.put('/profile', protect, async (req, res) => {
  const { name, shopName, phone, address, defaultPenaltyPerDay } = req.body;
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Admin user not found' });

    user.name = name || user.name;
    user.shopName = shopName || user.shopName;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.defaultPenaltyPerDay = defaultPenaltyPerDay !== undefined ? defaultPenaltyPerDay : user.defaultPenaltyPerDay;

    await user.save();
    res.json({
      message: 'Profile updated',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        shopName: user.shopName,
        phone: user.phone,
        defaultPenaltyPerDay: user.defaultPenaltyPerDay
      }
    });
  } catch (err) {
    console.error('❌ Profile update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

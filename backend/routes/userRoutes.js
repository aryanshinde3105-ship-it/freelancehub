const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

/* =========================
   UPDATE PROFILE
   PUT /api/users/profile
========================= */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const { bio, skills, hourlyRate, location } = req.body;

    // Only allow specific fields
    const updateData = {};

    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = skills;
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate;
    if (location !== undefined) updateData.location = location;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});
/* =========================
   GET CURRENT USER PROFILE
   GET /api/users/me
========================= */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

module.exports = router;

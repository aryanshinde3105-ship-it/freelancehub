const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');

// Register
router.post('/register', registerUser);

// Signup alias
router.post('/signup', registerUser);

// Login
router.post('/login', loginUser);

// Get current user
router.get('/me', getMe);

module.exports = router;

const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { registerUser, loginUser } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;

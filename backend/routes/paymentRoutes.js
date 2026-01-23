const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

// Create Razorpay order
router.post('/create-order', authMiddleware, paymentController.createOrder);

// Verify payment
router.post('/verify', authMiddleware, paymentController.verifyPayment);

// Release payment (called when client approves milestone)
router.post('/release/:milestoneId', authMiddleware, paymentController.releasePayment);

module.exports = router;

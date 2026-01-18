const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // ✅ REMOVE CURLY BRACES
const ratingController = require('../controllers/ratingController');

// Create a rating (protected route)
router.post('/', authMiddleware, ratingController.createRating);

// Get ratings for a specific user (public route)
router.get('/user/:userId', ratingController.getUserRatings);

// Check if current user can review a project (protected route)
router.get('/can-review/:projectId', authMiddleware, ratingController.canReview);

// Get ratings for a specific project (public route)
router.get('/project/:projectId', ratingController.getProjectRatings);

module.exports = router;

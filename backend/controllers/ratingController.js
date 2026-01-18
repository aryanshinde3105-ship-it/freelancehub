const Rating = require('../models/Rating');
const User = require('../models/User');
const Project = require('../models/Project');

/* =====================
   HELPER: UPDATE USER RATING STATS
===================== */
async function updateUserRatingStats(userId) {
  try {
    const ratings = await Rating.find({ reviewedUserId: userId });
    
    if (ratings.length === 0) {
      await User.findByIdAndUpdate(userId, {
        'ratingStats.averageRating': 0,
        'ratingStats.totalRatings': 0,
        'ratingStats.totalReviews': 0,
        'ratingStats.avgCommunication': 0,
        'ratingStats.avgQuality': 0,
        'ratingStats.avgProfessionalism': 0,
        'ratingStats.avgTimeliness': 0,
      });
      return;
    }

    const stats = ratings.reduce((acc, r) => ({
      totalRating: acc.totalRating + r.rating,
      totalCommunication: acc.totalCommunication + (r.communication || 0),
      totalQuality: acc.totalQuality + (r.quality || 0),
      totalProfessionalism: acc.totalProfessionalism + (r.professionalism || 0),
      totalTimeliness: acc.totalTimeliness + (r.timeliness || 0),
      countCommunication: acc.countCommunication + (r.communication ? 1 : 0),
      countQuality: acc.countQuality + (r.quality ? 1 : 0),
      countProfessionalism: acc.countProfessionalism + (r.professionalism ? 1 : 0),
      countTimeliness: acc.countTimeliness + (r.timeliness ? 1 : 0),
      count: acc.count + 1,
      reviewsWithComments: acc.reviewsWithComments + (r.comment ? 1 : 0),
    }), { 
      totalRating: 0, 
      totalCommunication: 0, 
      totalQuality: 0, 
      totalProfessionalism: 0, 
      totalTimeliness: 0,
      countCommunication: 0,
      countQuality: 0,
      countProfessionalism: 0,
      countTimeliness: 0,
      count: 0,
      reviewsWithComments: 0,
    });

    await User.findByIdAndUpdate(userId, {
      'ratingStats.averageRating': parseFloat((stats.totalRating / stats.count).toFixed(2)),
      'ratingStats.totalRatings': stats.count,
      'ratingStats.totalReviews': stats.reviewsWithComments,
      'ratingStats.avgCommunication': stats.countCommunication > 0 ? parseFloat((stats.totalCommunication / stats.countCommunication).toFixed(2)) : 0,
      'ratingStats.avgQuality': stats.countQuality > 0 ? parseFloat((stats.totalQuality / stats.countQuality).toFixed(2)) : 0,
      'ratingStats.avgProfessionalism': stats.countProfessionalism > 0 ? parseFloat((stats.totalProfessionalism / stats.countProfessionalism).toFixed(2)) : 0,
      'ratingStats.avgTimeliness': stats.countTimeliness > 0 ? parseFloat((stats.totalTimeliness / stats.countTimeliness).toFixed(2)) : 0,
    });
  } catch (error) {
    console.error('Update rating stats error:', error);
  }
}

/* =====================
   CREATE RATING
===================== */
exports.createRating = async (req, res) => {
  try {
    const { projectId, reviewedUserId, rating, comment, communication, quality, professionalism, timeliness } = req.body;
    const reviewerId = req.user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Verify project exists and is completed
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed projects' });
    }

    // Verify reviewer is part of the project
    const isClient = project.clientId.toString() === reviewerId;
    const isFreelancer = project.assignedFreelancerId?.toString() === reviewerId;
    
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Not authorized to review this project' });
    }

    // Verify reviewed user is the other party in the project
    const expectedReviewedUserId = isClient ? project.assignedFreelancerId?.toString() : project.clientId.toString();
    if (reviewedUserId !== expectedReviewedUserId) {
      return res.status(400).json({ message: 'Invalid reviewed user' });
    }

    // Determine review type
    const reviewType = isClient ? 'client-to-freelancer' : 'freelancer-to-client';

    // Check if already reviewed
    const existingRating = await Rating.findOne({ projectId, reviewerId });
    if (existingRating) {
      return res.status(400).json({ message: 'You have already reviewed this project' });
    }

    // Create rating
    const newRating = await Rating.create({
      projectId,
      reviewerId,
      reviewedUserId,
      rating,
      comment: comment || '',
      reviewType,
      communication: communication || null,
      quality: quality || null,
      professionalism: professionalism || null,
      timeliness: timeliness || null,
    });

    // Update user rating statistics
    await updateUserRatingStats(reviewedUserId);

    // Update project rating status
    if (isClient) {
      project.ratings.clientReviewed = true;
    } else {
      project.ratings.freelancerReviewed = true;
    }
    await project.save();

    res.status(201).json({ 
      message: 'Rating submitted successfully', 
      rating: newRating 
    });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================
   GET USER RATINGS
===================== */
exports.getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const ratings = await Rating.find({ reviewedUserId: userId })
      .populate('reviewerId', 'name role')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Rating.countDocuments({ reviewedUserId: userId });

    res.json({
      ratings,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================
   CHECK CAN REVIEW
===================== */
exports.canReview = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isClient = project.clientId.toString() === userId;
    const isFreelancer = project.assignedFreelancerId?.toString() === userId;
    
    if (!isClient && !isFreelancer) {
      return res.json({
        canReview: false,
        reason: 'Not part of this project',
        hasReviewed: false,
        projectStatus: project.status,
      });
    }

    const hasReviewed = await Rating.findOne({ projectId, reviewerId: userId });

    const canReview = (isClient || isFreelancer) && 
                     project.status === 'completed' && 
                     !hasReviewed;

    res.json({
      canReview,
      hasReviewed: !!hasReviewed,
      projectStatus: project.status,
      reason: !canReview ? (
        hasReviewed ? 'Already reviewed' : 
        project.status !== 'completed' ? 'Project not completed' : 
        'Cannot review'
      ) : null,
    });
  } catch (error) {
    console.error('Can review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================
   GET PROJECT RATINGS
===================== */
exports.getProjectRatings = async (req, res) => {
  try {
    const { projectId } = req.params;

    const ratings = await Rating.find({ projectId })
      .populate('reviewerId', 'name role')
      .populate('reviewedUserId', 'name role');

    res.json({ ratings });
  } catch (error) {
    console.error('Get project ratings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

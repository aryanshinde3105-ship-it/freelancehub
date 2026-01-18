const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    reviewedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    
    reviewType: {
      type: String,
      enum: ['client-to-freelancer', 'freelancer-to-client'],
      required: true,
    },
    
    comment: {
      type: String,
      maxlength: 500,
      default: '',
    },
    
    // Optional detailed rating dimensions
    communication: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    
    quality: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    
    professionalism: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    
    timeliness: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index: prevent duplicate reviews for same project by same reviewer
ratingSchema.index({ projectId: 1, reviewerId: 1 }, { unique: true });

// Index for quick profile lookups
ratingSchema.index({ reviewedUserId: 1 });

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;

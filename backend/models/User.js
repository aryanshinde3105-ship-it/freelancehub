const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ['client', 'freelancer', 'admin'],
      default: 'client',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isBanned: {
      type: Boolean,
      default: false,
    },

    bannedReason: {
      type: String,
      default: '',
    },

    /* =====================
       Profile Fields
    ===================== */

    bio: {
      type: String,
      maxlength: 500,
      default: '',
    },

    skills: {
      type: [String],
      default: [],
    },

    hourlyRate: {
      type: Number,
      min: 0,
      default: null,
    },

    location: {
      type: String,
      trim: true,
      default: '',
    },

    /* =====================
       ✅ NEW: Rating Statistics
    ===================== */
    ratingStats: {
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalRatings: {
        type: Number,
        default: 0,
        min: 0,
      },
      totalReviews: {
        type: Number,
        default: 0,
        min: 0,
      },
      // Dimension averages
      avgCommunication: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      avgQuality: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      avgProfessionalism: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      avgTimeliness: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;

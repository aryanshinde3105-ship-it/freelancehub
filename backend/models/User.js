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
      enum: ['client', 'freelancer', 'admin'], // ✅ ADDED 'admin'
      default: 'client',
    },

    // ✅ NEW ADMIN MANAGEMENT FIELDS
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
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;

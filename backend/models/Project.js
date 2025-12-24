const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },

    // ✅ FIX: store required skills
    requiredSkills: {
      type: [String],
      default: [],
    },

    budget: {
      type: Number,
      required: true,
    },
    deadline: {
      type: Date,
    },

    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedFreelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    status: {
      type: String,
      enum: ['open', 'in-progress', 'pending-approval', 'completed'],
      default: 'open',
    },

    deliverables: [
      {
        filename: String,
        originalName: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    rejectionReason: {
      type: String,
    },
    lastRejectedAt: {
      type: Date,
    },
    lastUploadedAt: {
      type: Date,
    },

    archivedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);

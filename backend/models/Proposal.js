const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    coverLetter: {
      type: String,
      required: true,
    },
    bidAmount: {
      type: Number,
      required: true,
    },
    estimatedTimeline: {
      type: String, // e.g. "7 days", "2 weeks"
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Proposal = mongoose.model('Proposal', proposalSchema);

module.exports = Proposal;

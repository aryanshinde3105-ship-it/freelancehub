const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    
    order: {
      type: Number,
      required: true,
      default: 1,
    },
    
    // Status tracking
    status: {
      type: String,
      enum: [
        'pending',           // Not started, not paid
        'funded',            // Client paid, money in escrow
        'in-progress',       // Freelancer working on it
        'submitted',         // Freelancer submitted deliverable
        'under-review',      // Client reviewing
        'revision-requested',// Client wants changes
        'approved',          // Client approved, money released
        'rejected',          // Client rejected
      ],
      default: 'pending',
    },
    
    // Progress tracking (0-100)
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    
    // Deliverables
    deliverables: [
      {
        filename: String,
        originalName: String,
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    // Payment tracking
    payment: {
      stripePaymentIntentId: String,
      stripePaymentStatus: String,
      paidAt: Date,
      releasedAt: Date,
      refundedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'paid', 'held', 'released', 'refunded'],
        default: 'pending',
      },
    },
    
    // Timestamps for workflow
    startedAt: Date,
    submittedAt: Date,
    reviewedAt: Date,
    completedAt: Date,
    
    // Feedback
    submissionNotes: String,
    clientFeedback: String,
    revisionNotes: String,
  },
  {
    timestamps: true,
  }
);

// Index for querying milestones by project
milestoneSchema.index({ projectId: 1, order: 1 });

// Virtual for checking if milestone is payable
milestoneSchema.virtual('isPayable').get(function () {
  return this.status === 'pending' && this.payment.status === 'pending';
});

// Virtual for checking if milestone is editable
milestoneSchema.virtual('isEditable').get(function () {
  return this.status === 'pending' && this.payment.status === 'pending';
});

const Milestone = mongoose.model('Milestone', milestoneSchema);

module.exports = Milestone;

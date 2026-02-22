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
        'pending',
        'funded',
        'in-progress',
        'submitted',
        'under-review',
        'revision-requested',
        'approved',
        'rejected',
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

    // Deliverables (file uploads)
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

    // Razorpay payment tracking
    payment: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,
      paidAt: Date,
      releasedAt: Date,
      refundedAt: Date,
      status: {
        type: String,
        enum: ['pending', 'paid', 'held', 'released', 'refunded'],
        default: 'pending',
      },
    },

    // Workflow timestamps
    startedAt: Date,
    submittedAt: Date,
    reviewedAt: Date,
    completedAt: Date,

    // Feedback & notes
    submissionNotes: {
      type: String,
      default: '',
    },
    clientFeedback: {
      type: String,
      default: '',
    },
    revisionNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying milestones by project in order
milestoneSchema.index({ projectId: 1, order: 1 });

// Virtual: is this milestone ready to be funded?
milestoneSchema.virtual('isPayable').get(function () {
  return this.status === 'pending' && this.payment.status === 'pending';
});

// Virtual: can this milestone still be edited?
milestoneSchema.virtual('isEditable').get(function () {
  return this.status === 'pending' && this.payment.status === 'pending';
});

const Milestone = mongoose.model('Milestone', milestoneSchema);

module.exports = Milestone;

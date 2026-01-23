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
        url: String,
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

    /* =====================
       ✅ Rating Tracking
    ===================== */
    ratings: {
      clientReviewed: {
        type: Boolean,
        default: false,
      },
      freelancerReviewed: {
        type: Boolean,
        default: false,
      },
    },

    /* =====================
       ✅ NEW: Milestone Tracking
    ===================== */
    milestones: {
      total: {
        type: Number,
        default: 0,
      },
      completed: {
        type: Number,
        default: 0,
      },
      current: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Milestone',
      },
    },

    /* =====================
       ✅ NEW: Financial Tracking
    ===================== */
    financial: {
      totalBudget: {
        type: Number,
        default: 0,
      },
      paidAmount: {
        type: Number,
        default: 0,
      },
      releasedAmount: {
        type: Number,
        default: 0,
      },
      pendingAmount: {
        type: Number,
        default: 0,
      },
      escrowAmount: {
        type: Number,
        default: 0,
      },
    },

    /* =====================
       ✅ NEW: Overall Progress (0-100)
    ===================== */
    overallProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    /* =====================
       ✅ NEW: Payment Type
    ===================== */
    paymentType: {
      type: String,
      enum: ['fixed-price', 'milestone-based', 'hourly'],
      default: 'milestone-based',
    },
  },
  { timestamps: true }
);

/* =====================
   ✅ NEW: Calculate Overall Progress
===================== */
projectSchema.methods.calculateOverallProgress = async function () {
  const Milestone = mongoose.model('Milestone');
  const milestones = await Milestone.find({ projectId: this._id });

  if (milestones.length === 0) {
    this.overallProgress = 0;
    return 0;
  }

  const totalProgress = milestones.reduce((sum, m) => sum + m.progress, 0);
  this.overallProgress = Math.round(totalProgress / milestones.length);

  return this.overallProgress;
};

/* =====================
   ✅ NEW: Update Financial Stats
===================== */
projectSchema.methods.updateFinancialStats = async function () {
  const Milestone = mongoose.model('Milestone');
  const milestones = await Milestone.find({ projectId: this._id });

  this.financial.totalBudget = milestones.reduce((sum, m) => sum + m.amount, 0);
  this.financial.paidAmount = milestones
    .filter((m) => m.payment.status !== 'pending')
    .reduce((sum, m) => sum + m.amount, 0);
  this.financial.releasedAmount = milestones
    .filter((m) => m.payment.status === 'released')
    .reduce((sum, m) => sum + m.amount, 0);
  this.financial.escrowAmount = milestones
    .filter((m) => m.payment.status === 'held' || m.payment.status === 'paid')
    .reduce((sum, m) => sum + m.amount, 0);
  this.financial.pendingAmount =
    this.financial.totalBudget - this.financial.paidAmount;

  this.milestones.total = milestones.length;
  this.milestones.completed = milestones.filter(
    (m) => m.status === 'approved'
  ).length;

  return this.financial;
};

module.exports = mongoose.model('Project', projectSchema);

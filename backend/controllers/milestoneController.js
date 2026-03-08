const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const Razorpay = require('razorpay');
const { uploadFileToAzure } = require('../utils/azureStorage');
const {
  notifyMilestoneSubmitted,
  notifyRevisionRequested,
  notifyMilestoneRejected,
} = require('../utils/notificationHelper');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* =====================
   CREATE MILESTONE
===================== */
exports.createMilestone = async (req, res) => {
  try {
    const { projectId, title, description, amount, order } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only project owner can create milestones' });
    }
    
    const milestone = await Milestone.create({
      projectId,
      title,
      description,
      amount,
      order: order || 1,
    });
    
    await project.updateFinancialStats();
    await project.save();
    
    res.status(201).json({ 
      message: 'Milestone created successfully', 
      milestone 
    });
  } catch (error) {
    console.error('Create milestone error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================
   GET PROJECT MILESTONES
===================== */
exports.getProjectMilestones = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const milestones = await Milestone.find({ projectId })
      .sort({ order: 1 })
      .lean();
    
    res.json({ milestones });
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================
   GET SINGLE MILESTONE
===================== */
exports.getMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    
    const milestone = await Milestone.findById(id)
      .populate('projectId', 'title clientId assignedFreelancerId');
    
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    res.json({ milestone });
  } catch (error) {
    console.error('Get milestone error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================
   UPDATE MILESTONE
===================== */
exports.updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, amount, order } = req.body;
    
    const milestone = await Milestone.findById(id).populate('projectId');
    
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    if (milestone.status !== 'pending' || milestone.payment.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot edit milestone that has been paid or started' 
      });
    }
    
    if (milestone.projectId.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (title) milestone.title = title;
    if (description) milestone.description = description;
    if (amount !== undefined) milestone.amount = amount;
    if (order !== undefined) milestone.order = order;
    
    await milestone.save();
    
    await milestone.projectId.updateFinancialStats();
    await milestone.projectId.save();
    
    res.json({ 
      message: 'Milestone updated successfully', 
      milestone 
    });
  } catch (error) {
    console.error('Update milestone error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================
   DELETE MILESTONE
===================== */
exports.deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    
    const milestone = await Milestone.findById(id).populate('projectId');
    
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    if (milestone.status !== 'pending' || milestone.payment.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot delete milestone that has been paid or started' 
      });
    }
    
    if (milestone.projectId.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await Milestone.findByIdAndDelete(id);
    
    await milestone.projectId.updateFinancialStats();
    await milestone.projectId.save();
    
    res.json({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Delete milestone error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================
   UPDATE MILESTONE PROGRESS
   Bug 3 Fix: Allow slider to promote status from funded → in-progress
   so freelancers don't have to click 'Start Work' before dragging the slider.
===================== */
exports.updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ message: 'Progress must be between 0 and 100' });
    }
    
    const milestone = await Milestone.findById(id).populate('projectId');
    
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    if (milestone.projectId.assignedFreelancerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only assigned freelancer can update progress' });
    }

    // Only allow progress updates on active milestones
    const activeStatuses = ['funded', 'in-progress', 'revision-requested'];
    if (!activeStatuses.includes(milestone.status)) {
      return res.status(400).json({
        message: `Cannot update progress on a milestone with status: ${milestone.status}`,
      });
    }
    
    milestone.progress = progress;
    
    // Bug 3 Fix: Promote status from funded → in-progress when progress > 0
    // This allows the slider to implicitly start work without requiring the button
    if (progress > 0 && milestone.status === 'funded') {
      milestone.status = 'in-progress';
      milestone.startedAt = new Date();
    }

    // If freelancer drags back to 0 while in-progress, keep status as in-progress
    // (don't regress back to funded)
    
    await milestone.save();
    
    await milestone.projectId.calculateOverallProgress();
    await milestone.projectId.save();
    
    res.json({ 
      message: 'Progress updated successfully', 
      milestone 
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================
   UPDATE MILESTONE STATUS
   Freelancer (via updateStatus):
     funded → in-progress
   Freelancer (via submitMilestone endpoint — NOT here):
     in-progress → submitted
     revision-requested → submitted
   Client:
     submitted → approved | revision-requested | rejected
     rejected  → cancelled  (refund path)
   Payment release for 'approved' is also triggered via /api/payments/release/:id.
===================== */
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, clientFeedback, revisionNotes } = req.body;

    const allowedStatuses = ['in-progress', 'revision-requested', 'rejected', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}. To approve a milestone use POST /api/payments/release/:id` });
    }

    const milestone = await Milestone.findById(id).populate('projectId');

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    const project = milestone.projectId;
    const isClient = project.clientId.toString() === req.user.id;
    const isFreelancer = project.assignedFreelancerId?.toString() === req.user.id;

    // Freelancer may only start work via updateStatus.
    // Submitting work (in-progress/revision-requested → submitted) must go through POST /:id/submit.
    const freelancerTransitions = {
      'funded': 'in-progress',
    };

    // Client reviews a submission or cancels a rejected milestone.
    const clientTransitions = {
      'submitted': ['revision-requested', 'rejected'],
      // After rejecting, client can cancel the milestone entirely (triggers refund)
      'rejected': ['cancelled'],
    };

    if (isFreelancer) {
      if (freelancerTransitions[milestone.status] !== status) {
        return res.status(400).json({
          message: `Invalid transition: ${milestone.status} → ${status} for freelancer. To submit work use POST /:id/submit.`,
        });
      }
      if (status === 'in-progress') {
        milestone.startedAt = new Date();
      }
    } else if (isClient) {
      if (!clientTransitions[milestone.status]?.includes(status)) {
        return res.status(400).json({
          message: `Invalid transition: ${milestone.status} → ${status} for client`,
        });
      }

      milestone.reviewedAt = new Date();

      if (status === 'revision-requested') {
        if (!revisionNotes) {
          return res.status(400).json({ message: 'revisionNotes is required when requesting a revision' });
        }
        milestone.revisionNotes = revisionNotes;
      }

      if (status === 'rejected') {
        if (clientFeedback !== undefined) milestone.clientFeedback = clientFeedback;
      }

      // Notify the freelancer of the client's decision
      const freelancerId = project.assignedFreelancerId;
      if (freelancerId) {
        if (status === 'revision-requested') {
          await notifyRevisionRequested(freelancerId, milestone.title, project.title, project._id, revisionNotes);
        } else if (status === 'rejected') {
          await notifyMilestoneRejected(freelancerId, milestone.title, project.title, project._id);
        }
      }

      if (status === 'cancelled') {
        milestone.completedAt = new Date();
        // Initiate a real Razorpay refund if the client had already funded this milestone
        if (
          (milestone.payment.status === 'paid' || milestone.payment.status === 'held') &&
          milestone.payment.razorpayPaymentId
        ) {
          try {
            const refund = await razorpay.payments.refund(milestone.payment.razorpayPaymentId, {
              amount: milestone.amount * 100, // full refund in paise
              notes: {
                reason: 'Milestone cancelled by client',
                milestoneId: milestone._id.toString(),
              },
            });
            milestone.payment.status = 'refunded';
            milestone.payment.refundedAt = new Date();
            milestone.payment.razorpayRefundId = refund.id;
          } catch (refundErr) {
            // Log but don't block the cancellation — admin can process manually
            console.error('Razorpay refund failed during milestone cancel:', refundErr.message);
            milestone.payment.status = 'refunded'; // mark for manual processing
            milestone.payment.refundedAt = new Date();
          }
        }
      }
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }

    milestone.status = status;
    await milestone.save();

    // After cancelled, check if all milestones for this project are now resolved.
    // (Approval + project completion is handled by releasePayment.)
    if (status === 'cancelled') {
      const allMilestones = await Milestone.find({ projectId: project._id });
      const allResolved = allMilestones.every(
        (m) => m.status === 'approved' || m.status === 'cancelled'
      );
      if (allResolved && allMilestones.length > 0) {
        project.status = 'completed';
        await project.save();
      }
    }

    res.json({ message: `Milestone status updated to ${status}`, milestone });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/* =====================
   SUBMIT MILESTONE WORK
   Freelancer uploads deliverable files for a milestone.
   Supports multiple submissions (revisions).
===================== */
exports.submitMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const milestone = await Milestone.findById(id).populate('projectId');

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    const project = milestone.projectId;

    // Only the assigned freelancer may submit
    if (project.assignedFreelancerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the assigned freelancer can submit work' });
    }

    // Milestone must be in a state where submission makes sense
    const submittableStatuses = ['funded', 'in-progress', 'revision-requested'];
    if (!submittableStatuses.includes(milestone.status)) {
      return res.status(400).json({
        message: `Cannot submit work for a milestone with status: ${milestone.status}`,
      });
    }

    // req.files is populated by milestoneUpload (field name: milestoneFile)
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one file is required for submission' });
    }

    // Upload each file to Azure and collect results
    const uploadedFiles = [];
    for (const file of req.files) {
      const url = await uploadFileToAzure(file.filename, file.path, file.mimetype);
      uploadedFiles.push({ filename: file.originalname, url });
    }

    // Append new submission entry (preserves full revision history)
    milestone.submissions.push({
      files: uploadedFiles,
      message: message || '',
      submittedBy: req.user.id,
      submittedAt: new Date(),
    });

    // Transition milestone to submitted
    milestone.status = 'submitted';
    milestone.submittedAt = new Date();
    if (milestone.progress < 100) {
      milestone.progress = 100;
    }

    await milestone.save();

    // Notify the client
    await notifyMilestoneSubmitted(project.clientId, milestone.title, project.title, project._id);

    res.json({ message: 'Submission recorded successfully', milestone });
  } catch (error) {
    console.error('Submit milestone error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createMilestone: exports.createMilestone,
  getProjectMilestones: exports.getProjectMilestones,
  getMilestone: exports.getMilestone,
  updateMilestone: exports.updateMilestone,
  deleteMilestone: exports.deleteMilestone,
  updateProgress: exports.updateProgress,
  updateStatus: exports.updateStatus,
  submitMilestone: exports.submitMilestone,
};

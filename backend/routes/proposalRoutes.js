const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Project = require('../models/Project');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { createNotification } = require('../utils/notificationHelper'); // NEW IMPORT

/* =======================
   FREELANCER: MY PROPOSALS
======================= */
router.get('/my', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can view proposals' });
    }

    const proposals = await Proposal.find({
      freelancerId: req.user.id,
    })
      .populate('projectId', 'title status budget')
      .sort({ createdAt: -1 });

    res.json(proposals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load proposals' });
  }
});

/* =======================
   CREATE PROPOSAL
======================= */
router.post('/:projectId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can apply' });
    }

    const existing = await Proposal.findOne({
      projectId: req.params.projectId,
      freelancerId: req.user.id,
    });

    if (existing) {
      return res.status(400).json({ message: 'Already applied' });
    }

    const proposal = await Proposal.create({
      projectId: req.params.projectId,
      freelancerId: req.user.id,
      ...req.body,
    });

    // ✅ SEND NOTIFICATION TO CLIENT
    const project = await Project.findById(req.params.projectId);
    const freelancer = await User.findById(req.user.id);
    
    if (project && freelancer) {
      await createNotification({
        userId: project.clientId,
        type: 'proposal_received',
        title: 'New Proposal Received',
        message: `${freelancer.name} has submitted a proposal for "${project.title}"`,
        link: `/project/${project._id}/proposals`,
      });
    }

    res.status(201).json(proposal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to apply' });
  }
});

/* =======================
   GET PROPOSALS BY PROJECT
======================= */
router.get('/project/:projectId', authMiddleware, async (req, res) => {
  try {
    const proposals = await Proposal.find({
      projectId: req.params.projectId,
    }).populate('freelancerId', 'name email');

    res.json(proposals);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   ACCEPT PROPOSAL (SAFE)
======================= */
router.patch('/:proposalId/accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can accept proposals' });
    }

    const proposal = await Proposal.findById(req.params.proposalId);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const project = await Project.findById(proposal.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // 🔒 atomic assignment (prevents race condition)
    const updatedProject = await Project.findOneAndUpdate(
      {
        _id: project._id,
        assignedFreelancerId: null,
      },
      {
        assignedFreelancerId: proposal.freelancerId,
        status: 'in-progress',
      },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(400).json({
        message: 'Another proposal has already been accepted',
      });
    }

    // update proposal statuses
    const allProposals = await Proposal.find({ projectId: project._id });
    
    await Proposal.updateMany(
      { projectId: project._id },
      { status: 'rejected' }
    );

    proposal.status = 'accepted';
    await proposal.save();

    // ✅ SEND NOTIFICATION TO ACCEPTED FREELANCER
    await createNotification({
      userId: proposal.freelancerId,
      type: 'proposal_accepted',
      title: 'Proposal Accepted! 🎉',
      message: `Congratulations! Your proposal for "${project.title}" has been accepted.`,
      link: `/my-active-projects`,
    });

    // ✅ SEND NOTIFICATIONS TO REJECTED FREELANCERS
    for (const rejectedProposal of allProposals) {
      if (rejectedProposal._id.toString() !== proposal._id.toString()) {
        await createNotification({
          userId: rejectedProposal.freelancerId,
          type: 'proposal_rejected',
          title: 'Proposal Not Selected',
          message: `Your proposal for "${project.title}" was not selected. Keep applying!`,
          link: `/browse-projects`,
        });
      }
    }

    res.json({ message: 'Proposal accepted safely' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to accept proposal' });
  }
});

/* =======================
   REJECT PROPOSAL
======================= */
router.patch('/:proposalId/reject', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can reject proposals' });
    }

    const proposal = await Proposal.findById(req.params.proposalId);
    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const project = await Project.findById(proposal.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    proposal.status = 'rejected';
    await proposal.save();

    // ✅ SEND NOTIFICATION TO FREELANCER
    await createNotification({
      userId: proposal.freelancerId,
      type: 'proposal_rejected',
      title: 'Proposal Not Selected',
      message: `Your proposal for "${project.title}" was not selected.`,
      link: `/browse-projects`,
    });

    res.json({ message: 'Proposal rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reject proposal' });
  }
});

module.exports = router;

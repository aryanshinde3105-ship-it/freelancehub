const express = require('express');
const router = express.Router();
const Proposal = require('../models/Proposal');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/authMiddleware');

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
    await Proposal.updateMany(
      { projectId: project._id },
      { status: 'rejected' }
    );

    proposal.status = 'accepted';
    await proposal.save();

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

    res.json({ message: 'Proposal rejected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reject proposal' });
  }
});

module.exports = router;

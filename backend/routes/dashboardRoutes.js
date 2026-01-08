const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Proposal = require('../models/Proposal');
const authMiddleware = require('../middleware/authMiddleware');

/* =======================
   GET DASHBOARD ANALYTICS
======================= */
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'client') {
      // Client analytics
      const totalProjects = await Project.countDocuments({ clientId: userId });
      
      const activeProjects = await Project.countDocuments({
        clientId: userId,
        status: { $in: ['open', 'in-progress', 'pending-approval'] },
      });

      const completedProjects = await Project.countDocuments({
        clientId: userId,
        status: 'completed',
      });

      // Get all project IDs for this client
      const clientProjects = await Project.find({ clientId: userId }).select('_id budget');
      const projectIds = clientProjects.map(p => p._id);

      // Total proposals received across all projects
      const totalProposals = await Proposal.countDocuments({
        projectId: { $in: projectIds },
      });

      // Calculate total budget
      const totalBudget = clientProjects.reduce((sum, p) => sum + (p.budget || 0), 0);

      // Recent activity
      const recentProjects = await Project.find({ clientId: userId })
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title status updatedAt');

      return res.json({
        role: 'client',
        stats: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalProposals,
          totalBudget,
        },
        recentActivity: recentProjects,
      });
    }

    if (role === 'freelancer') {
      // Freelancer analytics
      const totalProposals = await Proposal.countDocuments({ freelancerId: userId });

      const acceptedProposals = await Proposal.countDocuments({
        freelancerId: userId,
        status: 'accepted',
      });

      const rejectedProposals = await Proposal.countDocuments({
        freelancerId: userId,
        status: 'rejected',
      });

      const pendingProposals = await Proposal.countDocuments({
        freelancerId: userId,
        status: 'pending',
      });

      const activeProjects = await Project.countDocuments({
        assignedFreelancerId: userId,
        status: { $in: ['in-progress', 'pending-approval'] },
      });

      const completedProjects = await Project.countDocuments({
        assignedFreelancerId: userId,
        status: 'completed',
      });

      // Recent activity
      const recentProposals = await Proposal.find({ freelancerId: userId })
        .populate('projectId', 'title status')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('status createdAt projectId');

      return res.json({
        role: 'freelancer',
        stats: {
          totalProposals,
          acceptedProposals,
          rejectedProposals,
          pendingProposals,
          activeProjects,
          completedProjects,
        },
        recentActivity: recentProposals,
      });
    }

    return res.status(400).json({ message: 'Invalid role' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load dashboard stats' });
  }
});

module.exports = router;

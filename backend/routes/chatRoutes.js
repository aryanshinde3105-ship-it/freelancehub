const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Project = require('../models/Project');
const authMiddleware = require('../middleware/authMiddleware');

/* =======================
   GET CHAT MESSAGES
======================= */
router.get('/:projectId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only client or assigned freelancer can access
    const isClient = project.clientId.toString() === req.user.id;
    const isFreelancer =
      project.assignedFreelancerId &&
      project.assignedFreelancerId.toString() === req.user.id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ projectId: project._id })
      .populate('senderId', 'name role')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   SEND MESSAGE
======================= */
router.post('/:projectId', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Message required' });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isClient = project.clientId.toString() === req.user.id;
    const isFreelancer =
      project.assignedFreelancerId &&
      project.assignedFreelancerId.toString() === req.user.id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const message = await Message.create({
      projectId: project._id,
      senderId: req.user.id,
      text,
    });

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Project = require('../models/Project');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { createNotification } = require('../utils/notificationHelper'); // NEW IMPORT

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
    const { text, clientMessageId } = req.body;
    const sanitizedText = typeof text === 'string' ? text.trim() : '';
    if (!sanitizedText) return res.status(400).json({ message: 'Message required' });

    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isClient = project.clientId.toString() === req.user.id;
    const isFreelancer =
      project.assignedFreelancerId &&
      project.assignedFreelancerId.toString() === req.user.id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let message = null;

    if (clientMessageId) {
      message = await Message.findOne({
        projectId: project._id,
        senderId: req.user.id,
        clientMessageId,
      }).populate('senderId', 'name role');
    }

    if (!message) {
      const created = await Message.create({
        projectId: project._id,
        senderId: req.user.id,
        text: sanitizedText,
        ...(clientMessageId ? { clientMessageId } : {}),
      });

      message = await Message.findById(created._id).populate('senderId', 'name role');
    }

    // ✅ SEND NOTIFICATION TO RECIPIENT
    const sender = await User.findById(req.user.id);
    
    // Determine recipient (if sender is client, recipient is freelancer, and vice versa)
    const recipientId = isClient 
      ? project.assignedFreelancerId 
      : project.clientId;

    if (recipientId) {
      await createNotification({
        userId: recipientId,
        type: 'new_message',
        title: 'New Message',
        message: `${sender.name} sent you a message about "${project.title}"`,
        link: `/chat/${project._id}`,
      });
    }

    res.status(201).json(message);
  } catch (err) {
    if (err && err.code === 11000) {
      try {
        const existingMessage = await Message.findOne({
          projectId: req.params.projectId,
          senderId: req.user.id,
          clientMessageId: req.body.clientMessageId,
        }).populate('senderId', 'name role');

        if (existingMessage) {
          return res.status(200).json(existingMessage);
        }
      } catch (findErr) {
        console.error(findErr);
      }
    }

    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

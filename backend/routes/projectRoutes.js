const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

/* =======================
   CREATE PROJECT (CLIENT)
======================= */
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can post projects' });
    }

    const project = await Project.create({
      ...req.body,
      clientId: req.user.id,
      status: 'open',
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   GET ALL OPEN PROJECTS
======================= */
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ status: 'open' }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   CLIENT: MY PROJECTS
======================= */
router.get('/my', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can view their projects' });
    }

    const projects = await Project.find({ clientId: req.user.id })
      .populate('assignedFreelancerId', 'name email')
      .sort({ updatedAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   FREELANCER: ACTIVE PROJECTS
======================= */
router.get('/active', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can view active projects' });
    }

    const projects = await Project.find({
      assignedFreelancerId: req.user.id,
    })
      .populate('clientId', 'name email')
      .sort({ updatedAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   ARCHIVE CHAT (PER USER)
======================= */
router.patch('/:id/archive', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isClient = project.clientId.toString() === req.user.id;
    const isFreelancer =
      project.assignedFreelancerId &&
      project.assignedFreelancerId.toString() === req.user.id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!project.archivedBy.includes(req.user.id)) {
      project.archivedBy.push(req.user.id);
      await project.save();
    }

    res.json({ message: 'Chat archived' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Archive failed' });
  }
});

/* =======================
   UNARCHIVE CHAT
======================= */
router.patch('/:id/unarchive', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.archivedBy = project.archivedBy.filter(
      (userId) => userId.toString() !== req.user.id
    );

    await project.save();

    res.json({ message: 'Chat unarchived' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Unarchive failed' });
  }
});

/* =======================
   GET SINGLE PROJECT
======================= */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('clientId', 'name email')
      .populate('assignedFreelancerId', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isClient = project.clientId._id.toString() === req.user.id;
    const isFreelancer =
      project.assignedFreelancerId &&
      project.assignedFreelancerId._id.toString() === req.user.id;

    if (!isClient && !isFreelancer) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

/* =======================
   UPLOAD FINAL WORK (FREELANCER)
======================= */
router.post(
  '/:id/upload',
  authMiddleware,
  upload.single('file'),
  async (req, res) => {
    try {
      if (req.user.role !== 'freelancer') {
        return res.status(403).json({ message: 'Only freelancers can upload files' });
      }

      const project = await Project.findById(req.params.id);
      if (!project) return res.status(404).json({ message: 'Project not found' });

      if (
        !project.assignedFreelancerId ||
        project.assignedFreelancerId.toString() !== req.user.id
      ) {
        return res.status(403).json({ message: 'Not allowed' });
      }

      project.deliverables.push({
        filename: req.file.filename,
        originalName: req.file.originalname,
        uploadedBy: req.user.id,
      });

      project.lastUploadedAt = new Date();
      project.rejectionReason = undefined;
      project.status = 'pending-approval';

      await project.save();

      res.json({ message: 'File uploaded successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Upload failed' });
    }
  }
);

/* =======================
   CLIENT: REJECT PROJECT
======================= */
router.patch('/:id/reject', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can reject projects' });
    }

    const { reason } = req.body;
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    project.status = 'in-progress';
    project.rejectionReason = reason;
    project.lastRejectedAt = new Date();

    await project.save();

    res.json({ message: 'Project rejected with reason' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Rejection failed' });
  }
});

/* =======================
   CLIENT: APPROVE PROJECT
======================= */
router.patch('/:id/approve', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can approve' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (
      project.lastRejectedAt &&
      (!project.lastUploadedAt || project.lastUploadedAt <= project.lastRejectedAt)
    ) {
      return res.status(400).json({
        message: 'Freelancer must re-upload after rejection before approval',
      });
    }

    project.status = 'completed';
    await project.save();

    res.json({ message: 'Project approved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Approval failed' });
  }
});

module.exports = router;

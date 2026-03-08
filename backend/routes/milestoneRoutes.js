const express = require('express');
const router = express.Router();
const multer = require('multer');
const authMiddleware = require('../middleware/authMiddleware');
const milestoneController = require('../controllers/milestoneController');
const { milestoneUpload } = require('../middleware/uploadMiddleware');

// Wraps milestoneUpload so multer validation errors return clean 400 responses
const handleMilestoneUpload = (req, res, next) => {
  milestoneUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: `File upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Create milestone (client only)
router.post('/', authMiddleware, milestoneController.createMilestone);

// Get all milestones for a project
router.get('/project/:projectId', authMiddleware, milestoneController.getProjectMilestones);

// Get single milestone
router.get('/:id', authMiddleware, milestoneController.getMilestone);

// Update milestone (client only, if not paid)
router.put('/:id', authMiddleware, milestoneController.updateMilestone);

// Update milestone status (freelancer transitions + client review actions)
router.patch('/:id/status', authMiddleware, milestoneController.updateStatus);

// Delete milestone (client only, if not paid)
router.delete('/:id', authMiddleware, milestoneController.deleteMilestone);

// Update milestone progress (freelancer only)
router.patch('/:id/progress', authMiddleware, milestoneController.updateProgress);

// Submit milestone work (freelancer only) — supports multiple files per submission
router.post('/:id/submit', authMiddleware, handleMilestoneUpload, milestoneController.submitMilestone);

module.exports = router;

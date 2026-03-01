const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const milestoneController = require('../controllers/milestoneController');

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

module.exports = router;

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

// ✅ NEW: Update milestone status (freelancer transitions + client review actions)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, submissionNote } = req.body;
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ message: 'Milestone not found' });

    milestone.status = status;

    // ✅ Save freelancer's submission note
    if (status === 'submitted' && submissionNote !== undefined) {
      milestone.submissionNotes = submissionNote;
    }

    await milestone.save(); // pre-save hook handles timestamps automatically

    res.json({ success: true, milestone });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Delete milestone (client only, if not paid)
router.delete('/:id', authMiddleware, milestoneController.deleteMilestone);

// Update milestone progress (freelancer only)
router.patch('/:id/progress', authMiddleware, milestoneController.updateProgress);

module.exports = router;

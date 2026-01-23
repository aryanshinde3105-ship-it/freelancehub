const Milestone = require('../models/Milestone');
const Project = require('../models/Project');

/* =====================
   CREATE MILESTONE
===================== */
exports.createMilestone = async (req, res) => {
  try {
    const { projectId, title, description, amount, order } = req.body;
    
    // Verify project exists and user is the client
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (project.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only project owner can create milestones' });
    }
    
    // Create milestone
    const milestone = await Milestone.create({
      projectId,
      title,
      description,
      amount,
      order: order || 1,
    });
    
    // Update project financial stats
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
    
    // Only allow editing if milestone is pending and not paid
    if (milestone.status !== 'pending' || milestone.payment.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot edit milestone that has been paid or started' 
      });
    }
    
    // Verify user is project owner
    if (milestone.projectId.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update fields
    if (title) milestone.title = title;
    if (description) milestone.description = description;
    if (amount !== undefined) milestone.amount = amount;
    if (order !== undefined) milestone.order = order;
    
    await milestone.save();
    
    // Update project financial stats
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
    
    // Only allow deletion if milestone is pending and not paid
    if (milestone.status !== 'pending' || milestone.payment.status !== 'pending') {
      return res.status(400).json({ 
        message: 'Cannot delete milestone that has been paid or started' 
      });
    }
    
    // Verify user is project owner
    if (milestone.projectId.clientId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await Milestone.findByIdAndDelete(id);
    
    // Update project financial stats
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
    
    // Verify user is the assigned freelancer
    if (milestone.projectId.assignedFreelancerId?.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only assigned freelancer can update progress' });
    }
    
    milestone.progress = progress;
    
    // Auto-update status
    if (progress > 0 && milestone.status === 'funded') {
      milestone.status = 'in-progress';
      milestone.startedAt = new Date();
    }
    
    await milestone.save();
    
    // Update project overall progress
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

module.exports = {
  createMilestone: exports.createMilestone,
  getProjectMilestones: exports.getProjectMilestones,
  getMilestone: exports.getMilestone,
  updateMilestone: exports.updateMilestone,
  deleteMilestone: exports.deleteMilestone,
  updateProgress: exports.updateProgress,
};

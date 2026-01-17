const express = require('express');
const {
  getAdminStats,
  getAllUsers,
  toggleBanUser,
  deleteUser,
  getAllProjects,
  deleteProject,
} = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// Dashboard Stats
router.get('/stats', getAdminStats);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleBanUser);
router.delete('/users/:id', deleteUser);

// Project Management
router.get('/projects', getAllProjects);
router.delete('/projects/:id', deleteProject);

module.exports = router;

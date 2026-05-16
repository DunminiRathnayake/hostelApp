import express from 'express';
import { getDashboardStats, getStudentStats } from '../controllers/dashboardController.js';
import { protect, wardenOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Warden-only aggregate stats
router.get('/stats', protect, wardenOnly, getDashboardStats);

// Student-specific live stats
router.get('/student-stats', protect, getStudentStats);

export default router;

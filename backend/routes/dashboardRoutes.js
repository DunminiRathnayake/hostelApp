import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { protect, wardenOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route restricted to Admins
router.get('/stats', protect, wardenOnly, getDashboardStats);

export default router;

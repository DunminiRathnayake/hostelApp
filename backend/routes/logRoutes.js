import express from 'express';
import { scanQR, getLogs } from '../controllers/logController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only warden can access these routes
router.post('/scan', protect, authorizeRoles('warden'), scanQR);
router.get('/', protect, authorizeRoles('warden'), getLogs);

export default router;

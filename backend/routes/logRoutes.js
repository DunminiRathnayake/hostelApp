import express from 'express';
import { scanQR, getLogs, updateLog, deleteLog } from '../controllers/logController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only warden can access these routes
router.post('/scan', protect, authorizeRoles('warden'), scanQR);
router.get('/', protect, authorizeRoles('warden'), getLogs);

router.route('/:id')
  .put(protect, authorizeRoles('warden', 'admin'), updateLog)
  .delete(protect, authorizeRoles('admin'), deleteLog);

export default router;

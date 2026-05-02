import express from 'express';
import { getCheckins, getMyCheckins, deleteCheckin } from '../controllers/checkinController.js';
import { scanQR } from '../controllers/logController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { scanQRSchema } from '../validations/logValidations.js';

const router = express.Router();

// POST /api/checkin/scan — Warden scans student QR to record check-in/out
router.post('/scan', protect, authorizeRoles('warden'), validate(scanQRSchema), scanQR);

// GET /api/checkin — All logs (warden)
router.route('/')
  .get(protect, authorizeRoles('warden'), getCheckins);

// GET /api/checkin/my — Student's own history
router.route('/my')
  .get(protect, getMyCheckins);

// DELETE /api/checkin/:id — Admin/Warden deletes a log
router.route('/:id')
  .delete(protect, authorizeRoles('admin', 'warden'), deleteCheckin);

export default router;


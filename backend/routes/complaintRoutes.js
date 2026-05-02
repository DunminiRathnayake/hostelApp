import express from 'express';
import {
  createComplaint,
  getMyComplaints,
  getComplaints,
  updateComplaintStatus
} from '../controllers/complaintController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createComplaintSchema, updateComplaintStatusSchema } from '../validations/interactionValidations.js';

const router = express.Router();

router.route('/')
  .get(protect, authorizeRoles('warden'), getComplaints)
  .post(protect, validate(createComplaintSchema), createComplaint);

router.route('/my-complaints')
  .get(protect, getMyComplaints);

router.route('/:id/status')
  .put(protect, authorizeRoles('warden'), validate(updateComplaintStatusSchema), updateComplaintStatus);

export default router;

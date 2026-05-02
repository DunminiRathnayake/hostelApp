import express from 'express';
import {
  submitFeedback,
  getFeedback,
  deleteFeedback
} from '../controllers/feedbackController.js';
import { protect, wardenOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(protect, submitFeedback)  // Any user can submit
  .get(protect, getFeedback);     // Any user can view

router.route('/:id')
  .delete(protect, wardenOnly, deleteFeedback); // Only admin can delete

export default router;

import express from 'express';
import {
  submitFeedback,
  getFeedback,
  deleteFeedback
} from '../controllers/feedbackController.js';
import { protect, wardenOnly } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { submitReviewSchema } from '../validations/interactionValidations.js';

const router = express.Router();

// /api/reviews maps to the same feedback controller
router.route('/')
  .post(protect, validate(submitReviewSchema), submitFeedback)
  .get(protect, getFeedback);

router.route('/:id')
  .delete(protect, wardenOnly, deleteFeedback);

export default router;

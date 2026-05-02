import asyncHandler from 'express-async-handler';
import interactionService from '../services/interactionService.js';

// @desc    Submit feedback / review
// @route   POST /api/reviews  (also /api/feedback)
// @access  Private (Any logged-in user)
export const submitFeedback = asyncHandler(async (req, res) => {
  const result = await interactionService.createFeedback(req.user._id, req.body);
  res.status(201).json(result);
});

// @desc    Get all feedback / reviews
// @route   GET /api/reviews  (also /api/feedback)
// @access  Private (Any logged-in user)
export const getFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await interactionService.getAllFeedback();
  res.json(feedbacks);
});

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
export const deleteFeedback = asyncHandler(async (req, res) => {
  await interactionService.deleteFeedback(req.params.id);
  res.json({ message: 'Feedback removed successfully' });
});

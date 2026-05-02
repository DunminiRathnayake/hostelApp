import asyncHandler from 'express-async-handler';
import interactionService from '../services/interactionService.js';

// @desc    Submit a complaint
// @route   POST /api/complaints
// @access  Private (Student)
export const createComplaint = asyncHandler(async (req, res) => {
  const complaint = await interactionService.createComplaint(req.user._id, req.body);
  res.status(201).json(complaint);
});

// @desc    Get user's complaints
// @route   GET /api/complaints/my-complaints
// @access  Private (Student)
export const getMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await interactionService.getMyComplaints(req.user._id);
  res.json({ complaints });
});

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private (Warden/Admin)
export const getComplaints = asyncHandler(async (req, res) => {
  const complaints = await interactionService.getAllComplaints();
  res.json({ complaints });
});

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (Warden/Admin)
export const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = await interactionService.updateComplaintStatus(req.params.id, req.body.status);
  res.json(complaint);
});

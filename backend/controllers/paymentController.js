import asyncHandler from 'express-async-handler';
import paymentService from '../services/paymentService.js';

// @desc    Create a payment
// @route   POST /api/payments
// @access  Private
export const createPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.createPayment(req.user._id, req.body, req.file);
  res.status(201).json(payment);
});

// @desc    Get payment history
// @route   GET /api/payments
// @access  Private (Admin/Warden)
export const getPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getAllPayments();
  res.json(payments);
});

// @desc    Get my payments
// @route   GET /api/payments/my
// @access  Private (Student)
export const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await paymentService.getMyPayments(req.user._id);
  res.json(payments);
});

// @desc    Update payment status
// @route   PUT /api/payments/:id
// @access  Private/Admin
export const updatePayment = asyncHandler(async (req, res) => {
  const updatedPayment = await paymentService.updatePayment(req.params.id, req.body);
  res.json(updatedPayment);
});

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Private/Admin
export const deletePayment = asyncHandler(async (req, res) => {
  await paymentService.deletePayment(req.params.id);
  res.json({ message: 'Payment removed successfully' });
});

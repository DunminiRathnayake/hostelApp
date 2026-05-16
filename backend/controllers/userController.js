import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import userService from '../services/userService.js';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user._id);
  res.json({
    _id: user._id,
    name: user.name,
    fullName: user.name,
    email: user.email,
    role: user.role,
    campus: user.campus,
    studentPhone: user.studentPhone,
    emergencyContactName: user.emergencyContactName,
    emergencyPhone: user.emergencyPhone,
    isActive: user.isActive
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUser(req.user._id, req.body);
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    fullName: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    campus: updatedUser.campus,
    studentPhone: updatedUser.studentPhone,
    emergencyContactName: updatedUser.emergencyContactName,
    emergencyPhone: updatedUser.emergencyPhone
  });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json(user);
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUser(req.params.id, req.body);
  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.json({ message: 'User removed' });
});

// @desc    Get all students
// @route   GET /api/users/students
// @access  Private/Admin
export const getStudents = asyncHandler(async (req, res) => {
  const includeUnassigned = req.query.unassigned === 'true';
  const students = await userService.getStudents(includeUnassigned);
  res.json(students);
});

// @desc    Get all students basic info (Public for visitors)
// @route   GET /api/users/public/students
// @access  Public
export const getPublicStudents = asyncHandler(async (req, res) => {
  const students = await userService.getPublicStudents();
  res.json(students);
});

// @desc    Deactivate a user
// @route   PUT /api/users/deactivate/:id
// @access  Private/Admin
export const deactivateUser = asyncHandler(async (req, res) => {
  await userService.deactivateUser(req.params.id);
  res.json({ message: 'User deactivated successfully' });
});

// @desc    Get my QR token
// @route   GET /api/users/my-qr
// @access  Private
export const getMyQR = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user._id);

  const { deviceId } = req.query;
  const jti = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  const token = jwt.sign(
    { 
      id: user._id, 
      name: user.name, 
      role: user.role, 
      deviceId,
      jti
    },
    process.env.JWT_SECRET,
    { expiresIn: '45s' }
  );

  res.json({ token, qrImage: null });
});

// @desc    Change logged-in user's password
// @route   PUT /api/users/change-password
// @access  Private
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Both current and new password are required');
  }
  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  // Fetch user WITH password field (normally excluded by select('-password'))
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword; // pre-save hook will hash it automatically
  await user.save();

  res.json({ message: 'Password changed successfully' });
});

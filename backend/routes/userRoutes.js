import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStudents,
  deactivateUser,
  getMyQR,
  getPublicStudents
} from '../controllers/userController.js';
import { protect, wardenOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, wardenOnly, getUsers);

router.route('/students')
  .get(protect, getStudents);

// Public route for visitors to select a student
router.route('/public/students')
  .get(getPublicStudents);

router.route('/my-qr')
  .get(protect, getMyQR);

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/:id')
  .get(protect, wardenOnly, getUserById)
  .put(protect, wardenOnly, updateUser)
  .delete(protect, wardenOnly, deleteUser);

router.route('/deactivate/:id')
  .put(protect, wardenOnly, deactivateUser);

export default router;

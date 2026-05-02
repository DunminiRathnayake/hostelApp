import express from 'express';
import {
  createBooking,
  getBookings,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getBookingStatusPublic
} from '../controllers/bookingController.js';
import { protect, wardenOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .post(createBooking)
  .get(protect, wardenOnly, getBookings);

router.route('/mybookings')
  .get(protect, getMyBookings);

router.route('/public/status')
  .get(getBookingStatusPublic);

router.route('/:id')
  .get(protect, getBookingById);

router.route('/:id/status')
  .put(protect, wardenOnly, updateBookingStatus);

router.route('/:id/cancel')
  .put(protect, cancelBooking);

export default router;

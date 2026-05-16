import User from '../models/User.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Log from '../models/Log.js';
import Payment from '../models/Payment.js';
import Feedback from '../models/Feedback.js';

// @desc    Get dashboard statistics (Warden)
// @route   GET /api/dashboard/stats
// @access  Private/Warden
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalRooms,
      availableRooms,
      fullRooms,
      totalBookings,
      todayCheckIns,
      todayCheckOuts
    ] = await Promise.all([
      User.countDocuments(),
      Room.countDocuments(),
      Room.countDocuments({ status: 'Available' }),
      Room.countDocuments({ status: 'Full' }),
      Booking.countDocuments(),
      Log.countDocuments({ type: 'check-in', scannedAt: { $gte: today } }),
      Log.countDocuments({ type: 'check-out', scannedAt: { $gte: today } })
    ]);

    res.json({
      totalUsers,
      totalRooms,
      availableRooms,
      fullRooms,
      totalBookings,
      todayCheckIns,
      todayCheckOuts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student-specific dashboard stats
// @route   GET /api/dashboard/student-stats
// @access  Private (Student)
export const getStudentStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Start of current month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [payments, checkins, feedbacks] = await Promise.all([
      Payment.find({ user: userId, status: { $in: ['pending', 'rejected'] } }),
      Log.countDocuments({ user: userId, type: 'check-in', scannedAt: { $gte: monthStart } }),
      Feedback.find({ user: userId }).sort({ createdAt: -1 }).limit(1)
    ]);

    const pendingAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const latestRating = feedbacks.length > 0 ? feedbacks[0].rating : null;

    res.json({
      pendingAmount,
      checkins,
      latestRating
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

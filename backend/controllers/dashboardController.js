import User from '../models/User.js';
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Log from '../models/Log.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    // Get start of today for filtering logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Run all database queries in parallel for performance
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

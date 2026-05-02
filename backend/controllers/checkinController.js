import Log from '../models/Log.js';

// @desc    Get all check-ins
// @route   GET /api/checkin
// @access  Private (Warden/Admin)
export const getCheckins = async (req, res) => {
  try {
    const logs = await Log.find({})
      .populate('user', 'name fullName')
      .sort({ scannedAt: -1 });

    // Format for frontend
    const formattedLogs = logs.map(log => ({
      _id: log._id,
      studentId: log.user,
      checkInTime: log.type === 'check-in' ? log.scannedAt : null,
      checkOutTime: log.type === 'check-out' ? log.scannedAt : null,
      isLate: false, // You can add logic for late check-in
      isLateCheckOut: false
    }));

    res.json(formattedLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's check-ins
// @route   GET /api/checkin/my
// @access  Private (Student)
export const getMyCheckins = async (req, res) => {
  try {
    const logs = await Log.find({ user: req.user._id })
      .sort({ scannedAt: -1 });

    const formattedLogs = logs.map(log => ({
      _id: log._id,
      date: log.scannedAt,
      checkInTime: log.type === 'check-in' ? log.scannedAt : null,
      checkOutTime: log.type === 'check-out' ? log.scannedAt : null,
      isLate: false,
      isLateCheckOut: false
    }));

    res.json(formattedLogs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

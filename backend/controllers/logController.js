import jwt from 'jsonwebtoken';
import Log from '../models/Log.js';
import User from '../models/User.js';
import { isLateCheckIn, isLateCheckOut as isLateCheckOutUtil } from '../utils/timeValidation.js';

// In-memory store for replay protection (JTIs). In production, use Redis.
// Since tokens expire in 45s, a Map with a simple cleanup interval is sufficient.
const usedTokens = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [jti, expiry] of usedTokens.entries()) {
    if (now > expiry) {
      usedTokens.delete(jti);
    }
  }
}, 60000);

// @desc    Scan QR token and log attendance (check-in / check-out)
// @route   POST /api/logs/scan
// @access  Private (Admin or Warden only)
export const scanQR = async (req, res) => {
  try {
    const { token, scannerDeviceId } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'QR token is required' });
    }

    // Verify the JWT token from the QR code
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired QR token' });
    }

    // Replay Attack Protection
    if (decoded.jti) {
      if (usedTokens.has(decoded.jti)) {
        return res.status(403).json({ message: 'This QR code has already been used. Please generate a new one.' });
      }
      // Store jti with its expiration time (decoded.exp is in seconds)
      usedTokens.set(decoded.jti, decoded.exp * 1000);
    }

    const userId = decoded.id;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Determine if it should be a check-in or check-out based on their last log
    const lastLog = await Log.findOne({ user: userId }).sort({ scannedAt: -1 });

    // Cooldown Mechanism: 60 seconds
    if (lastLog) {
      const timeSinceLastScan = Date.now() - new Date(lastLog.scannedAt).getTime();
      if (timeSinceLastScan < 60000) {
        return res.status(429).json({ message: 'Please wait at least 60 seconds before scanning again.' });
      }
    }

    let logType = 'check-in'; // default if no previous log
    if (lastLog && lastLog.type === 'check-in') {
      logType = 'check-out';
    }

    // Late Logic Evaluation
    let isLate = false;
    let isLateCheckOut = false;
    const now = new Date();

    if (logType === 'check-in') {
      isLate = isLateCheckIn(now);
    } else {
      isLateCheckOut = isLateCheckOutUtil(now);
    }

    // Device / Session Binding Verification (Optional/Advanced)
    // If the backend had stored the active session ID, we could verify decoded.deviceId here.
    const deviceInfoStr = scannerDeviceId || 'Warden Scanner App';

    // Save the log in MongoDB
    const newLog = await Log.create({
      user: userId,
      type: logType,
      scannedAt: now,
      scannedBy: req.user._id, // Recording who performed the scan
      deviceInfo: deviceInfoStr,
      isLate,
      isLateCheckOut
    });

    const populatedLog = await newLog.populate('user', 'name email role');
    
    // Construct specific message
    let statusMsg = `Successfully recorded ${logType} for ${user.name}`;
    if (isLate) statusMsg += ' (LATE CHECK-IN)';
    if (isLateCheckOut) statusMsg += ' (LATE CHECK-OUT)';

    res.status(201).json({
      message: statusMsg,
      log: populatedLog,
      type: logType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all logs
// @route   GET /api/logs
// @access  Private (Admin or Warden only)
export const getLogs = async (req, res) => {
  try {
    const logs = await Log.find({})
      .populate('user', 'name email role')
      .populate('scannedBy', 'name role')
      .sort({ scannedAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

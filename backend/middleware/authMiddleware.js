import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @desc    Protect route - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// @desc    Restrict to admin only
export const wardenOnly = (req, res, next) => {
  if (req.user?.role === 'warden') {
    next();
  } else {
    res.status(403).json({
      message: `Access denied. Requires warden role. Your role: ${req.user?.role}`
    });
  }
};

// @desc    Restrict to specific roles (flexible, accepts array of roles)
// Usage:   router.get('/path', protect, authorizeRoles('warden'), handler)
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user?.role)) {
      next();
    } else {
      res.status(403).json({
        message: `Access denied. Requires one of: [${roles.join(', ')}]. Your role: ${req.user?.role}`
      });
    }
  };
};

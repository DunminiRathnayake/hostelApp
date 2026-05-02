import express from 'express';
import multer from 'multer';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer for multipart/form-data (NIC image uploads on registration)
const upload = multer({ dest: 'uploads/' });

// Public routes
router.post('/register', upload.fields([{ name: 'nicFront' }, { name: 'nicBack' }]), registerUser);
router.post('/login', loginUser);

// Private route - requires valid JWT
router.get('/me', protect, getMe);

export default router;

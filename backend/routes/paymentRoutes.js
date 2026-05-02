import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createPayment,
  getPayments,
  updatePayment,
  deletePayment,
  getMyPayments
} from '../controllers/paymentController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createPaymentSchema, updatePaymentStatusSchema } from '../validations/paymentValidations.js';

const router = express.Router();

// ── Multer disk storage (preserves file extension) ──────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `slip_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ⚠️ /my MUST come before /:id
router.route('/my')
  .get(protect, getMyPayments);

router.route('/')
  .post(protect, upload.single('slipImage'), validate(createPaymentSchema), createPayment)
  .get(protect, authorizeRoles('warden'), getPayments);

router.route('/:id')
  .put(protect, authorizeRoles('warden'), validate(updatePaymentStatusSchema), updatePayment)
  .delete(protect, authorizeRoles('warden'), deletePayment);

export default router;


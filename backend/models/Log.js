import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['check-in', 'check-out'],
    required: true
  },
  scannedAt: {
    type: Date,
    default: Date.now
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Optional: To record which admin/warden scanned the QR
  },
  deviceInfo: {
    type: String // Optional: To record scanner device info
  },
  isLate: {
    type: Boolean,
    default: false
  },
  isLateCheckOut: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Log = mongoose.model('Log', logSchema);
export default Log;

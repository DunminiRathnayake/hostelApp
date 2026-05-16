import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  category: {
    type: String
  },
  description: {
    type: String
  },
  paymentType: {
    type: String
  },
  month: {
    type: String
  },
  receiptUrl: {
    type: String
  }
}, { timestamps: true });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;

import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  visitorName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  NIC: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['student_visit', 'room_visit'],
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;

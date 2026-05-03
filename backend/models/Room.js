import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 1
  },
  currentOccupancy: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['Available', 'Full', 'Maintenance'],
    default: 'Available'
  },
  type: {
    type: String,
    enum: ['Standard', 'Single', 'Double', 'Triple', 'Dormitory'],
    default: 'Standard'
  },

  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  group: {
    type: Number,
    default: null
  }
}, { timestamps: true });

// Business logic: update status before saving
roomSchema.pre('save', function() {
  if (this.currentOccupancy >= this.capacity) {
    this.status = 'Full';
  } else if (this.status === 'Full' && this.currentOccupancy < this.capacity) {
    this.status = 'Available';
  }
});

const Room = mongoose.model('Room', roomSchema);
export default Room;

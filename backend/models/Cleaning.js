import mongoose from 'mongoose';

const cleaningSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['task', 'schedule'],
    default: 'task'
  },
  // Task specific fields
  area: {
    type: String,
    required: function() { return this.type === 'task'; },
  },
  assignedRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending',
  },
  date: {
    type: Date,
  },
  
  // Schedule specific fields
  week: {
    Monday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    Tuesday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    Wednesday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    Thursday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    Friday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    Saturday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
    Sunday: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  }
}, { timestamps: true });

const Cleaning = mongoose.model('Cleaning', cleaningSchema);
export default Cleaning;

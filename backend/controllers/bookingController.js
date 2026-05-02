import Booking from '../models/Booking.js';
import Room from '../models/Room.js';

// @desc    Create new booking request (Public for Visitors)
// @route   POST /api/bookings
// @access  Public
export const createBooking = async (req, res) => {
  try {
    const { visitorName, phone, NIC, type, studentId, date, time } = req.body;

    const booking = await Booking.create({
      visitorName,
      phone,
      NIC,
      type,
      studentId: type === 'student_visit' ? studentId : undefined,
      date,
      time
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
export const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('studentId', 'name')
      .sort({ createdAt: -1 });
    
    // Map data for the frontend
    const mappedBookings = bookings.map(b => ({
      ...b._doc,
      studentName: b.studentId ? b.studentId.name : null
    }));
      
    res.json(mappedBookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user bookings (if we want students to see visits)
// @route   GET /api/bookings/mybookings
// @access  Private
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ studentId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get booking status for a visitor (Public)
// @route   GET /api/bookings/public/status
// @access  Public
export const getBookingStatusPublic = async (req, res) => {
  try {
    const { phone, NIC } = req.query;
    
    if (!phone || !NIC) {
      return res.status(400).json({ message: 'Phone and NIC are required' });
    }

    const bookings = await Booking.find({ phone, NIC })
      .populate('studentId', 'name')
      .sort({ createdAt: -1 })
      .limit(1);

    if (bookings.length === 0) {
      return res.json([]); // Return empty array to match frontend expectation
    }

    // Map data for the frontend
    const mappedBooking = {
      ...bookings[0]._doc,
      studentName: bookings[0].studentId ? bookings[0].studentId.name : null
    };

    res.json([mappedBooking]); // Return as array to match frontend res.data[0]
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('studentId', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking status (Admin)
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = 'rejected'; // Or cancelled
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

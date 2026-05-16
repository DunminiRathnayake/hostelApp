import Booking from '../models/Booking.js';
import Room from '../models/Room.js';

// @desc    Create new booking request (Public for Visitors)
// @route   POST /api/bookings
// @access  Public
export const createBooking = async (req, res) => {
  try {
    // Extract booking details from the request body
    const { visitorName, phone, NIC, type, studentId, date, time } = req.body;

    // Create a new booking in the database
    // Only associate a student ID if the visit type specifically targets a student
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
    // Fetch all bookings and populate the associated student's name
    // Sort the bookings by creation date (newest first)
    const bookings = await Booking.find({})
      .populate('studentId', 'name')
      .sort({ createdAt: -1 });
    
    // Map the database documents to a frontend-friendly format
    // Flatten the studentId object to just expose the studentName string
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
    // Extract phone and NIC from query parameters for visitor authentication
    const { phone, NIC } = req.query;
    
    // Validate that both required fields are present
    if (!phone || !NIC) {
      return res.status(400).json({ message: 'Phone and NIC are required' });
    }

    // Find the most recent booking matching the visitor's credentials
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
    // Extract the new status from the request body (e.g., 'approved' or 'rejected')
    const { status } = req.body;
    
    // Find the specific booking by its ID
    const booking = await Booking.findById(req.params.id);

    // Return a 404 error if the booking does not exist
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

    booking.status = 'cancelled';
    const updatedBooking = await booking.save();
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a booking
// @route   DELETE /api/bookings/:id
// @access  Private/Admin
export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    await booking.deleteOne();
    res.json({ message: 'Booking removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

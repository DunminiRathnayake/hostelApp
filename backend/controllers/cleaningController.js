import Cleaning from '../models/Cleaning.js';
import Room from '../models/Room.js';

const CLEANING_AREAS = [
  "Common Bathroom 1",
  "Common Bathroom 2",
  "Study Area",
  "Living Area",
  "Balcony",
  "Dining Area"
];

// Helper to ensure today's tasks are created
const ensureTodaysTasks = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // 1. Get schedule
  const scheduleDoc = await Cleaning.findOne({ type: 'schedule' });
  if (!scheduleDoc) return;

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysOfWeek[today.getDay()];
  const assignedRoomsForToday = scheduleDoc.week[todayName] || [];

  if (assignedRoomsForToday.length === 0) return; // No rooms scheduled for today

  // 2. Get existing tasks for today
  const existingTasks = await Cleaning.find({
    type: 'task',
    date: { $gte: today, $lt: tomorrow }
  });

  const existingAreas = existingTasks.map(t => t.area);
  
  // 3. Identify missing areas
  const missingAreas = CLEANING_AREAS.filter(area => !existingAreas.includes(area));

  if (missingAreas.length === 0) return; // All areas covered

  // 4. Distribute missing areas across assigned rooms (round-robin)
  let roomIndex = 0;
  const newTasks = [];
  for (const area of missingAreas) {
    const roomId = assignedRoomsForToday[roomIndex % assignedRoomsForToday.length];
    newTasks.push({
      type: 'task',
      area,
      assignedRoom: roomId,
      date: new Date(),
      status: 'pending'
    });
    roomIndex++;
  }

  if (newTasks.length > 0) {
    await Cleaning.insertMany(newTasks);
  }
};

// @desc    Get all cleaning tasks for today
// @route   GET /api/cleaning/tasks
// @access  Private (Warden/Admin)
export const getCleanings = async (req, res) => {
  try {
    await ensureTodaysTasks();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await Cleaning.find({
      type: 'task',
      date: { $gte: today, $lt: tomorrow }
    }).populate('assignedRoom', 'roomNumber');
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tasks formatted and grouped by room
// @route   GET /api/cleaning/tasks-formatted
// @access  Private (Warden/Admin)
export const getCleaningsFormatted = async (req, res) => {
  try {
    await ensureTodaysTasks();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await Cleaning.find({
      type: 'task',
      date: { $gte: today, $lt: tomorrow }
    }).populate('assignedRoom', 'roomNumber');

    const formatted = {};
    tasks.forEach(task => {
      const roomId = task.assignedRoom?._id || 'unassigned';
      if (!formatted[roomId]) {
        formatted[roomId] = [];
      }
      formatted[roomId].push(task);
    });

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a cleaning task status
// @route   PUT /api/cleaning/tasks/:id
// @access  Private (Student/Warden)
export const updateCleaningStatus = async (req, res) => {
  try {
    const task = await Cleaning.findOne({ _id: req.params.id, type: 'task' });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    task.status = 'completed';
    // If student completes it, optionally set assignedTo: req.user._id
    if (req.user && req.user.role === 'student') {
        task.assignedTo = req.user._id;
    }

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student's cleaning tasks
// @route   GET /api/cleaning/student-tasks
// @access  Private (Student)
export const getStudentCleaning = async (req, res) => {
  try {
    await ensureTodaysTasks();

    // Find the room the student is currently assigned to
    const room = await Room.findOne({ students: req.user._id });
    if (!room) {
      return res.json([]);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await Cleaning.find({ 
        type: 'task', 
        assignedRoom: room._id,
        date: { $gte: today, $lt: tomorrow }
    }).populate('assignedRoom', 'roomNumber');
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get the weekly cleaning schedule
// @route   GET /api/cleaning/schedule
// @access  Private (Warden/Admin)
export const getSchedule = async (req, res) => {
  try {
    let scheduleDoc = await Cleaning.findOne({ type: 'schedule' }).populate([
        { path: 'week.Monday', select: 'roomNumber' },
        { path: 'week.Tuesday', select: 'roomNumber' },
        { path: 'week.Wednesday', select: 'roomNumber' },
        { path: 'week.Thursday', select: 'roomNumber' },
        { path: 'week.Friday', select: 'roomNumber' },
        { path: 'week.Saturday', select: 'roomNumber' },
        { path: 'week.Sunday', select: 'roomNumber' }
    ]);
    
    if (!scheduleDoc) {
      scheduleDoc = {
        type: 'schedule',
        week: { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] }
      };
    }
    res.json(scheduleDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update the weekly cleaning schedule
// @route   PUT /api/cleaning/schedule
// @access  Private (Warden/Admin)
export const updateSchedule = async (req, res) => {
  try {
    const { week } = req.body;
    
    let scheduleDoc = await Cleaning.findOne({ type: 'schedule' });
    if (!scheduleDoc) {
      scheduleDoc = new Cleaning({ type: 'schedule', week });
    } else {
      scheduleDoc.week = week;
    }
    
    await scheduleDoc.save();

    // Trigger task regeneration: Delete today's pending tasks, then regenerate
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Cleaning.deleteMany({
      type: 'task',
      status: 'pending',
      date: { $gte: today, $lt: tomorrow }
    });

    await ensureTodaysTasks();

    res.json({ message: 'Schedule updated and tasks regenerated successfully', schedule: scheduleDoc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

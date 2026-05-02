import express from 'express';
import {
  getCleanings,
  getCleaningsFormatted,
  getStudentCleaning,
  updateCleaningStatus,
  getSchedule,
  updateSchedule,
  deleteCleaningTask
} from '../controllers/cleaningController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. GET /api/cleaning/tasks - Return all tasks for today
router.get('/tasks', protect, authorizeRoles('warden'), getCleanings);

// 2. GET /api/cleaning/tasks-formatted - Group tasks by room
router.get('/tasks-formatted', protect, authorizeRoles('warden'), getCleaningsFormatted);

// 3. GET /api/cleaning/student-tasks - Get tasks for logged-in student
router.get('/student-tasks', protect, authorizeRoles('student', 'warden'), getStudentCleaning);

// 4. PUT /api/cleaning/tasks/:id - Mark task as completed
router.route('/tasks/:id')
  .put(protect, updateCleaningStatus)
  .delete(protect, authorizeRoles('warden', 'admin'), deleteCleaningTask);

// 5. GET /api/cleaning/schedule - Return weekly schedule
router.get('/schedule', protect, authorizeRoles('warden'), getSchedule);

// 6. PUT /api/cleaning/schedule - Update weekly schedule
router.put('/schedule', protect, authorizeRoles('warden'), updateSchedule);

export default router;

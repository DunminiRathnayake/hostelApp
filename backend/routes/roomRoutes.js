import express from 'express';
import {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  allocateRoom,
  removeStudent,
  updateRoomGroup
} from '../controllers/roomController.js';
import { protect, wardenOnly } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createRoomSchema, updateRoomSchema, assignStudentSchema } from '../validations/roomValidations.js';

const router = express.Router();

router.route('/')
  .get(protect, getRooms)
  .post(protect, wardenOnly, validate(createRoomSchema), createRoom);

router.route('/allocate')
  .post(protect, wardenOnly, validate(assignStudentSchema), allocateRoom);

router.route('/remove')
  .post(protect, wardenOnly, validate(assignStudentSchema), removeStudent);

router.route('/:id')
  .get(protect, getRoomById)
  .put(protect, wardenOnly, validate(updateRoomSchema), updateRoom)
  .delete(protect, wardenOnly, deleteRoom);

router.route('/:id/group')
  .put(protect, wardenOnly, updateRoomGroup); // We could add a schema here if needed

export default router;

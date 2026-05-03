import asyncHandler from 'express-async-handler';
import roomService from '../services/roomService.js';

// @desc    Create a room
// @route   POST /api/rooms
// @access  Private/Admin
export const createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom(req.body);
  res.status(201).json(room);
});

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
export const getRooms = asyncHandler(async (req, res) => {
  const rooms = await roomService.getAllRooms();
  res.json({ rooms });
});

// @desc    Get room by ID
// @route   GET /api/rooms/:id
// @access  Private
export const getRoomById = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomById(req.params.id);
  res.json(room);
});

// @desc    Update a room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
export const updateRoom = asyncHandler(async (req, res) => {
  const updatedRoom = await roomService.updateRoom(req.params.id, req.body);
  res.json(updatedRoom);
});

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
export const deleteRoom = asyncHandler(async (req, res) => {
  await roomService.deleteRoom(req.params.id);
  res.json({ message: 'Room removed' });
});

// @desc    Allocate student to room
// @route   POST /api/rooms/allocate
// @access  Private/Admin
export const allocateRoom = asyncHandler(async (req, res) => {
  console.log('[allocateRoom] req.body =', req.body);
  const { studentId, roomId } = req.body;
  const room = await roomService.allocateStudent(roomId, studentId);
  res.json({ message: 'Student allocated successfully', room });
});

// @desc    Remove student from room
// @route   POST /api/rooms/remove
// @access  Private/Admin
export const removeStudent = asyncHandler(async (req, res) => {
  const { studentId, roomId } = req.body;
  const room = await roomService.removeStudent(roomId, studentId);
  res.json({ message: 'Student removed successfully', room });
});

// @desc    Update room group
// @route   PUT /api/rooms/:id/group
// @access  Private/Admin
export const updateRoomGroup = asyncHandler(async (req, res) => {
  const { group } = req.body;
  const room = await roomService.updateRoomGroup(req.params.id, group);
  res.json({ message: 'Room group updated', room });
});

import Room from '../models/Room.js';
import Cleaning from '../models/Cleaning.js';

class RoomService {
  async createRoom(roomData) {
    const roomExists = await Room.findOne({ roomNumber: roomData.roomNumber });
    if (roomExists) {
      const error = new Error('Room already exists');
      error.status = 400;
      throw error;
    }
    return await Room.create(roomData);
  }

  async getAllRooms() {
    return await Room.find({}).populate('students', 'name email _id');
  }

  async getRoomById(roomId) {
    const room = await Room.findById(roomId).populate('students', 'name email _id');
    if (!room) {
      const error = new Error('Room not found');
      error.status = 404;
      throw error;
    }
    return room;
  }

  async updateRoom(roomId, updateData) {
    const room = await Room.findById(roomId);
    if (!room) {
      const error = new Error('Room not found');
      error.status = 404;
      throw error;
    }
    Object.assign(room, updateData);
    return await room.save();
  }

  async deleteRoom(roomId) {
    const room = await Room.findById(roomId);
    if (!room) {
      const error = new Error('Room not found');
      error.status = 404;
      throw error;
    }
    // Cascade: remove cleaning tasks referencing this room
    await Cleaning.deleteMany({ assignedRoom: roomId });
    await room.deleteOne();
    return true;
  }

  async allocateStudent(roomId, studentId) {
    const room = await Room.findById(roomId);
    if (!room) {
      const error = new Error('Room not found');
      error.status = 404;
      throw error;
    }
    if (room.students.includes(studentId)) {
      const error = new Error('Student already in this room');
      error.status = 400;
      throw error;
    }
    if (room.currentOccupancy >= room.capacity) {
      const error = new Error('Room is full');
      error.status = 400;
      throw error;
    }
    room.students.push(studentId);
    room.currentOccupancy += 1;
    return await room.save();
  }

  async removeStudent(roomId, studentId) {
    const room = await Room.findById(roomId);
    if (!room) {
      const error = new Error('Room not found');
      error.status = 404;
      throw error;
    }
    room.students = room.students.filter(s => s.toString() !== studentId);
    room.currentOccupancy = room.students.length;
    return await room.save();
  }

  async updateRoomGroup(roomId, group) {
    const room = await Room.findById(roomId);
    if (!room) {
      const error = new Error('Room not found');
      error.status = 404;
      throw error;
    }
    room.group = group;
    return await room.save();
  }
}

export default new RoomService();

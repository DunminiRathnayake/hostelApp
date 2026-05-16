import User from '../models/User.js';
import Room from '../models/Room.js';

/**
 * Service to handle User business logic
 */
class UserService {
  async createUser(userData) {
    const userExists = await User.findOne({ email: userData.email });
    if (userExists) {
      const error = new Error('User already exists');
      error.status = 400;
      throw error;
    }
    return await User.create(userData);
  }

  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    return user;
  }

  async getAllUsers() {
    return await User.find({}).select('-password');
  }

  async getStudents(includeUnassigned = false) {
    const students = await User.find({ role: 'student' }).select('-password').lean();
    const rooms = await Room.find().select('students roomNumber');

    if (includeUnassigned) {
      const assignedStudentIds = rooms.flatMap(r => r.students.map(s => s.toString()));
      return students.filter(s => !assignedStudentIds.includes(s._id.toString()));
    }

    return students.map(student => {
      const assignedRoom = rooms.find(r => r.students.some(sId => sId.toString() === student._id.toString()));
      return {
        ...student,
        assignedRoom: assignedRoom ? assignedRoom.roomNumber : null
      };
    });
  }

  async getPublicStudents() {
    return await User.find({ role: 'student', isActive: true }).select('name _id').lean();
  }

  async updateUser(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }

    // Whitelist allowed fields — prevent role escalation or password tampering
    const ALLOWED_FIELDS = ['name', 'campus', 'studentPhone', 'emergencyContactName', 'emergencyPhone'];
    const filtered = Object.fromEntries(
      Object.entries(updateData).filter(([k]) => ALLOWED_FIELDS.includes(k))
    );

    Object.assign(user, filtered);
    return await user.save();
  }

  async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    // Remove student from any room they are assigned to, fix occupancy count
    await Room.updateMany(
      { students: userId },
      { $pull: { students: userId }, $inc: { currentOccupancy: -1 } }
    );
    await user.deleteOne();
    return true;
  }

  async deactivateUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    user.isActive = false;
    await user.save();
    return user;
  }
}

export default new UserService();

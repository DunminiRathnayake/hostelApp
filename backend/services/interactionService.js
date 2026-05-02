import Feedback from '../models/Feedback.js';
import Complaint from '../models/Complaint.js';

class InteractionService {
  // --- Reviews / Feedback ---
  async createFeedback(userId, feedbackData) {
    const feedback = await Feedback.create({
      user: userId,
      rating: feedbackData.rating,
      comment: feedbackData.comment
    });

    const populated = await Feedback.findById(feedback._id).populate('user', 'name email role');
    const result = populated.toObject();
    result.student = result.user; // Map for frontend compatibility
    return result;
  }

  async getAllFeedback() {
    const feedbacks = await Feedback.find({})
      .populate('user', 'name role')
      .sort({ createdAt: -1 });

    return feedbacks.map(f => {
      const obj = f.toObject();
      obj.student = obj.user;
      return obj;
    });
  }

  async deleteFeedback(feedbackId) {
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      const error = new Error('Feedback not found');
      error.status = 404;
      throw error;
    }
    await feedback.deleteOne();
    return true;
  }

  // --- Complaints ---
  async createComplaint(userId, complaintData) {
    return await Complaint.create({
      title: complaintData.title,
      description: complaintData.description,
      studentId: userId,
    });
  }

  async getMyComplaints(userId) {
    return await Complaint.find({ studentId: userId }).sort({ createdAt: -1 });
  }

  async getAllComplaints() {
    return await Complaint.find({})
      .populate('studentId', 'name fullName')
      .sort({ createdAt: -1 });
  }

  async updateComplaintStatus(complaintId, status) {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      const error = new Error('Complaint not found');
      error.status = 404;
      throw error;
    }
    complaint.status = status;
    return await complaint.save();
  }
}

export default new InteractionService();

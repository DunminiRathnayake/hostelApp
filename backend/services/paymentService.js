import Payment from '../models/Payment.js';

class PaymentService {
  async createPayment(userId, paymentData, file) {
    let receiptUrl = '';
    if (file) {
      receiptUrl = `/uploads/${file.filename}`;
    }

    const payment = await Payment.create({
      user: userId,
      amount: parseFloat(paymentData.amount),
      category: paymentData.category,
      description: paymentData.description,
      paymentType: paymentData.paymentType,
      receiptUrl,
      status: 'pending'
    });

    return await payment.populate('user', 'name email');
  }

  async getAllPayments() {
    const payments = await Payment.find({})
      .populate('user', 'name email role')
      .sort({ paymentDate: -1 });

    return payments.map(p => ({
      ...p.toObject(),
      studentName: p.user?.name || 'Unknown Student'
    }));
  }

  async getMyPayments(userId) {
    return await Payment.find({ user: userId }).sort({ createdAt: -1 });
  }

  async updatePayment(paymentId, updateData) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      const error = new Error('Payment not found');
      error.status = 404;
      throw error;
    }

    payment.status = updateData.status || payment.status;
    payment.amount = updateData.amount || payment.amount;

    if (updateData.status === 'approved') {
      payment.paymentDate = Date.now();
    }

    return await payment.save();
  }

  async deletePayment(paymentId) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      const error = new Error('Payment not found');
      error.status = 404;
      throw error;
    }
    await payment.deleteOne();
    return true;
  }
}

export default new PaymentService();

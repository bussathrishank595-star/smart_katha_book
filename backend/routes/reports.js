const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

router.use(protect);

const getDateRange = (type, startDate, endDate) => {
  const now = new Date();
  if (startDate && endDate) {
    return { start: new Date(startDate), end: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  }
  switch (type) {
    case 'daily':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      };
    case 'weekly':
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      return { start: startOfWeek, end: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000) };
    case 'monthly':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    default:
      return { start: new Date(0), end: new Date() };
  }
};

// @route GET /api/reports
router.get('/', async (req, res) => {
  try {
    const { type = 'daily', startDate, endDate } = req.query;
    const userId = req.user._id;
    const { start, end } = getDateRange(type, startDate, endDate);

    const bills = await Bill.find({ userId, createdAt: { $gte: start, $lt: end } })
      .populate('customerId', 'name phone shopName');

    const payments = await Payment.find({ userId, paymentDate: { $gte: start, $lt: end } })
      .populate('customerId', 'name phone shopName')
      .populate('billId', 'billNumber');

    const totalSales = bills.reduce((s, b) => s + b.totalAmount, 0);
    const totalCollected = payments.reduce((s, p) => s + p.amountPaid, 0);
    const totalPending = bills.reduce((s, b) => s + b.dueAmount, 0);
    const totalBills = bills.length;

    // Pending dues report
    const pendingBills = await Bill.find({ userId, status: { $ne: 'paid' } })
      .populate('customerId', 'name phone shopName');

    const now = new Date();
    const pendingDues = pendingBills.map((b) => {
      const penalty = now > new Date(b.dueDate)
        ? Math.floor((now - new Date(b.dueDate)) / (1000 * 60 * 60 * 24)) * b.penaltyPerDay
        : 0;
      return {
        ...b.toObject(),
        accruedPenalty: penalty,
        totalOutstanding: b.dueAmount + penalty,
      };
    });

    res.json({
      success: true,
      report: {
        type,
        startDate: start,
        endDate: end,
        summary: { totalSales, totalCollected, totalPending, totalBills },
        bills,
        payments,
        pendingDues,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

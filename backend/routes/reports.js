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
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }

  switch (type) {
    case 'daily': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      return { start, end };
    }
    case 'weekly': {
      const dayOfWeek = now.getUTCDay();
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - dayOfWeek, 0, 0, 0, 0));
      const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      return { start, end };
    }
    case 'monthly': {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
      return { start, end };
    }
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

    const bills = await Bill.find({ userId, createdAt: { $gte: start, $lte: end } })
      .populate('customerId', 'name phone shopName');

    const payments = await Payment.find({ userId, paymentDate: { $gte: start, $lte: end } })
      .populate('customerId', 'name phone shopName')
      .populate('billId', 'billNumber');

    const totalSales = bills.reduce((s, b) => s + b.totalAmount, 0);
    const totalCollected = payments.reduce((s, p) => s + p.amountPaid, 0);
    const totalPending = bills.reduce((s, b) => s + b.dueAmount, 0);
    const totalBills = bills.length;

    // Pending dues report (all time outstanding)
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

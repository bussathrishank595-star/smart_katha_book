const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Payment = require('../models/Payment');

router.use(protect);

// @route GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // UTC Date helper boundaries
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
    const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const endOfTomorrow = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));

    const [
      totalCustomers,
      totalBills,
      bills,
      todayPayments,
      monthPayments,
    ] = await Promise.all([
      Customer.countDocuments({ userId }),
      Bill.countDocuments({ userId }),
      Bill.find({ userId }),
      Payment.find({ userId, paymentDate: { $gte: startOfToday, $lte: endOfToday } }),
      Payment.find({ userId, paymentDate: { $gte: startOfMonth } }),
    ]);

    let totalSales = 0;
    let totalPending = 0;
    let overdueCount = 0;
    let dueTodayCount = 0;
    let dueTomorrowCount = 0;

    bills.forEach((bill) => {
      totalSales += bill.totalAmount;
      if (bill.dueAmount > 0) {
        totalPending += bill.dueAmount;
        const dueDate = new Date(bill.dueDate);
        if (now > dueDate) {
          overdueCount++;
        } else if (
          dueDate >= startOfToday &&
          dueDate <= endOfToday
        ) {
          dueTodayCount++;
        } else if (
          dueDate >= startOfTomorrow &&
          dueDate <= endOfTomorrow
        ) {
          dueTomorrowCount++;
        }
      }
    });

    const todayCollection = todayPayments.reduce((s, p) => s + p.amountPaid, 0);
    const monthCollection = monthPayments.reduce((s, p) => s + p.amountPaid, 0);

    res.json({
      success: true,
      stats: {
        totalCustomers,
        totalBills,
        totalSales,
        totalPending,
        overdueCount,
        dueTodayCount,
        dueTomorrowCount,
        todayCollection,
        monthCollection,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/dashboard/charts
router.get('/charts', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Last 6 months labels using UTC
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 0, 23, 59, 59, 999));
      months.push({
        label: start.toLocaleString('default', { month: 'short' }),
        start,
        end,
      });
    }

    const monthlySales = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const bills = await Bill.find({ userId, createdAt: { $gte: start, $lte: end } });
        const sales = bills.reduce((s, b) => s + b.totalAmount, 0);
        const collected = bills.reduce((s, b) => s + b.paidAmount, 0);
        const due = bills.reduce((s, b) => s + b.dueAmount, 0);
        return { month: label, sales, collected, due };
      })
    );

    // Status distribution for pie chart
    const [paid, pending, overdue, partial] = await Promise.all([
      Bill.countDocuments({ userId, status: 'paid' }),
      Bill.countDocuments({ userId, status: 'pending' }),
      Bill.countDocuments({ userId, status: 'overdue' }),
      Bill.countDocuments({ userId, status: 'partial' }),
    ]);

    res.json({
      success: true,
      charts: {
        monthlySales,
        statusDistribution: [
          { name: 'Paid', value: paid, color: '#10b981' },
          { name: 'Pending', value: pending, color: '#f59e0b' },
          { name: 'Overdue', value: overdue, color: '#ef4444' },
          { name: 'Partial', value: partial, color: '#6366f1' },
        ],
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/dashboard/alerts
router.get('/alerts', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
    const endOfTomorrow = new Date(endOfToday.getTime() + 24 * 60 * 60 * 1000);

    const bills = await Bill.find({ userId, status: { $ne: 'paid' } })
      .populate('customerId', 'name phone shopName')
      .sort({ dueDate: 1 });

    const overdue = [];
    const dueToday = [];
    const dueTomorrow = [];
    const upcoming = [];

    bills.forEach((bill) => {
      const dueDate = new Date(bill.dueDate);
      const penalty = bill.dueAmount > 0 && now > dueDate
        ? Math.floor((now - dueDate) / (1000 * 60 * 60 * 24)) * bill.penaltyPerDay
        : 0;

      const item = {
        ...bill.toObject(),
        accruedPenalty: penalty,
        totalOutstanding: bill.dueAmount + penalty,
      };

      if (now > dueDate) overdue.push(item);
      else if (dueDate >= startOfToday && dueDate <= endOfToday) dueToday.push(item);
      else if (dueDate > endOfToday && dueDate <= endOfTomorrow) dueTomorrow.push(item);
      else upcoming.push(item);
    });

    res.json({ success: true, overdue, dueToday, dueTomorrow, upcoming });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

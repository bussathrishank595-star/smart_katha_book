const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Customer = require('../models/Customer');

router.use(protect);

// Helper: recalculate penalty
const getPenalty = (bill) => {
  const now = new Date();
  if (bill.dueAmount > 0 && now > new Date(bill.dueDate)) {
    const daysOverdue = Math.floor((now - new Date(bill.dueDate)) / (1000 * 60 * 60 * 24));
    return daysOverdue * bill.penaltyPerDay;
  }
  return 0;
};

// @route GET /api/bills
router.get('/', async (req, res) => {
  try {
    const { status, customerId, page = 1, limit = 50 } = req.query;
    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (customerId) query.customerId = customerId;

    const bills = await Bill.find(query)
      .populate('customerId', 'name phone shopName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const now = new Date();
    const billsWithPenalty = bills.map((b) => {
      const obj = b.toObject();
      obj.accruedPenalty = getPenalty(obj);
      obj.totalOutstanding = obj.dueAmount + obj.accruedPenalty;
      return obj;
    });

    const total = await Bill.countDocuments(query);
    res.json({ success: true, bills: billsWithPenalty, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/bills/:id
router.get('/:id', async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('customerId', 'name phone shopName email address');
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const payments = await Payment.find({ billId: req.params.id }).sort({ paymentDate: -1 });

    const obj = bill.toObject();
    obj.accruedPenalty = getPenalty(obj);
    obj.totalOutstanding = obj.dueAmount + obj.accruedPenalty;

    res.json({ success: true, bill: obj, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/bills
router.post('/', async (req, res) => {
  try {
    const {
      customerId, items, totalAmount, paidAmount = 0,
      creditDays = 30, penaltyPerDay, notes
    } = req.body;

    if (!customerId || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer and items are required' });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + creditDays);

    const dueAmount = totalAmount - paidAmount;
    const billNumber = await Bill.generateBillNumber(req.user._id);

    const bill = await Bill.create({
      userId: req.user._id,
      customerId,
      billNumber,
      items,
      totalAmount,
      paidAmount,
      dueAmount,
      creditDays,
      dueDate,
      penaltyPerDay: penaltyPerDay || req.user.defaultPenaltyPerDay || 10,
      status: dueAmount <= 0 ? 'paid' : 'pending',
      notes,
    });

    // Update customer totals
    await Customer.findByIdAndUpdate(customerId, {
      $inc: {
        totalPurchases: totalAmount,
        totalPaid: paidAmount,
        totalDue: dueAmount,
      },
    });

    // Record initial payment if any
    if (paidAmount > 0) {
      await Payment.create({
        billId: bill._id,
        customerId,
        userId: req.user._id,
        amountPaid: paidAmount,
        remainingDue: dueAmount,
        notes: 'Initial payment',
      });
    }

    res.status(201).json({ success: true, bill });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/bills/:id/payment  — add partial payment
router.post('/:id/payment', async (req, res) => {
  try {
    const { amountPaid, paymentMethod, notes } = req.body;

    if (!amountPaid || amountPaid <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount required' });
    }

    const bill = await Bill.findOne({ _id: req.params.id, userId: req.user._id });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    const penalty = getPenalty(bill.toObject());
    const totalOwed = bill.dueAmount + penalty;

    if (amountPaid > totalOwed) {
      return res.status(400).json({ success: false, message: 'Payment exceeds outstanding amount' });
    }

    bill.paidAmount += amountPaid;
    bill.dueAmount = Math.max(0, bill.dueAmount - amountPaid);
    bill.updateStatus();
    await bill.save();

    // Record payment
    const payment = await Payment.create({
      billId: bill._id,
      customerId: bill.customerId,
      userId: req.user._id,
      amountPaid,
      remainingDue: bill.dueAmount,
      paymentMethod: paymentMethod || 'cash',
      notes,
    });

    // Update customer totals
    await Customer.findByIdAndUpdate(bill.customerId, {
      $inc: { totalPaid: amountPaid, totalDue: -amountPaid },
    });

    const updatedBill = bill.toObject();
    updatedBill.accruedPenalty = getPenalty(updatedBill);
    updatedBill.totalOutstanding = updatedBill.dueAmount + updatedBill.accruedPenalty;

    res.json({ success: true, bill: updatedBill, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route DELETE /api/bills/:id
router.delete('/:id', async (req, res) => {
  try {
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });

    await Payment.deleteMany({ billId: req.params.id });

    // Reverse customer totals
    await Customer.findByIdAndUpdate(bill.customerId, {
      $inc: {
        totalPurchases: -bill.totalAmount,
        totalPaid: -bill.paidAmount,
        totalDue: -bill.dueAmount,
      },
    });

    res.json({ success: true, message: 'Bill deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

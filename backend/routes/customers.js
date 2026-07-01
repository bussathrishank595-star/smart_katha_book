const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');

// All routes protected
router.use(protect);

// @route GET /api/customers
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const query = { userId: req.user._id };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { shopName: { $regex: search, $options: 'i' } },
      ];
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Customer.countDocuments(query);

    res.json({ success: true, customers, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route GET /api/customers/:id
router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, userId: req.user._id });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });

    // Get all bills for this customer with penalty calculation
    const bills = await Bill.find({ customerId: req.params.id, userId: req.user._id })
      .sort({ createdAt: -1 });

    const now = new Date();
    const billsWithPenalty = bills.map((bill) => {
      const b = bill.toObject();
      if (b.dueAmount > 0 && now > new Date(b.dueDate)) {
        const daysOverdue = Math.floor((now - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
        b.accruedPenalty = daysOverdue * b.penaltyPerDay;
        b.totalOutstanding = b.dueAmount + b.accruedPenalty;
      } else {
        b.totalOutstanding = b.dueAmount;
      }
      return b;
    });

    const payments = await Payment.find({ customerId: req.params.id, userId: req.user._id })
      .sort({ paymentDate: -1 });

    res.json({ success: true, customer, bills: billsWithPenalty, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/customers
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, shopName, address, notes } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone are required' });
    }

    const customer = await Customer.create({
      userId: req.user._id,
      name, phone, email, shopName, address, notes,
    });

    res.status(201).json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/customers/:id
router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route DELETE /api/customers/:id
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    // Optionally delete related bills and payments
    await Bill.deleteMany({ customerId: req.params.id });
    await Payment.deleteMany({ customerId: req.params.id });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Payment = require('../models/Payment');

router.use(protect);

// @route GET /api/payments
router.get('/', async (req, res) => {
  try {
    const { customerId, billId, page = 1, limit = 50 } = req.query;
    const query = { userId: req.user._id };
    if (customerId) query.customerId = customerId;
    if (billId) query.billId = billId;

    const payments = await Payment.find(query)
      .populate('customerId', 'name phone shopName')
      .populate('billId', 'billNumber totalAmount')
      .sort({ paymentDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Payment.countDocuments(query);
    res.json({ success: true, payments, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

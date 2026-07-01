const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bill',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    remainingDue: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'bank_transfer', 'cheque', 'other'],
      default: 'cash',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);

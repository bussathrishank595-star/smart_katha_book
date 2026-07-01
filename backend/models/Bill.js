const mongoose = require('mongoose');

const billItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'pcs' },
  subtotal: { type: Number, required: true },
});

const billSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    billNumber: {
      type: String,
      required: true,
    },
    items: [billItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    creditDays: {
      type: Number,
      default: 30,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    penaltyPerDay: {
      type: Number,
      default: 10,
    },
    accruedPenalty: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue', 'partial'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index: billNumber must be unique PER shopkeeper (userId)
billSchema.index({ billNumber: 1, userId: 1 }, { unique: true });

// Auto-update status and accruedPenalty
billSchema.methods.updateStatus = function () {
  const now = new Date();
  if (this.dueAmount <= 0) {
    this.status = 'paid';
    this.accruedPenalty = 0;
  } else if (now > this.dueDate) {
    this.status = 'overdue';
    const daysOverdue = Math.floor((now - this.dueDate) / (1000 * 60 * 60 * 24));
    this.accruedPenalty = daysOverdue * this.penaltyPerDay;
  } else if (this.paidAmount > 0 && this.dueAmount > 0) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }
};

// Generate sequential bill number
billSchema.statics.generateBillNumber = async function (userId) {
  const count = await this.countDocuments({ userId });
  const padded = String(count + 1).padStart(4, '0');
  return `KB-${padded}`;
};

module.exports = mongoose.model('Bill', billSchema);

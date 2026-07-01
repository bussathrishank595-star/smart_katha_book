require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const billRoutes = require('./routes/bills');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');

const app = express();

app.use(cors());
app.use(express.json());

// Seed default admin only if it does NOT exist. Never delete on startup.
async function seedDefaultAdmin() {
  try {
    const admin = await User.findOne({ email: 'admin@kathabook.com' });
    if (!admin) {
      // Hash 'admin123' manually
      const salt = await bcrypt.genSalt(10);
      const preHashedPassword = await bcrypt.hash('admin123', salt);

      // Save directly to database
      await mongoose.connection.collection('users').insertOne({
        name: 'Admin Shopkeeper',
        email: 'admin@kathabook.com',
        password: preHashedPassword,
        shopName: 'My Smart Katha Book',
        phone: '9999999999',
        address: 'Main Shop Market',
        defaultPenaltyPerDay: 10,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Default admin seeded: admin@kathabook.com / admin123 (hashed exactly once)');
    } else {
      console.log('ℹ️ Admin user already exists in database. Skipping seed.');
    }
  } catch (err) {
    console.error('❌ Admin seed error:', err);
  }
}

// Drop the old global index automatically
async function dropDuplicateIndex() {
  try {
    await mongoose.connection.collection('bills').dropIndex('billNumber_1');
    console.log('🗑️ Successfully dropped old global unique index billNumber_1');
  } catch (err) {
    console.log('ℹ️ Global index billNumber_1 not present or already dropped');
  }
}

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    seedDefaultAdmin();
    dropDuplicateIndex();
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

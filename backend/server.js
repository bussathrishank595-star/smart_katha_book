require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
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

// Seed default admin if database is empty
async function seedDefaultAdmin() {
  try {
    // Clear any corrupted/double-hashed admin user first
    await User.deleteMany({ email: 'admin@kathabook.com' });

    // Create user with PLAIN password 'admin123'
    // The User model schema pre-save hook will hash it exactly once.
    await User.create({
      name: 'Admin Shopkeeper',
      email: 'admin@kathabook.com',
      password: 'admin123',
      shopName: 'My Smart Katha Book',
      phone: '9999999999',
      address: 'Main Shop Market',
      defaultPenaltyPerDay: 10
    });
    console.log('✅ Default admin seeded: admin@kathabook.com / admin123 (hashed once)');
  } catch (err) {
    console.error('❌ Admin seed error:', err);
  }
}

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    seedDefaultAdmin();
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

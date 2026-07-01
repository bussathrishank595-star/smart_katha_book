const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');

router.use(protect);

// @route GET /api/products
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = { userId: req.user._id };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (category) query.category = category;

    const products = await Product.find(query).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route POST /api/products
router.post('/', async (req, res) => {
  try {
    const { name, category, price, unit, stockQuantity } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name and price are required' });
    }
    const product = await Product.create({
      userId: req.user._id,
      name, category, price, unit, stockQuantity,
    });
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const { initDatabase } = require('./config/db');
const { seedDatabase } = require('./config/seed');

// Initialize database schema and auto-seed if first run
initDatabase();
seedDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve static frontend assets
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'OrderMe E-Commerce API',
    version: '1.0.0'
  });
});

// Mount REST API routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const productController = require('./controllers/productController');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', productController.getCategories);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 OrderMe E-Commerce Server is running on port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`🛒 Storefront: http://localhost:${PORT}/index.html`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin.html`);
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

module.exports = app;

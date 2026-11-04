require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { getJwtSecret } = require('./config/jwt');

// Fail fast rather than starting with a predictable or missing signing secret.
getJwtSecret();

const { initDatabase } = require('./config/db');
const { seedDatabase } = require('./config/seed');

// Initialize database schema and auto-seed on first run.
initDatabase();
seedDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.static(path.join(__dirname)));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'OrderMe E-Commerce API',
    version: '1.0.0'
  });
});

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

const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`OrderMe API is running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
});

module.exports = app;

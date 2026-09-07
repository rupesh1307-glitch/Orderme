const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, optionalAuth } = require('../middleware/auth');

router.post('/', optionalAuth, orderController.createOrder);
router.get('/', authenticate, orderController.getUserOrders);
router.get('/track/:identifier', orderController.trackOrder);
router.get('/:id', optionalAuth, orderController.getOrderById);
router.put('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;
